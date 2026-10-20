import fs from 'node:fs';

const file = process.argv[2];
let text = fs.readFileSync(file, 'utf8');
const pairs = [
  ['? "Submitting\u2026\n', '? "Submitting\u2026"\n'],
  ['? "Funding\u2026 : ', '? "Funding\u2026" : '],
  ['? "Approving\u2026 : ', '? "Approving\u2026" : '],
];
for (const [from, to] of pairs) {
  if (!text.includes(from)) console.log('missing:', JSON.stringify(from));
  text = text.split(from).join(to);
}
fs.writeFileSync(file, text, 'utf8');
const { parse } = await import('@vue/compiler-sfc');
const { errors } = parse(text, { filename: file });
console.log(errors.length ? errors.map((e) => e.message) : 'template ok');
