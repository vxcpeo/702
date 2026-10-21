/**
 * QA runner: starts a local Vite preview of the built site, runs one of the
 * browser QA suites against it, then stops the server and forwards the exit
 * code.
 *
 * Usage:
 *   node scripts/qa/run.mjs state-audit [url]
 *   node scripts/qa/run.mjs flow-suite  [url]
 *
 * With a url, no server is started and the suite audits that origin. Without
 * one, `vite preview` is started on a free local port. The suites read the same
 * origin from REVIEW_URL.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const suites = {
  "state-audit": path.join(here, "state-audit.mjs"),
  "flow-suite": path.join(here, "flow-suite.mjs"),
};

const [name, urlArg] = process.argv.slice(2);
const suite = suites[name];
if (!suite) {
  console.error(`Unknown QA suite "${name}". Use one of: ${Object.keys(suites).join(", ")}`);
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitFor(url, timeoutMs = 40000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (response.ok) return true;
    } catch { /* server is still booting */ }
    await sleep(300);
  }
  return false;
}

function killTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  try { process.kill(-pid, "SIGTERM"); } catch { /* already gone */ }
}

const runSuite = (url) => new Promise((resolve) => {
  const child = spawn(process.execPath, [suite], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, REVIEW_URL: url },
  });
  child.on("exit", (code) => resolve(code ?? 1));
  child.on("error", (error) => {
    console.error(error);
    resolve(1);
  });
});

async function main() {
  if (urlArg) {
    process.exit(await runSuite(urlArg));
  }
  const port = await freePort();
  const url = `http://127.0.0.1:${port}/`;
  const vite = path.join(root, "node_modules", "vite", "bin", "vite.js");
  const server = spawn(process.execPath, [vite, "preview", "--port", String(port), "--host", "127.0.0.1"], {
    cwd: root,
    stdio: "ignore",
    windowsHide: true,
  });
  try {
    const ready = await waitFor(url);
    if (!ready) {
      console.error(`preview server did not answer on ${url}`);
      process.exitCode = 1;
      return;
    }
    process.exitCode = await runSuite(url);
  } finally {
    killTree(server.pid);
  }
}

await main();
