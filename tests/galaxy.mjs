import assert from 'node:assert/strict';
import {initGalaxy} from '../src/components/GalaxyInteraction.js';
import {CareerMap} from '../src/components/CareerMap.js';
import {getCareersForMajor} from '../src/data/api.js';
const careers=await getCareersForMajor('journalism');
class Element {
 constructor(dataset={}){this.dataset=dataset;this.handlers={};this.attributes={};this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
 addEventListener(n,f){this.handlers[n]=f;} setAttribute(n,v){this.attributes[n]=v;} focus(){this.handlers.focus?.();} remove(){this.removed=true;}
 fire(n,extra={}){this.handlers[n]?.(extra);}
}
const nodes=['major',...careers.map(c=>c.id)].map(id=>new Element({node:id}));
const lines=[new Element({a:'major',b:'journalist'}),new Element({a:'journalist',b:'editor'}),new Element({a:'pm',b:'brand'})];
const peek=new Element(),open=new Element(),close=new Element(),title=new Element(),tag=new Element(),motion=new Element();
const data={textContent:JSON.stringify(careers)};
const items={'.peek':peek,'[data-open-career]':open,'[data-close-peek]':close,'[data-peek-title]':title,'[data-peek-tag]':tag,'[data-galaxy-data]':data};
const galaxy=new Element({selected:''});
galaxy.querySelector=s=>items[s];galaxy.querySelectorAll=s=>({'[data-node]':nodes,'.galaxy-line':lines,animateMotion:[motion]}[s]);
const root={querySelector:()=>galaxy};
globalThis.window={matchMedia:()=>({matches:false})};
initGalaxy(root);
assert.equal(peek.hidden,true);
nodes[1].fire('pointerenter');assert.ok(lines[0].classes.has('lit'));assert.ok(nodes.find(n=>n.dataset.node==='pm').classes.has('dim'));
nodes[1].fire('click');assert.equal(peek.hidden,false);assert.equal(open.dataset.career,'journalist');assert.equal(title.textContent,'记者');
nodes[1].fire('pointerleave');assert.ok(nodes[1].classes.has('active'),'Selected node remains locked');
close.fire('click');assert.equal(peek.hidden,true);assert.equal(open.dataset.career,undefined);
nodes[1].fire('click');galaxy.fire('keydown',{key:'Escape'});assert.equal(peek.hidden,true);
globalThis.window.matchMedia=()=>({matches:true});initGalaxy(root);assert.equal(motion.removed,true,'SMIL removed with reduced motion');
for(const majorId of ['journalism','chinese','all']){const data=await getCareersForMajor(majorId);const html=CareerMap({careers:data,majorId,majorName:'测试'});assert.equal((html.match(/data-node=/g)||[]).length,data.length+1);assert.ok(!html.includes('NaN'));assert.ok(!html.includes('undefined'));}
console.log('PASS: galaxy hover, path highlighting, dimming, click preview, locked selection, close, Escape, reduced motion; three major layouts.');
