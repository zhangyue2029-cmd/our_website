import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hashes=JSON.parse(readFileSync(new URL('./protected-hashes.json',import.meta.url),'utf8'));
for(const [name,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+name,import.meta.url))).digest('hex'),hash,name+' differs from original upload');
console.log('PASS: '+Object.keys(hashes).length+' protected career data, question bank, scoring, galaxy modules and previous styles are unchanged.');
