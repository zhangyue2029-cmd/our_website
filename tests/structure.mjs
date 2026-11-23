import assert from 'node:assert/strict';
import {getMajorDirections,getCareersForDirection,getCareersForMajor,getAssessment} from '../src/data/api.js';
const chinese=await getMajorDirections('chinese'),news=await getMajorDirections('journalism');
assert.equal(chinese.length,4);assert.equal(news.length,4);assert.ok(chinese.every(d=>!news.some(n=>n.id===d.id||n.name===d.name)));
for(const major of ['chinese','journalism']){const original=await getCareersForMajor(major);for(const d of await getMajorDirections(major)){const subset=await getCareersForDirection(major,d.id);assert.ok(subset.length);assert.ok(subset.every(c=>original.some(o=>o.id===c.id)));}}
assert.deepEqual(await getCareersForDirection('chinese',news[0].id),[],'No cross-major direction fallback');
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
let click,scrolls=0;const app={innerHTML:'',querySelectorAll:()=>[],addEventListener:(n,f)=>{if(n==='click')click=f;}};
const focusable={focus(){},close(){},showModal(){}};globalThis.document={title:'',activeElement:null,getElementById:id=>id==='app'?app:focusable,querySelector:()=>focusable};globalThis.window={scrollTo(){scrolls++;}};
await import('../src/main.js');const store=await import('../src/lib/store.js');const flush=()=>new Promise(r=>setImmediate(r));async function act(d){click({target:{closest:()=>({dataset:d})},preventDefault(){}});await flush();}
await flush();assert.match(app.innerHTML,/寻找你的/);assert.ok(!app.innerHTML.includes('class="major-grid"'));
await act({to:'choose'});assert.match(app.innerHTML,/im-capsule-rail/);assert.ok(!app.innerHTML.includes('class="major-grid"'));await act({to:'majors'});assert.match(app.innerHTML,/im-capsule-rail/);assert.ok(!app.innerHTML.includes('class="cover-collage"'));
await act({major:'chinese'});assert.equal(store.getState().stage,'focus');assert.match(app.innerHTML,/文学阅读与文本研究/);assert.ok(!app.innerHTML.includes('新闻采访与报道'));
await act({direction:chinese[0].id});assert.equal(store.getState().stage,'explore');assert.match(app.innerHTML,/出版编辑/);assert.ok(!app.innerHTML.includes('data-node="pr"'));
await act({to:'choose'});await act({major:'journalism'});assert.equal(store.getState().directionId,null);assert.equal(store.getState().careerId,null);assert.deepEqual(store.getState().answers,{});assert.match(app.innerHTML,/新闻采访与报道/);assert.ok(!app.innerHTML.includes('文学阅读与文本研究'));
await act({direction:news[0].id});assert.ok(!app.innerHTML.includes('data-node="publisher"'));
await act({career:'journalist'});await act({resumeAssess:''});assert.ok(!app.innerHTML.includes('assessment-art'));const oldScrolls=scrolls;
await act({option:'2'});assert.equal(scrolls,oldScrolls,'Choosing an answer does not scroll');await act({nextQuestion:''});assert.ok(scrolls>oldScrolls,'Next question resets viewport');
const answers={};for(const q of await getAssessment('journalist'))answers[q.id]={questionId:q.id,skillId:q.skillId,optionIndex:2,score:q.options[2].score};store.setState({answers,stage:'portrait'});await flush();
for(const stage of ['portrait','structure','distance','advice']){await act({to:stage});assert.equal(store.getState().stage,stage);assert.equal(Object.keys(store.getState().answers).length,Object.keys(answers).length);assert.match(app.innerHTML,/result-nav/);}
await act({to:'structure'});assert.match(app.innerHTML,/radar-chart/);await act({to:'distance'});assert.match(app.innerHTML,/加权平均未补足差距/);await act({to:'advice'});assert.match(app.innerHTML,/下一步行动/);
store.setState({answers:{},stage:'distance'});await flush();assert.equal(store.getState().stage,'assess');
console.log('PASS: distinct scoped learning paths; no stale major data; separate home/choice; 4 result pages; answers preserved; incomplete results guarded; assessment scroll behavior.');
