// Release guards for the public Settiva site. No environment files are read.
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const failures = [];
let checks = 0;
function check(condition, message) {
  checks++;
  if (!condition) failures.push(message);
}
async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}
async function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(path.join(directory, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(directory, relative));
    else if (entry.isFile()) files.push(relative);
    else check(false, `Unexpected linked or special public file: ${path.join(directory, relative)}`);
  }
  return files.sort();
}
const textExtensions = new Set([".html", ".vue", ".js", ".css", ".json", ".svg", ".txt"]);
const blockedHosts = ["twitter.com", "x.com", "t.co"];
const previousIdentity = /yovinx|tallyvein|quilsted|findelora|factrelle|inquedra|tessivra|vercairn|siftlane|citeward|civiquill|proofora|evidara|evidalume|buidlspur|bountelith|cairnora|veriqora|citevra|attestora/i;
// Bookmark keys are the only place an earlier brand may survive, because the
// migration path has to read the old keys to move a user's saved list forward.
const legacyBookmarkKeys = "(?:yovinx|tallyvein|quilsted|buidlspur|citevra|attestora|evidalume|bountelith|findelora|factrelle|inquedra|tessivra|vercairn|siftlane|citeward|civiquill|proofora)-saved";
const withoutDeployedIdentity = text => text.replace(/\bEvidaraEscrow\b|\bEvidara:/g, 'deployed-contract-identity');
function checkPublicCopy(text, label) {
  const displayCopy = withoutDeployedIdentity(text).replace(new RegExp(`(["'\`])${legacyBookmarkKeys}\\1`, "g"), '"legacy-bookmarks"');
  check(!previousIdentity.test(displayCopy), `${label}: obsolete brand remains outside bookmark migration keys`);
  const normalized = text.replace(/\\\//g, "/");
  for (const match of normalized.matchAll(/(?:https?:)?\/\/[^\s<>"'`\\)]+/gi)) {
    try {
      const url = new URL(match[0].startsWith("//") ? `https:${match[0]}` : match[0]);
      const host = url.hostname.toLowerCase().replace(/\.+$/, "");
      check(!blockedHosts.some(blocked => host === blocked || host.endsWith(`.${blocked}`)), `${label}: prohibited social URL ${match[0]}`);
    } catch { /* Other checks handle local asset references. */ }
  }
  check(!/<meta\b[^>]*(?:name|property)\s*=\s*["']twitter:/i.test(text), `${label}: Twitter metadata must be absent`);
}
async function checkDynamicLinks(site, label) {
  // Load the real exported URL guard without mounting Vue or reading local env.
  const source = (await readFile(path.join(site, "src/composables/useMissions.js"), "utf8"))
    .replace("from 'vue'", `from '${import.meta.resolve('vue')}'`)
    .replace(/^import \{[\s\S]*?\} from ['"]\.\.\/config['"];\s*/m, "const APP_NAME = 'Settiva', LAMPORTS_PER_SOL = 1000000000n, SOLANA_CLUSTER = 'testnet', SOLANA_EXPLORER_URL = 'https://explorer.solana.com', SOLANA_NETWORK_NAME = 'Solana Testnet', SOLANA_PROGRAM_ID = '5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu', SOLANA_PROGRAM_READY = false, SOLANA_RPC_URL = 'https://api.testnet.solana.com', SOLANA_TOKEN_MINT = '', SOLANA_TOKEN_SYMBOL = 'TOKEN';\n")
    .replace("import { createSolanaProgramClient } from '../utils/solanaProgram';", "const createSolanaProgramClient = () => { throw new Error('Live client should not be created by the link guard.'); };");
  const { safeExternalUrl } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  for (const host of blockedHosts) {
    for (const uri of [`https://${host}/brief`, `http://sub.${host.toUpperCase()}./evidence`, `https://explorer.${host}../tx/0x123`]) {
      check(safeExternalUrl(uri) === "", `${label}: dynamic social destination allowed: ${uri}`);
    }
  }
  for (const uri of ["https://example.org/research", "https://x.com.example.org/brief", "ipfs://Qm123456789abc/evidence.json"]) {
    check(Boolean(safeExternalUrl(uri)), `${label}: legal research destination rejected: ${uri}`);
  }
}
async function checkAsset(site, relativeFile, reference, kind = "asset") {
  const value = reference.trim();
  if (!value || value.startsWith("#") || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) || value.includes("${")) return;
  let resolved;
  if (value.startsWith("%BASE_URL%")) resolved = path.join(site, "public", value.slice(10));
  else if (value.startsWith("/src/")) resolved = path.join(site, value.slice(1));
  else if (value.startsWith("/")) resolved = path.join(site, "public", value.slice(1));
  else resolved = path.resolve(site, path.dirname(relativeFile), value.split(/[?#]/)[0]);
  const candidates = kind === "import" ? [resolved, `${resolved}.js`, `${resolved}.vue`, `${resolved}.json`] : [resolved];
  check((await Promise.all(candidates.map(exists))).some(Boolean), `${path.relative(root, site) || "main"}/${relativeFile}: missing ${kind} ${value}`);
}

const trees = [];
for (const site of [root, path.join(root, "a702")]) {
  const label = path.relative(root, site) || "main";
  const index = await readFile(path.join(site, "index.html"), "utf8");
  const app = await readFile(path.join(site, "src", "App.vue"), "utf8");
  const indexComponent = await readFile(path.join(site, "src", "components", "BriefIndex.vue"), "utf8");
  const config = await readFile(path.join(site, "src", "config.js"), "utf8");
  const manifest = JSON.parse(await readFile(path.join(site, "package.json"), "utf8"));
  check(/<title>\s*Settiva\b[^<]*<\/title>/i.test(index), `${label}: title must use Settiva`);
  check(/<meta\b[^>]*name=["']theme-color["'][^>]*content=["']#000000["']/i.test(index), `${label}: theme colour must match the dark field`);
  check(/<meta\b[^>]*property=["']og:site_name["'][^>]*content=["']Settiva["']/i.test(index), `${label}: Open Graph site name must be Settiva`);
  check(/aria-label=["']Settiva home["']/.test(app), `${label}: accessible home identity must use Settiva`);
  check(/APP_NAME\s*=\s*["']Settiva["']/.test(config), `${label}: app configuration must use Settiva`);
  check(manifest.name === "settiva", `${label}: package name must be settiva`);
  check(/class=["']mast["']/.test(app), `${label}: the ticker masthead must ship`);
  check(/class=["']index-deck["']/.test(indexComponent), `${label}: the ticker index must ship`);
  for (const retiredClass of ["chain-header", "tab-rail", "filter-bar", "status-strip", "inspector", "reg-row", "deck-body", "masthead", "index-sheet", "edition-card", "colophon-grid", "entry-stack", "hero-grid"]) {
    check(!new RegExp(`class=["'][^"']*\\b${retiredClass}\\b`).test(app), `${label}: retired terminal surface is still in App.vue: ${retiredClass}`);
  }
  for (const obsolete of ["meterial.txt", "src/abi.json", "src/EvidaraEscrow.abi.json", "src/styles/quilsted-workbench.css", "src/styles/evidalume.css", "src/styles/settiva-terminal.css", "src/components/ChainReadout.vue", "src/components/BriefRegistry.vue", "src/components/BriefInspector.vue"]) {
    check(!await exists(path.join(site, obsolete)), `${label}: obsolete material remains: ${obsolete}`);
  }
  for (const asset of ["settiva-mark.svg", "settiva-seal.svg", "settiva-favicon.svg", "settiva-edition-social.png"]) {
    check(await exists(path.join(site, "public", asset)), `${label}: required local asset is missing: ${asset}`);
  }
  for (const retired of [
    "fonts/jetbrains-mono-latin.woff2", "fonts/JetBrains-Mono-OFL.txt",
    "fonts/space-grotesk-latin.woff2", "fonts/Space-Grotesk-OFL.txt",
    "fonts/dm-sans-latin.woff2", "fonts/fraunces-latin.woff2",
    "fonts/DM-Sans-OFL.txt", "fonts/Fraunces-OFL.txt",
  ]) {
    check(!await exists(path.join(site, "public", retired)), `${label}: retired font still shipped: ${retired}`);
  }
  const tree = {};
  for (const folder of ["src", "public"]) tree[folder] = await listFiles(path.join(site, folder));
  trees.push(tree);
  const publicFiles = ["index.html", ...Object.entries(tree).flatMap(([folder, files]) => files.map(file => path.join(folder, file)))];
  for (const file of publicFiles) {
    check(!previousIdentity.test(withoutDeployedIdentity(file)), `${label}: obsolete branded source or public filename: ${file}`);
    if (!textExtensions.has(path.extname(file))) continue;
    const text = await readFile(path.join(site, file), "utf8");
    checkPublicCopy(text, `${label}/${file}`);
    if (!/\.(?:html|vue|js|css)$/.test(file)) continue;
    for (const match of text.matchAll(/\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?["'](\.[^"']+)["']/g)) await checkAsset(site, file, match[1], "import");
    for (const match of text.matchAll(/(?<![:\w-])(?:src|href)\s*=\s*["']([^"']+)["']/g)) await checkAsset(site, file, match[1]);
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) await checkAsset(site, file, match[1]);
    for (const match of text.matchAll(/(?:%BASE_URL%|\$\{import\.meta\.env\.BASE_URL\})([^"'`\s<>]+)/g)) await checkAsset(site, file, `%BASE_URL%${match[1]}`);
  }
  await checkDynamicLinks(site, label);
  const distribution = path.join(site, "dist");
  check(await exists(path.join(distribution, "index.html")), `${label}: production build is missing`);
  if (await exists(distribution)) {
    for (const file of await listFiles(distribution)) {
      check(!previousIdentity.test(withoutDeployedIdentity(file)), `${label}/dist: obsolete branded filename: ${file}`);
      check(!/(?:^|[\\/])(?:\.env(?:\.|$)|key\.txt$|node_modules(?:[\\/]|$)|scripts(?:[\\/]|$)|output(?:[\\/]|$))|\.(?:psd|ai|fig|sketch|xcf|zip|bak|blend)$/i.test(file), `${label}/dist: non-public original or local material: ${file}`);
      if (textExtensions.has(path.extname(file))) checkPublicCopy(await readFile(path.join(distribution, file), "utf8"), `${label}/dist/${file}`);
    }
  }
}
for (const folder of ["src", "public"]) {
  const mainFiles = trees[0][folder], mirrorFiles = trees[1][folder];
  check(JSON.stringify(mainFiles) === JSON.stringify(mirrorFiles), `${folder}: mirror file inventory differs; run npm run sync:mirror`);
  for (const file of mainFiles.filter(file => mirrorFiles.includes(file))) {
    const [main, mirror] = await Promise.all([root, path.join(root, "a702")].map(site => readFile(path.join(site, folder, file))));
    check(main.equals(mirror), `${folder}/${file}: mirror content differs; run npm run sync:mirror`);
  }
}
for (const file of ["index.html", "vite.config.js", "package-lock.json"]) {
  const [main, mirror] = await Promise.all([root, path.join(root, "a702")].map(site => readFile(path.join(site, file))));
  check(main.equals(mirror), `${file}: mirror content differs; run npm run sync:mirror`);
}
// Workspace brand record: the selected identity must stay consistent with the
// shipped site and must never be distributed.
const workspace = path.dirname(root);
const brandingKey = path.join(workspace, "key.txt.branding");
if (await exists(brandingKey)) {
  const record = await readFile(brandingKey, "utf8");
  for (const [label, pattern] of [
    ["brand name", /^Brand:\s*Settiva\s*$/m],
    ["slug", /^Slug:\s*settiva\s*$/m],
    ["tagline", /^Tagline:\s*Two paths in\. One record out\.\s*$/m],
    ["canonical domain", /^Canonical domain:\s*https:\/\/settiva\.xyz\/\s*$/m],
    ["X handle", /^X:\s*@settiva\b/m],
    ["testnet network", /^Network:\s*Solana testnet preview\s*$/m],
    ["no live token", /^Token:\s*no platform token or CA is live\s*$/m],
  ]) check(pattern.test(record), `key.txt.branding: ${label} is missing or does not match the shipped Settiva identity`);
  check(previousIdentity.test(record.replace(/\bsettiva-/g, "")) === false, "key.txt.branding: obsolete brand remains");
}
const listedIdentity = await readFile(path.join(workspace, "list.txt"), "utf8");
check(/^Brand:\s*Settiva\s*$/m.test(listedIdentity), "list.txt: public brand record must use Settiva");
check(/^Canonical domain:\s*settiva\.xyz\s*$/m.test(listedIdentity), "list.txt: canonical domain must be settiva.xyz");
check(/^X handle:\s*@settiva\s*$/m.test(listedIdentity), "list.txt: X handle must be @settiva");
for (const site of [root, path.join(root, "a702")]) {
  for (const local of ["dist/key.txt", "dist/key.txt.branding", "public/key.txt", "public/key.txt.branding"]) {
    check(!await exists(path.join(site, local)), `${path.relative(root, site) || "main"}: local key material must never enter public output: ${local}`);
  }
}
if (failures.length) {
  console.error(`Settiva site guard failed (${failures.length}/${checks} checks):\n${failures.map(message => `- ${message}`).join("\n")}`);
  process.exitCode = 1;
} else console.log(`Settiva site guard passed: ${checks} checks; source/build branding, local assets, dynamic social-link policy and mirror consistency verified.`);
