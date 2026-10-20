import fs from 'node:fs';

const file = process.argv[2];
let text = fs.readFileSync(file, 'utf8');
text = text.replace(
  'placeholder="https://\uFFFD?or ipfs://\uFFFD?',
  'placeholder="https://\u2026 or ipfs://\u2026"',
);
fs.writeFileSync(file, text, 'utf8');
console.log('remaining replacement chars:', (text.match(/\uFFFD/g) || []).length);
const { parse } = await import('@vue/compiler-sfc');
const { errors } = parse(text, { filename: file });
console.log(errors.length ? errors.map((e) => e.message) : 'template ok');
