import assert from "node:assert/strict";
import { getMajors, getCareersForMajor, getAssessment, getMarketProfile } from "../src/data/api.js";
import { gapLevel, marketScore } from "../src/lib/gap.js";
const memory = new Map();
globalThis.localStorage = { getItem:key => memory.get(key) ?? null, setItem:(key,value) => memory.set(key,value) };
const errors = [];
const originalError = console.error;
console.error = (...args) => errors.push(args);
let click;
const app = { innerHTML:"", addEventListener:(name,fn)=>{ if(name === "click") click=fn; }, querySelectorAll:()=>[] };
const focusable = {focus(){},close(){},showModal(){}};
globalThis.document = {title:"",activeElement:null,getElementById:id=>id === "app" ? app : focusable,querySelector:()=>focusable};
globalThis.window = {scrollTo(){}};
await import("../src/main.js");
const store = await import("../src/lib/store.js");
const flush = () => new Promise(resolve=>setImmediate(resolve));
async function act(dataset) { click({target:{closest:()=>({dataset,disabled:false})},preventDefault(){}}); await flush(); }
await flush();
assert.match(app.innerHTML,/寻找你的/);
assert.equal((await getMajors()).length,2);
const careers = await getCareersForMajor("all");
assert.equal(careers.length,14);
assert.equal(marketScore(5),100);
assert.equal(gapLevel(78,5),"have");
assert.equal(gapLevel(48,5),"forming");
assert.equal(gapLevel(47,5),"grow");
for(const career of careers) {
  await act({major:"all"});
  await act({career:career.id});
  assert.match(app.innerHTML,new RegExp(career.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  await act({to:"market"});
  const profile = await getMarketProfile(career.id);
  const questions = await getAssessment(career.id);
  assert.ok(questions.length > 0 && questions.length <= 8);
  assert.ok(profile.every(p=>p.skill && questions.some(q=>q.skillId === p.skillId)),career.id+" unassessed skill");
  await act({resumeAssess:""});
  await act({nextQuestion:""});
  assert.equal(store.getState().questionIndex,0,"Cannot skip unanswered question");
  for(let i=0;i<questions.length;i++) {
    await act({option:String(i%4)});
    assert.equal(store.getState().answers[questions[i].id].score,questions[i].options[i%4].score);
    if(i===0) {
      await act({tab:"direction"});
      assert.ok(!app.innerHTML.includes("能力画像已生成"),"Partial answer must not count as completed");
      await act({resumeAssess:""});
      assert.equal(store.getState().questionIndex,1);
      await act({prevQuestion:""});
      assert.equal(store.getState().questionIndex,0);
    }
    await act({nextQuestion:""});
  }
  assert.equal(store.getState().stage,"portrait",career.id);
  await act({to:"gap"});
  assert.match(app.innerHTML,/重点培养/);
  await act({review:""});
  await act({option:"3"});
  await act({to:"portrait"});
  assert.equal(store.getState().answers[questions[0].id].score,questions[0].options[3].score);
  await act({to:"explore"});
  await act({career:career.id});
  assert.equal(Object.keys(store.getState().answers).length,questions.length,"Reselecting target preserves answers");
}
// Incomplete / old saved journeys cannot render a completed portrait.
store.setState({majorId:"all",careerId:"pm",answers:{},stage:"gap",questionIndex:999});
await flush();
assert.equal(store.getState().stage,"assess");
assert.equal(store.getState().questionIndex,0);
store.setState({majorId:"unknown",careerId:"unknown",answers:{},stage:"detail"});
await flush();
assert.equal(store.getState().stage,"choose");
// Invalid persisted JSON and answers recover without crashing.
memory.set("quxiang-journey-v1","{broken");
const corrupt = await import("../src/lib/store.js?case=corrupt");
assert.equal(corrupt.getState().stage,"home");
memory.set("quxiang-journey-v1",JSON.stringify({stage:"bad",tab:"bad",answers:{x:null,y:{skillId:"x",optionIndex:88}},questionIndex:-5}));
const invalid = await import("../src/lib/store.js?case=invalid");
assert.deepEqual(invalid.getState().answers,{});
assert.equal(invalid.getState().questionIndex,0);
// Storage failure must still notify and preserve the session state.
globalThis.localStorage.setItem = () => { throw new Error("Quota exceeded"); };
let notified = false;
store.subscribe(()=>{notified=true;});
await act({major:"all"});
assert.equal(notified,true);
assert.equal(store.canSaveProgress(),false);
assert.match(app.innerHTML,/暂时无法保存/);
assert.equal(errors.length,0,JSON.stringify(errors));
console.error=originalError;
console.log("PASS: all 14 career journeys; score thresholds; answer revision; partial completion; saved state validation; storage failure; no render errors.");
