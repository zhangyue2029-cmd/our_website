import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {getAssessment} from '../src/data/api.js';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
let click;const app={innerHTML:'',addEventListener:(n,f)=>{if(n==='click')click=f;},querySelectorAll:()=>[]};
const focusable={focus(){},close(){},showModal(){}};
globalThis.document={title:'',activeElement:null,getElementById:id=>id==='app'?app:focusable,querySelector:()=>focusable};globalThis.window={scrollTo(){}};
await import('../src/main.js');const store=await import('../src/lib/store.js');
const flush=()=>new Promise(r=>setImmediate(r));
async function act(dataset){click({target:{closest:()=>({dataset,disabled:false})},preventDefault(){}});await flush();}
function verify(){assert.ok(!app.innerHTML.includes('undefined'));assert.ok(!app.innerHTML.includes('NaN'));const ids=[...app.innerHTML.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Unique HTML IDs');for(const m of app.innerHTML.matchAll(/src="\.\/([^\"]+)"/g))assert.ok(existsSync(new URL('../'+m[1],import.meta.url)),m[1]);}
await flush();verify();await act({to:'choose'});verify();await act({to:'majors'});assert.match(app.innerHTML,/data-category-slot="chinese"/);assert.match(app.innerHTML,/data-category-slot="journalism"/);verify();
await act({major:'journalism'});verify();await act({allDirections:''});assert.match(app.innerHTML,/galaxy-wrap/);verify();
await act({career:'journalist'});assert.match(app.innerHTML,/career-art/);assert.match(app.innerHTML,/工作内容/);verify();await act({detailPart:'paths'});verify();await act({detailPart:'overview'});
await act({to:'market'});await act({skill:'writing'});assert.match(app.innerHTML,/aria-expanded="true"/);verify();
await act({resumeAssess:''});verify();for(const q of await getAssessment('journalist')){await act({option:'2'});await act({nextQuestion:''});}
assert.match(app.innerHTML,/persona-.*webp/);verify();await act({to:'structure'});assert.match(app.innerHTML,/radar-chart/);verify();await act({to:'distance'});verify();await act({to:'advice'});verify();
await act({to:'gap'});verify();await act({tab:'direction'});verify();await act({tab:'mine'});verify();
await act({to:'explore'});await act({career:'journalist'});const answers=Object.keys(store.getState().answers).length;
await act({majorCareer:'journalist'});assert.equal(Object.keys(store.getState().answers).length,answers);
await act({majorCareer:'publisher'});assert.equal(store.getState().majorId,'all');assert.equal(store.getState().careerId,'publisher');assert.equal(Object.keys(store.getState().answers).length,0);verify();
const css=readFileSync(new URL('../src/styles/redesign.css',import.meta.url),'utf8');assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/@media\(max-width:600px\)/);
console.log('PASS: all 15 views and career detail tabs, local art references, no duplicate IDs or invalid rendered values; related career switching and answer preservation.');
