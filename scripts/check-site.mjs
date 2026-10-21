// Release guards for the public Ledgiva site. No environment files are read.
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
const previousIdentity = /settiva|yovinx|tallyvein|quilsted|findelora|factrelle|inquedra|tessivra|vercairn|siftlane|citeward|civiquill|proofora|evidara|evidalume|buidlspur|bountelith|cairnora|veriqora|citevra|attestora|trovane|vouchra/i;
// Bookmark keys are the only place an earlier brand may survive, because the
// migration path has to read the old keys to move a user's saved list forward.
const legacyBookmarkKeys = "(?:settiva|yovinx|tallyvein|quilsted|buidlspur|citevra|attestora|evidalume|bountelith|findelora|factrelle|inquedra|tessivra|vercairn|siftlane|citeward|civiquill|proofora|trovane)-saved";
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
    .replace(/^import \{[\s\S]*?\} from ['"]\.\.\/config['"];\s*/m, "const APP_NAME = 'Ledgiva', LAMPORTS_PER_SOL = 1000000000n, SOLANA_CLUSTER = 'testnet', SOLANA_EXPLORER_URL = 'https://explorer.solana.com', SOLANA_NETWORK_NAME = 'Solana Testnet', SOLANA_PROGRAM_ID = '5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu', SOLANA_PROGRAM_READY = false, SOLANA_RPC_URL = 'https://api.testnet.solana.com', SOLANA_TOKEN_MINT = '', SOLANA_TOKEN_SYMBOL = 'TOKEN';\n")
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

const sheetField = (await readFile(path.join(root, "src", "styles", "poster-press.css"), "utf8")).match(/--field:\s*(#[0-9a-fA-F]{3,8})/)?.[1] || "";
check(/^#[0-9a-f]{6}$/i.test(sheetField), "poster-press.css: the --field token must declare the page colour");

const trees = [];
for (const site of [root, path.join(root, "a702")]) {
  const label = path.relative(root, site) || "main";
  const index = await readFile(path.join(site, "index.html"), "utf8");
  const app = await readFile(path.join(site, "src", "App.vue"), "utf8");
  const indexComponent = await readFile(path.join(site, "src", "components", "BriefIndex.vue"), "utf8");
  const config = await readFile(path.join(site, "src", "config.js"), "utf8");
  const manifest = JSON.parse(await readFile(path.join(site, "package.json"), "utf8"));
  check(/<title>\s*Ledgiva\b[^<]*<\/title>/i.test(index), `${label}: title must use Ledgiva`);
  check(new RegExp(`<meta\\b[^>]*name=["']theme-color["'][^>]*content=["']${sheetField}["']`, "i").test(index), `${label}: theme colour must match the poster field ${sheetField}`);
  check(/<meta\b[^>]*name=["']color-scheme["'][^>]*content=["']light["']/i.test(index), `${label}: the poster press is a light edition`);
  check(/<meta\b[^>]*property=["']og:site_name["'][^>]*content=["']Ledgiva["']/i.test(index), `${label}: Open Graph site name must be Ledgiva`);
  check(/aria-label=["']Ledgiva home["']/.test(app), `${label}: accessible home identity must use Ledgiva`);
  check(/APP_NAME\s*=\s*["']Ledgiva["']/.test(config), `${label}: app configuration must use Ledgiva`);
  check(manifest.name === "ledgiva", `${label}: package name must be ledgiva`);
  check(/class=["']press["']/.test(app), `${label}: the poster press shell must ship`);
  check(/class=["']mast["']/.test(app), `${label}: the poster masthead must ship`);
  check(/class=["']route-wall["']/.test(app), `${label}: the poster route wall must ship`);
  check(/class=["']dock["']/.test(app), `${label}: the floating dock must ship`);
  check(/class=["']scene scene--board["']/.test(app), `${label}: the board scene must ship`);
  check(/class=["']card-wall["']/.test(indexComponent), `${label}: the poster card wall must ship`);
  check(/class=["']facts-band["']/.test(indexComponent), `${label}: the ink facts band must ship`);
  for (const retiredClass of [
    "masthead", "mast-edition", "mast-plate", "mast-identity", "mast-sigil", "mast-lockup", "mast-word", "mast-tools",
    "route-line", "route-item", "route-count", "lede-spread", "lede-copy", "lede-title", "lede-prose", "lede-acts",
    "marginalia", "figure-register", "figure-row", "colophon", "registry-section", "registry-head", "registry-body",
    "registry-ledger", "register-row", "register-open", "register-no", "register-brief", "register-topic",
    "register-title", "register-copy", "register-stats", "register-pool", "register-when", "register-state",
    "register-keep", "register-foot", "summary-aside", "summary-figures", "summary-figure", "summary-note",
    "dossier-file", "dossier-mast", "dossier-title", "dossier-facts", "pool-band", "pool-figure", "pool-number",
    "split-bar", "split-track", "split-key", "dossier-columns", "dossier-main", "chapter-head", "chapter-no",
    "chapter-title", "chapter-copy", "deliverable-list", "byline", "questionnaire", "entry-ask", "entry-lede",
    "evidence-file", "evidence-head", "evidence-sig", "dossier-aside", "note-card", "guide-file", "guide-mast",
    "guide-title", "step-register", "step-row", "step-index", "rule-chapter", "faq-ledger", "faq-item",
    "contents-plate", "contents-head", "contents-item", "sheet-frame", "sheet-crest", "progress-track",
    "stamp-topic", "sheet-note", "sheet-actions", "readout", "toast", "glyph-key", "quiet-link", "action-core",
    "action-halo", "wallet-pill", "menu-glyph", "jump-start", "overline", "observatory", "document",
  ]) {
    check(!new RegExp(`class=["'][^"']*\\b${retiredClass}\\b`).test(app), `${label}: retired documentary surface is still in App.vue: ${retiredClass}`);
  }
  for (const retiredClass of [
    "registry-section", "registry-head", "registry-ledger", "registry-title", "registry-note", "registry-acts",
    "query-row", "query-field", "query-clear", "query-order", "topic-line", "topic-rail", "topic-chip",
    "summary-aside", "summary-figures", "summary-figure", "summary-note", "register", "register-row",
    "register-open", "register-no", "register-brief", "register-topic", "register-title", "register-copy",
    "register-stats", "register-pool", "register-when", "register-state", "register-keep", "register-foot",
    "loading-ledger", "loading-row", "blank-slate", "overline",
  ]) {
    check(!new RegExp(`class=["'][^"']*\\b${retiredClass}\\b`).test(indexComponent), `${label}: retired ledger index surface is still in BriefIndex.vue: ${retiredClass}`);
  }
  check(!/meridian-ledger\.css|spectrum-deck\.css|settiva-ledger\.css/.test(indexComponent + app), `${label}: the retired presentation layer is still imported`);
  for (const obsolete of [
    "meterial.txt", "src/abi.json", "src/EvidaraEscrow.abi.json", "src/styles/quilsted-workbench.css",
    "src/styles/evidalume.css", "src/styles/trovane-terminal.css", "src/styles/meridian-ledger.css",
    "src/components/ChainReadout.vue", "src/components/BriefRegistry.vue", "src/components/BriefInspector.vue",
  ]) {
    check(!await exists(path.join(site, obsolete)), `${label}: obsolete material remains: ${obsolete}`);
  }
  for (const asset of ["ledgiva-mark.svg", "ledgiva-seal.svg", "ledgiva-favicon.svg", "ledgiva-edition-social.png"]) {
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
    ["brand name", /^Brand:\s*Ledgiva\s*$/m],
    ["slug", /^Slug:\s*ledgiva\s*$/m],
    ["tagline", /^Tagline:\s*Two paths in\. One record out\.\s*$/m],
    ["canonical domain", /^Canonical domain:\s*https:\/\/ledgiva\.xyz\/\s*$/m],
    ["X handle", /^X:\s*@ledgiva\b/m],
    ["testnet network", /^Network:\s*Solana testnet preview\s*$/m],
    ["no live token", /^Token:\s*no platform token or CA is live\s*$/m],
  ]) check(pattern.test(record), `key.txt.branding: ${label} is missing or does not match the shipped Ledgiva identity`);
  check(previousIdentity.test(record.replace(/\bledgiva-/g, "")) === false, "key.txt.branding: obsolete brand remains");
}
const listedIdentity = await readFile(path.join(workspace, "list.txt"), "utf8");
check(/^Brand:\s*Ledgiva\s*$/m.test(listedIdentity), "list.txt: public brand record must use Ledgiva");
check(/^Canonical domain:\s*ledgiva\.xyz\s*$/m.test(listedIdentity), "list.txt: canonical domain must be ledgiva.xyz");
check(/^X handle:\s*@ledgiva\s*$/m.test(listedIdentity), "list.txt: X handle must be @ledgiva");
for (const site of [root, path.join(root, "a702")]) {
  for (const local of ["dist/key.txt", "dist/key.txt.branding", "public/key.txt", "public/key.txt.branding"]) {
    check(!await exists(path.join(site, local)), `${path.relative(root, site) || "main"}: local key material must never enter public output: ${local}`);
  }
}
if (failures.length) {
  console.error(`Ledgiva site guard failed (${failures.length}/${checks} checks):\n${failures.map(message => `- ${message}`).join("\n")}`);
  process.exitCode = 1;
} else console.log(`Ledgiva site guard passed: ${checks} checks; source/build branding, poster shell, local assets, dynamic social-link policy and mirror consistency verified.`);
