import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SKILL = 'C:/Users/Administrator/.dsh/skills/reskin/scripts/inventory.mjs';
const { analyzeProject, contractDiff } = await import(pathToFileURL(SKILL).href);
const ROOT = process.argv[2] || process.cwd();
const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, '.reskin/baseline/content-contract.json'), 'utf8'));
const current = await analyzeProject(ROOT);
const diff = contractDiff(baseline, current.contentContract, { allowAdditions: true });
console.log('baseline hash', JSON.parse(fs.readFileSync(path.join(ROOT, '.reskin/baseline/pages.json'), 'utf8')).inventoryHash);
console.log('current hash ', current.contentContractHash);
console.log('archetype', current.archetype);
console.log('issues', diff.issues.length);
for (const issue of diff.issues.slice(0, 30)) console.log('  -', issue);
console.log('warnings', diff.warnings.length);
const interesting = diff.warnings.filter((w) => /^(visibleText|attributes|bindings|events|forms|links|assets): (?:added|".*" count increased)/.test(w));
console.log('additive warnings of interest', interesting.length);
for (const warning of interesting.slice(0, 30)) console.log('  +', warning);
