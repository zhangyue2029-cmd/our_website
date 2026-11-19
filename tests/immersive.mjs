import assert from 'node:assert/strict';
import {majorCategories,capsuleOrder,majorsInCategory,resolveCategory} from '../src/data/categories.js';
import {getMajors} from '../src/data/api.js';
import {shapeFrames,flipDelta,AnimationScope} from '../src/immersive/motion.js';
import {ImmersivePages} from '../src/immersive/view.js';
import {ImmersiveController} from '../src/immersive/controller.js';
import {routeFor,parseRoute} from '../src/lib/router.js';
assert.equal(new Set(majorCategories.map(c=>c.id)).size,2);
for(const c of majorCategories){const order=capsuleOrder(c.id);assert.equal(order[1],c.id);assert.equal(new Set(order).size,2);const majors=majorsInCategory(c.id,await getMajors());assert.equal(majors.length,1);}
assert.equal(resolveCategory('unknown').id,'chinese');
const frames=shapeFrames({left:10,top:100,width:600,height:600},{left:450,top:180,width:164,height:58,color:'#bca8ed'});
assert.equal(frames.length,3);assert.equal(frames[0].width,600);assert.equal(frames[1].borderRadius,'38px');assert.equal(frames[2].borderRadius,'999px');assert.equal(frames[2].width,164);assert.equal(frames[2].height,58);assert.ok(frames.every(f=>!('opacity'in f)),'Bloom container is never faded out');
assert.equal(flipDelta({left:1900,top:0},{left:10,top:0},2000).x,-110);
const html=ImmersivePages({stage:'home'});assert.equal((html.match(/data-shared-bloom /g)||[]).length,1);assert.ok(!html.includes('major-grid'));assert.ok(html.includes('silhouette-a.webp'));assert.ok(html.includes('bloom-flower.webp'));
const route=routeFor({tab:'explore',stage:'choose',categoryId:'journalism',majorId:null,directionId:null,careerId:null});assert.equal(parseRoute(route).categoryId,'journalism');assert.equal(parseRoute('#/majors?category=law').stage,'majors');
// Animation test double preserves promises/cancellation; geometry is deterministic.
const running=new Set();
function style(){return new Proxy({setProperty(k,v){this[k]=v;}},{set(o,k,v){if(k==='cssText'){for(const key of Object.keys(o))if(key!=='setProperty')delete o[key];return true;}o[k]=v;return true;}});}
class El{
 constructor(name,rect={left:0,top:0,width:100,height:50}){this.name=name;this.rect=rect;this.style=style();this.dataset={};this.children=[];this.attrs={};this.listeners={};this.scrollLeft=0;this.clientWidth=1000;}
 setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,f){this.listeners[k]=f;}
 appendChild(el){el.parent?.children.splice(el.parent.children.indexOf(el),1);this.children.push(el);el.parent=this;return el;}
 replaceChildren(...els){for(const e of this.children)e.parent=null;this.children=[];for(const e of els)this.appendChild(e);}
 contains(e){return e===this||this.children.some(c=>c.contains(e));}
 querySelector(s){return this.map?.[s]||null;}querySelectorAll(s){return this.lists?.[s]||[];}
 focus(){this.focused=true;}closest(s){return s==='.im-capsule-rail'?(this.parent?.name==='slot'?this.parent.parent:null):null;}
 get offsetLeft(){if(this.name==='slot')return 44+this.parent.children.indexOf(this)*160;return parseFloat(this.style.left)||0;}
 get offsetTop(){return parseFloat(this.style.top)||0;}
 get offsetWidth(){return this.name==='slot'?150:parseFloat(this.style.width)||this.rect.width;}
 get offsetHeight(){return parseFloat(this.style.height)||this.rect.height;}
 get scrollWidth(){return this.name==='rail'?2168:1000;}
 getBoundingClientRect(){if(this.name==='slot')return {left:70+this.offsetLeft-this.parent.parent.scrollLeft,top:190,width:150,height:64};if(this.parent?.name==='slot'){const r=this.parent.getBoundingClientRect();const w=this.name==='shared'||this.parent.dataset.selected==='true'?164:108;return {left:r.left+(150-w)/2,top:r.top+3,width:w,height:this.name==='shared'||this.parent.dataset.selected==='true'?58:46};}return {...this.rect,left:parseFloat(this.style.left)||this.rect.left,top:parseFloat(this.style.top)||this.rect.top,width:parseFloat(this.style.width)||this.rect.width,height:parseFloat(this.style.height)||this.rect.height};}
 animate(frames,options){let resolve,reject;const finished=new Promise((r,j)=>{resolve=r;reject=j;});const a={finished,frames,options,cancel(){running.delete(a);reject(new Error('cancelled'));},commitStyles:()=>Object.assign(this.style,frames.at(-1)),finish(){running.delete(a);resolve();}};running.add(a);return a;}
}
function fixture(mode='home',reduced=false){const root=new El('root',{left:0,top:0,width:1366,height:768});root.dataset={mode,category:'chinese'};
 const names=['shared','art','label','visual','home','selector','background','info','rail','viewport','header','copy','enter','skip','name','en','description','coverage','counter','status','home-title','selector-title'];const e=Object.fromEntries(names.map(n=>[n,new El(n)]));root.map={};
 const refs={'[data-shared-bloom]':'shared','.im-bloom-art':'art','.im-shared-label':'label','.im-visual':'visual','.im-home-scene':'home','.im-selector-scene':'selector','.im-background':'background','.im-major-info':'info','.im-capsule-rail':'rail','.im-capsule-viewport':'viewport','.im-header':'header','.im-hero-copy':'copy','[data-im-enter]':'enter','[data-im-skip]':'skip','[data-im-name]':'name','[data-im-en]':'en','[data-im-description]':'description','[data-im-coverage]':'coverage','[data-im-counter]':'counter','.im-status':'status'};for(const [s,k]of Object.entries(refs))root.map[s]=e[k];
 e.home.map={h1:e['home-title']};e.selector.map={h1:e['selector-title']};e.shared.appendChild(e.art);e.shared.appendChild(e.label);const bloom=new El('img');bloom.decode=async()=>{};e.art.map={img:bloom};root.appendChild(e.shared);e.viewport.appendChild(e.rail);root.appendChild(e.home);root.appendChild(e.selector);root.appendChild(e.visual);e.selector.appendChild(e.viewport);
 const slots=majorCategories.map(c=>{const s=new El('slot');s.dataset.categorySlot=c.id;e.rail.appendChild(s);return s;});const buttons=majorCategories.map((c,i)=>{const b=new El('button');b.dataset.category=c.id;slots[i].appendChild(b);return b;});
 const figures=[new El('figure'),new El('figure')];for(const f of figures){const img=new El('img');img.decode=async()=>{};f.map={img};}const glows=[new El('glow'),new El('glow')];
 root.lists={'[data-figure-layer]':figures,'[data-glow-layer]':glows,'[data-category-slot]':slots,'.im-capsule[data-category]':buttons};
 root.map['[data-bloom-anchor]']=new El('anchor',{left:40,top:80,width:650,height:650});root.map['[data-hero-person-anchor]']=new El('anchor',{left:90,top:150,width:550,height:618});root.map['[data-selector-person-anchor]']=new El('anchor',{left:150,top:240,width:550,height:528});
 const media={matches:reduced,addEventListener(){},removeEventListener(){}};const host={matchMedia:()=>media,addEventListener(){}};
 return {root,e,slots,figures,glows,host};}
globalThis.Image=class{decode(){return Promise.resolve();}};
const tick=()=>new Promise(r=>setImmediate(r));async function drain(){for(let i=0;i<12;i++){await tick();for(const a of [...running])a.finish();await tick();if(!running.size){await tick();if(!running.size)return;}}throw new Error('Animation did not settle');}
const f=fixture(),events=[];const c=new ImmersiveController(f.root,{host:f.host,onNavigate:s=>events.push(s),onCategory:id=>events.push(id)});const shared=c.shared;await drain();
const entering=c.enter();assert.equal(events.length,0,'Route stays home until transition completes');assert.equal(c.busy,'transition');c.enter();assert.equal(running.size,8,'Repeated enter is ignored');await drain();await entering;assert.equal(events[0],'choose');assert.equal(c.shared,shared);assert.equal(shared.parent,c.slots.get('chinese'),'Original flower button is docked inside actual rail');
c.requestCategory('journalism');c.requestCategory('chinese');c.requestCategory('journalism');await drain();assert.equal(c.category.id,'journalism');assert.equal(c.shared,shared);assert.equal(shared.parent,c.slots.get('journalism'));assert.ok(f.figures[c.activeLayer].map.img.src.includes('silhouette-c.webp'));assert.ok(f.glows[c.activeLayer].style.background.includes('#9fcfe9'));assert.equal(events.at(-1),'journalism');assert.equal(events.filter(x=>x==='chinese').length,0,'Rapid requests commit only the final queued category');
let prevented=0;c.keydown({key:'ArrowRight',target:shared,preventDefault(){prevented++;}});c.keydown({key:'ArrowRight',target:shared,preventDefault(){prevented++;}});await drain();assert.equal(prevented,2);assert.equal(c.category.id,'journalism','Repeated direction keys queue relative to pending target');
f.e.viewport.listeners.pointerdown({isPrimary:true,clientX:220,clientY:200,pointerId:1});f.e.viewport.listeners.pointerup({clientX:110,clientY:205,pointerId:1});await drain();assert.equal(c.category.id,'chinese','Horizontal touch gesture advances selection');
const leaving=c.leave();await drain();await leaving;assert.equal(events.at(-1),'home');assert.equal(shared.parent,f.root);assert.equal(c.shared,shared);
const count=events.length;c.enter();c.update({stage:'home',categoryId:'chinese'});await drain();assert.equal(events.length,count,'History interruption cannot commit stale route');assert.equal(c.mode,'home');
c.enter();c.dispose();await drain();assert.equal(events.length,count,'Unmount cancels pending timeline callbacks');assert.ok(c.abort.signal.aborted);
const r=fixture('home',true),reducedEvents=[];const rc=new ImmersiveController(r.root,{host:r.host,onNavigate:s=>reducedEvents.push(s)});await tick();await rc.enter();assert.equal(rc.mode,'choose');assert.equal(reducedEvents[0],'choose');assert.equal(rc.shared.parent,rc.slots.get('chinese'));rc.dispose();
console.log('PASS: 2 original professional entries; persistent flower identity and actual rail docking; route-after-animation; FLIP; crossfade/glow sync; latest-click queue; history interruption; cleanup; reduced motion.');
