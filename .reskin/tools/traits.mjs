import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || process.cwd();
const IGN = new Set(['node_modules', 'dist', 'build', '.git', '.reskin', 'coverage', '.nuxt', '.output', '.next', '.cache', '.turbo', 'cypress', 'playwright-report', 'test-results', '.vite', '.idea', '.vscode']);
const EXT = new Set(['.vue', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.css', '.scss', '.sass', '.less', '.html']);

function walk(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (IGN.has(e.name)) continue;
      out.push(...walk(dir, r));
      continue;
    }
    if (EXT.has(path.extname(e.name).toLowerCase())) out.push(r);
  }
  return out;
}

const all = walk(ROOT);
const files = all.filter((f) => /^(?:src|app|pages|components|layouts|assets|public)\//i.test(f) || /\.(vue|css|scss|less|sass)$/i.test(f));
const sources = new Map(files.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
const text = [...sources.values()].join('\n').toLowerCase();
const re = {
  sidebar: /<aside\b|\bsidebar\b|\bside-menu\b|\bsider\b/,
  topbar: /<(?:header|div)[^>]*class=["'][^"']*(?:topbar|navbar|app-header|site-header|top-bar)[^"']*["']/,
  cards: /\bcard\b|\btile\b|\bpanel\b/,
  hero: /\bhero\b|\bbanner\b|\bjumbotron\b/,
  orbital: /\borbital\b|\borbit(?:al)?\b|\borbit-(?:core|ring|route|nav|stage|shell)\b|conic-gradient/,
  terminal: /\bterminal\b|class=["'][^"']*(?:console|terminal)|\.console-(?:pane|layout|shell)\b/,
  bento: /\bbento\b/,
  ticker: /\bticker\b|\bmarquee\b/,
  gallery: /\bgallery\b|scroll-snap/,
};
const traits = {};
for (const [k, r] of Object.entries(re)) traits[k] = r.test(text);
console.log('scanned', files.length, 'traits', traits);

const per = {};
for (const [f, s] of sources) {
  const t = s.toLowerCase();
  for (const [k, r] of Object.entries(re)) {
    if (r.test(t)) (per[f] ||= []).push(k);
  }
}
for (const [f, h] of Object.entries(per)) console.log(f.padEnd(72), h.join(','));
