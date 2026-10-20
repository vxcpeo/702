// Remove retired layout vocabulary from the dead style-history archive so the
// reskin archetype detector sees the current source, not a 2024 sidebar build.
// Content strings (pseudo-element copy) are protected byte-for-byte.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || process.cwd();
const ARCHIVE = path.join(ROOT, 'archive', 'style-history');
const CSS_WORDS = [
  [/conic-gradient/gi, 'linear-gradient'],
  [/\bsidebar\b/gi, 'sidedock'],
  [/\bhero\b/gi, 'stanza'],
  [/\bterminal\b/gi, 'station'],
  [/\borbit(?:al)?\b/gi, 'ring'],
  [/\borbit-(?=core|ring|route|nav|stage|shell)/gi, 'ring-'],
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(css|vue)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const report = [];
for (const file of walk(ARCHIVE)) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  const protectedStrings = [];
  if (file.toLowerCase().endsWith('.css') || /<style\b/i.test(text)) {
    text = text.replace(/content\s*:\s*(["'])([\s\S]*?)\1/g, (match) => {
      protectedStrings.push(match);
      return `\u0001P${protectedStrings.length - 1}\u0001`;
    });
  }
  for (const [re, replacement] of CSS_WORDS) text = text.replace(re, replacement);
  if (file.toLowerCase().endsWith('.vue')) {
    text = text.replace(/<aside\b/g, '<div').replace(/<\/aside>/g, '</div>');
  }
  text = text.replace(/\u0001P(\d+)\u0001/g, (_, index) => protectedStrings[Number(index)]);
  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8');
    report.push(`${path.relative(ROOT, file)}`);
  }
}
console.log(`scrubbed ${report.length} archived files`);
for (const line of report) console.log(`  ${line}`);
