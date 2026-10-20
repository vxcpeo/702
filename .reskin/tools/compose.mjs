import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || process.cwd();
const BACKUP = path.join(ROOT, '.reskin', 'original-backup', 'src');
const sourcePath = (name) => (name === 'App.vue' ? path.join(BACKUP, name) : path.join(BACKUP, 'components', name));
const NEW = path.join(ROOT, '.reskin', 'new');

const files = ['App.vue', 'BriefIndex.vue', 'BriefDossier.vue', 'BriefGuide.vue'];
const replace = {
  'App.vue': [
    ['.nav-overlay', '.channel-deck'],
    ['.nav-toggle', '.deck-menu'],
    ['.entry-open', '.row-open'],
    ['.modal-scroll', '.sheet-body'],
    ['.review-mission h3', '.review-brief h3'],
  ],
};

for (const name of files) {
  const original = fs.readFileSync(sourcePath(name), 'utf8');
  const script = original.match(/<script setup>[\s\S]*?<\/script>/)?.[0];
  if (!script) throw new Error(`no script setup in ${name}`);
  let patched = script;
  for (const [from, to] of replace[name] || []) patched = patched.split(from).join(to);
  const template = fs.readFileSync(path.join(NEW, `${name.replace('.vue', '')}.template.html`), 'utf8');
  const target = name === 'App.vue' ? path.join(ROOT, 'src', name) : path.join(ROOT, 'src', 'components', name);
  fs.writeFileSync(target, `${patched}\n\n${template.trimEnd()}\n`, 'utf8');
  console.log(`wrote src/${name}`);
}

const uiIcon = fs.readFileSync(path.join(BACKUP, 'components', 'UiIcon.vue'), 'utf8');
fs.writeFileSync(
  path.join(ROOT, 'src', 'components', 'UiIcon.vue'),
  uiIcon.replace(/previous terminal\s*\n?\s*\*?\s*set/i, 'retired edition'),
  'utf8',
);
console.log('wrote src/components/UiIcon.vue');

const mainPath = path.join(ROOT, 'src', 'main.js');
fs.writeFileSync(
  mainPath,
  fs.readFileSync(mainPath, 'utf8').replace('./styles/settiva-ledger.css', './styles/spectrum-deck.css'),
  'utf8',
);
console.log('wrote src/main.js');
