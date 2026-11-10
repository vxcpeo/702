// Release guards for the public Navrel site. No environment files are read.
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
const canonicalX = "https://x.com/Navrel_site";
// Every retired identity, including the one this round replaced. The guard
// rejects any of them anywhere in the shipped source, build or file names.
const previousIdentity = /settiva|yovinx|tallyvein|quilsted|findelora|factrelle|inquedra|tessivra|vercairn|siftlane|citeward|civiquill|proofora|evidara|evidalume|buidlspur|bountelith|cairnora|veriqora|citevra|attestora|trovane|vouchra|ledgiva|colopha/i;
// Bookmark keys are the only place an earlier brand may survive, because the
// migration path has to read the old keys to move a user's saved list forward.
const legacyBookmarkKeys = "(?:settiva|yovinx|tallyvein|quilsted|buidlspur|citevra|attestora|evidalume|bountelith|findelora|factrelle|inquedra|tessivra|vercairn|siftlane|citeward|civiquill|proofora|trovane|ledgiva|colopha)-saved";
const withoutDeployedIdentity = text => text.replace(/\bEvidaraEscrow\b|\bEvidara:/g, 'deployed-contract-identity');
const withoutLegacybookmarkKeys = text => text.replace(new RegExp(`(["'\`])${legacyBookmarkKeys}\\1`, "g"), '"legacy-bookmarks"');
function checkPublicCopy(text, label) {
  const displayCopy = withoutLegacybookmarkKeys(withoutDeployedIdentity(text));
  check(!previousIdentity.test(displayCopy), `${label}: obsolete brand remains outside bookmark migration keys`);
  check(!/navrel\.xyz/i.test(displayCopy), `${label}: stale navrel.xyz domain remains`);
  check(!/@navrel(?![\w])/i.test(displayCopy), `${label}: stale @navrel handle remains`);
  const normalized = text.replace(/\\\//g, "/");
  for (const match of normalized.matchAll(/(?:https?:)?\/\/[^\s<>"'`\\)]+/gi)) {
    try {
      const url = new URL(match[0].startsWith("//") ? `https:${match[0]}` : match[0]);
      const host = url.hostname.toLowerCase().replace(/\.+$/, "");
      const isCanonicalX = url.protocol === "https:" && host === "x.com" &&
        url.pathname.replace(/\/+$/, "").toLowerCase() === "/navrel_site" && !url.search && !url.hash;
      check(!blockedHosts.some(blocked => host === blocked || host.endsWith(`.${blocked}`)) || isCanonicalX, `${label}: prohibited social URL ${match[0]}`);
    } catch { /* Other checks handle local asset references. */ }
  }
  check(!/<meta\b[^>]*(?:name|property)\s*=\s*["']twitter:/i.test(text), `${label}: Twitter metadata must be absent`);
}
async function checkDynamicLinks(site, label) {
  // Load the real exported URL guard without mounting Vue or reading local env.
  const source = (await readFile(path.join(site, "src/composables/useMissions.js"), "utf8"))
    .replace("from 'vue'", `from '${import.meta.resolve('vue')}'`)
    .replace(/^import \{[\s\S]*?\} from ['"]\.\.\/config['"];\s*/m, "const APP_NAME = 'Navrel', LAMPORTS_PER_SOL = 1000000000n, SOLANA_CLUSTER = 'testnet', SOLANA_EXPLORER_URL = 'https://explorer.solana.com', SOLANA_NETWORK_NAME = 'Solana Testnet', SOLANA_PROGRAM_ID = '5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu', SOLANA_PROGRAM_READY = false, SOLANA_RPC_URL = 'https://api.testnet.solana.com', SOLANA_TOKEN_MINT = '', SOLANA_TOKEN_SYMBOL = 'TOKEN';\n")
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

const sheetField = (await readFile(path.join(root, "src", "styles", "blueprint.css"), "utf8")).match(/--bp-ground:\s*(#[0-9a-fA-F]{6})/)?.[1] || "";
check(/^#[0-9a-f]{6}$/i.test(sheetField), "blueprint.css: the --bp-ground token must declare the page colour");

const trees = [];
for (const site of [root, path.join(root, "a702")]) {
  const label = path.relative(root, site) || "main";
  const index = await readFile(path.join(site, "index.html"), "utf8");
  const app = await readFile(path.join(site, "src", "App.vue"), "utf8");
  const indexComponent = await readFile(path.join(site, "src", "components", "BriefIndex.vue"), "utf8");
  const guideComponent = await readFile(path.join(site, "src", "components", "BriefGuide.vue"), "utf8");
  const config = await readFile(path.join(site, "src", "config.js"), "utf8");
  const manifest = JSON.parse(await readFile(path.join(site, "package.json"), "utf8"));
  check(/<title>\s*Navrel\b[^<]*<\/title>/i.test(index), `${label}: title must use Navrel`);
  check(new RegExp(`<meta\\b[^>]*name=["']theme-color["'][^>]*content=["']${sheetField}["']`, "i").test(index), `${label}: theme colour must match the paper field ${sheetField}`);
  check(/<meta\b[^>]*name=["']color-scheme["'][^>]*content=["']light["']/i.test(index), `${label}: the blueprint is a light edition`);
  check(/<meta\b[^>]*property=["']og:site_name["'][^>]*content=["']Navrel["']/i.test(index), `${label}: Open Graph site name must be Navrel`);
  check(/aria-label=["']Navrel home["']/.test(app), `${label}: accessible home identity must use Navrel`);
  check(/APP_NAME\s*=\s*["']Navrel["']/.test(config), `${label}: app configuration must use Navrel`);
  check(manifest.name === "navrel", `${label}: package name must be navrel`);
  check(index.includes('<link rel="canonical" href="https://navrel.site/"/>'), `${label}: canonical URL must use navrel.site`);
  check(index.includes('<meta property="og:url" content="https://navrel.site/"/>'), `${label}: Open Graph URL must use navrel.site`);
  check(index.includes('<meta property="og:image" content="https://navrel.site/navrel-edition-social.png"/>'), `${label}: Open Graph image must use navrel.site`);
  check(index.includes(`<link rel="me" href="${canonicalX}"/>`), `${label}: canonical X identity link is missing`);
  check(index.includes(`<meta property="og:see_also" content="${canonicalX}"/>`), `${label}: Open Graph X link is missing`);
  const xAnchor = app.match(/<a\b[^>]*href="https:\/\/x\.com\/Navrel_site"[^>]*>/)?.[0] || "";
  check(xAnchor !== "", `${label}: the colophon must link to ${canonicalX}`);
  check(/\brel="[^"]*\bme\b/.test(xAnchor), `${label}: the X link must declare rel="me"`);
  check(/\btarget="_blank"/.test(xAnchor), `${label}: the X link must open in a new tab`);
  check(/@Navrel_site/.test(app), `${label}: the visible X handle must be @Navrel_site`);
  check(/class=["']bp-shell["']/.test(app), `${label}: the blueprint shell must ship`);
  check(/class=["']bp-split["']/.test(app), `${label}: the split stage must ship`);
  check(/<aside[^>]*class=["']bp-rail["']/.test(app), `${label}: the sticky narrative rail must ship`);
  check(/class=["']bp-stage["']/.test(app), `${label}: the data sheet must ship`);
  check(/class=["']bp-band["']/.test(app), `${label}: the edition band must ship`);
  check(/<footer[^>]*class=["']bp-colophon["']/.test(app), `${label}: the colophon must ship`);
  check(/class=["']bp-keys["']/.test(app), `${label}: the route keys must ship`);
  check(/class=["']bp-dialog["']/.test(app), `${label}: the draft sheet dialog must ship`);
  check(/id=["']bp-contents["']/.test(app), `${label}: the contents sheet must ship`);
  check(/class=["']bp-index["'][^>]*aria-labelledby=["']index-title["']/.test(indexComponent), `${label}: the register sheet must ship`);
  check(/class=["']bp-register["']/.test(indexComponent), `${label}: register rows must ship`);
  check(/class=["']bp-entry["']/.test(indexComponent), `${label}: register entries must ship`);
  check(/class=["']bp-tally["']/.test(indexComponent), `${label}: the tally band must ship`);
  check(/class=["']bp-stair["']/.test(guideComponent), `${label}: the numbered stair must ship`);
  check(/class=["']bp-creed["']/.test(guideComponent), `${label}: the creed sections must ship`);
  check(!/nightsheet\.css/.test(app + indexComponent + guideComponent), `${label}: the retired night sheet is still imported`);
  for (const retiredClass of [
    // The poster press (previous edition). Distinctive names only: a bare word
    // such as "fact" would also match the new "case-ledger" vocabulary.
    "mast", "mast-brand", "mast-mark", "mast-ident", "mast-name", "mast-motto", "mast-side", "mast-flag", "mast-acts",
    "press", "press-btn", "press-link", "press-foot", "press-skip", "press-chit", "route-wall", "route-tile", "tile-label",
    "tile-count", "dock", "dock-key", "dock-sheet", "dock-plate", "dock-row", "scene--open", "scene--board",
    "scene-body", "poster-title", "poster-lede", "poster-actions", "note-plate", "note-copy", "foot-plate", "foot-brand",
    "foot-motto", "foot-facts", "foot-fine", "foot-base", "wallet-tag", "sheet-plate", "sheet-head", "sheet-body",
    "sheet-form", "sheet-intro", "sheet-callout", "sheet-cta", "step-strip", "step-line", "review-brief", "review-slip",
    "review-list", "board-head", "board-title", "board-note", "board-tools", "board-foot", "board-empty", "card-wall",
    "record-card", "card-top", "card-no", "card-topic", "card-open", "card-title", "card-copy", "card-ground",
    "card-pool", "card-facts", "card-state", "card-foot", "card-keep", "facts-band", "band-kicker", "band-cell",
    "band-label", "band-value", "band-note", "sticker", "sticker-row", "sticker-group", "sticker-label", "query-bar",
    "search-plate", "search-input", "search-clear", "sort-plate", "sort-select", "skeleton-strip", "skeleton-block",
    "press-input", "press-select", "press-area", "ghost-key", "pulse-dot", "chit-undo", "is-lit", "is-chosen",
    "is-kept", "is-now", "state-strip", "state-sample",
    // The documentary ledger (two editions back).
    "masthead", "route-line", "route-item", "route-count", "lede-spread", "lede-copy", "lede-title", "lede-prose",
    "marginalia", "figure-register", "figure-row", "registry-ledger", "register-row", "register-open", "register-no",
    "register-brief", "register-topic", "register-title", "register-copy", "register-stats", "register-pool",
    "register-when", "register-state", "register-keep", "register-foot", "summary-aside", "summary-figures",
    "summary-figure", "dossier-file", "evidence-file", "guide-file", "step-register", "faq-ledger", "action-halo",
    "action-core", "observatory", "jump-start", "menu-glyph", "glyph-key",
    // The night sheet (previous edition).
    "chart", "chart-body", "chart-btn", "chart-link", "chart-skip", "dateline", "imprint", "indexline",
    "plate-scene", "statement-title", "statement-kicker", "ledger-plate", "ledger-rows", "ledger-foot",
    "query-rail", "facet-line", "facet-set", "facet-label", "loadline", "load-block", "entry-row",
    "keep-key", "edition-copy", "edition-facts", "edition-head", "compass-key", "quiet-key",
    "progress-line", "progress-rule", "brief-form", "field-line", "pick-line", "area-line",
    "twin-entry", "fault-list", "note-bar", "dispatch-undo", "slip-strip", "slip-state",
    "case-ledger", "case-item", "dossier-back", "dossier-head", "dossier-standfirst",
    "dossier-tags", "dossier-body", "dossier-margin",
  ]) {
    check(!new RegExp(`class=["'][^"']*\\b${retiredClass}\\b`).test(app + indexComponent + guideComponent), `${label}: retired surface is still in the source: ${retiredClass}`);
  }
  check(!/meridian-ledger\.css|spectrum-deck\.css|settiva-ledger\.css|poster-press\.css/.test(indexComponent + app), `${label}: a retired presentation layer is still imported`);
  for (const obsolete of [
    "meterial.txt", "src/abi.json", "src/EvidaraEscrow.abi.json", "src/styles/quilsted-workbench.css",
    "src/styles/evidalume.css", "src/styles/trovane-terminal.css", "src/styles/meridian-ledger.css",
    "src/styles/nightsheet.css",
    "src/components/ChainReadout.vue", "src/components/BriefRegistry.vue", "src/components/BriefInspector.vue",
  ]) {
    check(!await exists(path.join(site, obsolete)), `${label}: obsolete material remains: ${obsolete}`);
  }
  for (const asset of ["navrel-mark.svg", "navrel-seal.svg", "navrel-favicon.svg", "navrel-edition-social.png"]) {
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
// Workspace brand registry: the selected identity must stay consistent with the
// shipped site and must never be distributed. brand.txt is the one registry of
// current and historical names; key material stays outside the repository.
const workspace = path.dirname(root);
const registryPath = path.join(workspace, "brand.txt");
check(await exists(registryPath), "brand.txt: the workspace brand registry is missing");
const registryText = await exists(registryPath) ? await readFile(registryPath, "utf8") : "";
const currentBrand = (registryText.match(/^current:\s*(.+)$/m)?.[1] || "").trim();
const historyBrands = [...registryText.matchAll(/^history:\s*(.+)$/gm)].map(match => match[1].trim()).filter(Boolean);
check(currentBrand === "Navrel", "brand.txt: current brand must match the shipped Navrel identity");
check(registryText.match(/^current:/gm)?.length === 1, "brand.txt: exactly one current brand line is required");
check(historyBrands.some(name => name.toLowerCase() === "ledgiva"), "brand.txt: the previous brand must stay in history");
for (const site of [root, path.join(root, "a702")]) {
  for (const local of ["dist/key.txt", "dist/key.txt.branding", "public/key.txt", "public/key.txt.branding"]) {
    check(!await exists(path.join(site, local)), `${path.relative(root, site) || "main"}: local key material must never enter public output: ${local}`);
  }
}
if (failures.length) {
  console.error(`Navrel site guard failed (${failures.length}/${checks} checks):\n${failures.map(message => `- ${message}`).join("\n")}`);
  process.exitCode = 1;
} else console.log(`Navrel site guard passed: ${checks} checks; source/build branding, navrel.site metadata, the canonical @Navrel_site link, blueprint shell, local assets, dynamic social-link policy and mirror consistency verified.`);
