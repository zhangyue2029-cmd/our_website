import {majorCategories,resolveCategory,capsuleOrder} from '../data/categories.js';
import {AnimationScope,MOTION,EASE,relativeRect,shapeFrames,flipDelta} from './motion.js';
export class ImmersiveController {
 constructor(root,{onNavigate,onCategory,onExplore,host=window}={}){
  this.root=root;this.host=host;this.onNavigate=onNavigate;this.onCategory=onCategory;this.onExplore=onExplore;
  this.scope=new AnimationScope();this.disposed=false;this.busy=null;this.queued=null;
  this.category=resolveCategory(root.dataset.category);this.mode=root.dataset.mode;this.desired=this.mode;
  const q=s=>root.querySelector(s);this.shared=q('[data-shared-bloom]');this.art=q('.im-bloom-art');this.label=q('.im-shared-label');this.visual=q('.im-visual');this.home=q('.im-home-scene');this.selector=q('.im-selector-scene');this.background=q('.im-background');this.info=q('.im-major-info');this.rail=q('.im-capsule-rail');this.viewport=q('.im-capsule-viewport');this.figures=[...root.querySelectorAll('[data-figure-layer]')];this.glows=[...root.querySelectorAll('[data-glow-layer]')];this.activeLayer=0;
  this.slots=new Map([...root.querySelectorAll('[data-category-slot]')].map(el=>[el.dataset.categorySlot,el]));
  this.buttons=new Map([...root.querySelectorAll('.im-capsule[data-category]')].map(el=>[el.dataset.category,el]));
  this.media=host.matchMedia?.('(prefers-reduced-motion: reduce)');this.reduced=!!this.media?.matches;
  this.abort=new AbortController();const signal=this.abort.signal;
  root.addEventListener('click',e=>this.click(e),{signal});root.addEventListener('keydown',e=>this.keydown(e),{signal});
  this.viewport.addEventListener('pointerdown',e=>{if(e.isPrimary!==false)this.pointer={x:e.clientX,y:e.clientY,id:e.pointerId};},{signal});
  this.viewport.addEventListener('pointerup',e=>{const p=this.pointer;this.pointer=null;if(!p||p.id!==e.pointerId)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){this.suppressClickUntil=Date.now()+300;this.step(dx<0?1:-1);}},{signal});
  this.viewport.addEventListener('pointercancel',()=>this.pointer=null,{signal});
  host.addEventListener?.('resize',()=>this.resize(),{signal});
  if(!this.reduced&&host.matchMedia?.('(hover: hover) and (pointer: fine)').matches){
   root.addEventListener('pointermove',e=>{if(this.mode!=='home'||this.busy)return;const r=root.getBoundingClientRect();root.style.setProperty('--im-px',((e.clientX-r.left-r.width/2)/r.width*10).toFixed(2)+'px');root.style.setProperty('--im-py',((e.clientY-r.top-r.height/2)/r.height*7).toFixed(2)+'px');},{signal});
   root.addEventListener('pointerleave',()=>{root.style.setProperty('--im-px','0px');root.style.setProperty('--im-py','0px');},{signal});
  }
  this.onReduced=()=>{this.reduced=!!this.media.matches;this.resize();};this.media?.addEventListener?.('change',this.onReduced);
  this.settle(this.mode,false);
  if(this.mode==='home'&&!this.reduced)this.intro();
  this.preload();
 }
 duration(ms){return this.reduced?0:ms;}
 preload(){for(const pose of ['a','b','c','d']){const img=new Image();img.src=`./src/assets/silhouette-${pose}.webp`;img.decode?.().catch(()=>{});}}
 async decode(img){try{if(img?.decode)await img.decode();return img?.naturalWidth!==0;}catch{return false;}}
 setScenes(mode){this.home.inert=mode!=='home';this.home.setAttribute('aria-hidden',String(mode!=='home'));this.selector.inert=mode!=='choose';this.selector.setAttribute('aria-hidden',String(mode!=='choose'));this.root.querySelector('[data-im-skip]').hidden=mode==='choose';}
 rectFor(mode){return relativeRect(this.root.querySelector(mode==='home'?'[data-hero-person-anchor]':'[data-selector-person-anchor]'),this.root);}
 setVisual(mode){Object.assign(this.visual.style,Object.fromEntries(Object.entries(this.rectFor(mode)).map(([k,v])=>[k,v+'px'])));}
 resetSlots(){for(const [id,slot] of this.slots){slot.replaceChildren(this.buttons.get(id));slot.dataset.selected=String(id===this.category.id);this.buttons.get(id).setAttribute('aria-checked','false');}}
 arrange(){const padding=Math.max(24,this.viewport.clientWidth/2-this.slots.get(this.category.id).offsetWidth/2);this.rail.style.paddingLeft=padding+'px';this.rail.style.paddingRight=padding+'px';for(const id of capsuleOrder(this.category.id))this.rail.appendChild(this.slots.get(id));const slot=this.slots.get(this.category.id);this.viewport.scrollLeft=slot.offsetLeft+slot.offsetWidth/2-this.viewport.clientWidth/2;}
 capsuleRect(){const slot=this.slots.get(this.category.id),button=this.buttons.get(this.category.id);return relativeRect(slot.contains(this.shared)?this.shared:button,this.root);}
 detachShared(){const focused=this.root.ownerDocument?.activeElement===this.shared;const rect=relativeRect(this.shared,this.root);this.root.appendChild(this.shared);Object.assign(this.shared.style,{position:'absolute',...Object.fromEntries(Object.entries(rect).map(([k,v])=>[k,v+'px']))});if(focused)this.shared.focus({preventScroll:true});return rect;}
 dock(){const focused=this.root.ownerDocument?.activeElement===this.shared;this.slots.get(this.category.id).replaceChildren(this.shared);this.shared.style.cssText='';this.art.style.cssText='';this.label.style.cssText='';if(focused)this.shared.focus({preventScroll:true});}
 applyInfo(){const c=this.category;this.root.dataset.category=c.id;this.root.style.setProperty('--im-accent',c.color);this.root.style.setProperty('--im-glow',c.glow);this.label.textContent=c.name;this.shared.dataset.category=c.id;this.shared.setAttribute('aria-label',`${c.name}，当前选中专业方向`);this.root.querySelector('[data-im-name]').textContent=c.name;this.root.querySelector('[data-im-en]').textContent=c.en;this.root.querySelector('[data-im-description]').textContent=c.description;this.root.querySelector('[data-im-coverage]').textContent='沿用原有学习领域、职业关联与能力测评。';this.root.querySelector('[data-im-counter]').textContent=`${String(majorCategories.indexOf(c)+1).padStart(2,'0')} / ${String(majorCategories.length).padStart(2,'0')}`;}
 settle(mode,focus=false){
  this.mode=mode;this.desired=mode;this.root.dataset.mode=mode;this.root.dataset.phase='ready';this.root.dataset.bloom=mode==='home'?'active':'paused';this.root.setAttribute('aria-busy','false');this.busy=null;this.pendingCategory=null;
  this.resetSlots();this.applyInfo();this.arrange();this.setScenes(mode);
  this.shared.disabled=mode==='home';this.shared.tabIndex=mode==='home'?-1:0;this.shared.setAttribute('aria-hidden',String(mode==='home'));
  this.home.style.cssText='';this.selector.style.cssText='';this.info.style.cssText='';this.root.querySelector('.im-header').style.cssText='';this.root.querySelector('[data-im-enter]').disabled=false;this.root.querySelector('.im-hero-copy').style.cssText='';this.background.style.backgroundColor=mode==='home'?'#101112':'#f1f2f0';
  if(mode==='choose')this.dock();else{this.root.appendChild(this.shared);const r=relativeRect(this.root.querySelector('[data-bloom-anchor]'),this.root);this.shared.style.cssText='';Object.assign(this.shared.style,Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v+'px'])));this.art.style.cssText='';this.label.style.cssText='';}
  this.setVisual(mode);this.figures.forEach((layer,i)=>{layer.style.opacity=i===this.activeLayer?'1':'0';layer.style.transform='none';});this.glows.forEach((layer,i)=>{layer.style.opacity=i===this.activeLayer?'1':'0';});
  if(focus)(mode==='home'?this.home:this.selector).querySelector('h1')?.focus({preventScroll:true});
 }
 async intro(){this.scope.cancel();const token=this.scope.version;this.root.dataset.phase='intro';this.root.dataset.bloom='paused';await Promise.all([this.decode(this.art.querySelector('img')),this.decode(this.figures[0].querySelector('img'))]);if(this.disposed||token!==this.scope.version)return;
  await Promise.all([
   this.scope.play(this.figures[this.activeLayer],[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:this.duration(850)}),
   this.scope.play(this.art,[{transform:'scale(.13) rotate(-22deg)',opacity:.15},{offset:.65,transform:'scale(1.035) rotate(2deg)',opacity:1},{transform:'scale(1) rotate(0deg)',opacity:1}],{duration:this.duration(MOTION.intro),delay:this.duration(140)}),
   this.scope.play(this.root.querySelector('.im-hero-copy'),[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:this.duration(850),delay:this.duration(440)})
  ]);if(this.disposed||token!==this.scope.version)return;this.root.dataset.phase='ready';this.root.dataset.bloom='active';
 }
 async enter(skip=false){
  if(this.disposed||this.busy||this.mode==='choose')return;
  this.scope.cancel(true);const token=this.scope.version;this.busy='transition';this.desired='choose';this.root.dataset.phase='transition';this.root.dataset.bloom='paused';this.root.setAttribute('aria-busy','true');this.root.querySelector('[data-im-enter]').disabled=true;
  this.resetSlots();this.arrange();const from=this.detachShared(),to={...this.capsuleRect(),color:this.category.color};const visualFrom=relativeRect(this.visual,this.root),visualTo=this.rectFor('choose');
  const duration=skip?0:this.duration(MOTION.transition);
  const artFrom={width:this.art.offsetWidth+'px',height:this.art.offsetHeight+'px',left:this.art.offsetLeft+'px',top:this.art.offsetTop+'px',transform:this.art.style.transform||'none'};
  await Promise.all([
   this.scope.play(this.root.querySelector('.im-hero-copy'),[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-22px)'}],{duration:duration?350:0}),
   this.scope.play(this.shared,shapeFrames(from,to),{duration}),
   this.scope.play(this.art,[artFrom,{offset:.48,width:from.width*.63+'px',height:from.height*.63+'px',left:'0px',top:'0px',transform:'rotate(8deg)'},{width:'36px',height:'36px',left:'16px',top:'11px',transform:'rotate(0deg)'}],{duration}),
   this.scope.play(this.label,[{opacity:0},{offset:.65,opacity:0},{opacity:1}],{duration}),
   this.scope.play(this.root.querySelector('.im-header'),[{color:'#f3f1ed'},{color:'#111111'}],{duration}),
   this.scope.play(this.background,[{backgroundColor:'#101112'},{offset:.4,backgroundColor:'#3d3e42'},{backgroundColor:'#f1f2f0'}],{duration}),
   this.scope.play(this.visual,[visualFrom,{...visualTo}],{duration}),
   this.scope.play(this.selector,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:duration?MOTION.reveal:0,delay:duration?duration-MOTION.reveal:0})
  ]);
  if(this.disposed||token!==this.scope.version)return;
  this.settle('choose',true);this.root.querySelector('[data-im-enter]').disabled=false;this.onNavigate?.('choose');
 }
 async leave(){if(this.disposed||this.busy||this.mode==='home')return;this.scope.cancel();const token=this.scope.version;this.busy='transition';this.desired='home';this.root.dataset.phase='transition';this.root.setAttribute('aria-busy','true');
  this.home.style.opacity='1';const from=this.detachShared(),to=relativeRect(this.root.querySelector('[data-bloom-anchor]'),this.root);this.shared.disabled=true;this.shared.tabIndex=-1;
  await Promise.all([
   this.scope.play(this.shared,[{...from,borderRadius:'999px',backgroundColor:this.category.color},{offset:.45,left:to.left+(from.left-to.left)*.5,top:to.top+(from.top-to.top)*.5,width:to.width*.6,height:to.height*.5,borderRadius:'38px',backgroundColor:this.category.color+'55'},{...to,borderRadius:'47% 53% 49% 51%',backgroundColor:'transparent'}],{duration:this.duration(MOTION.transition)}),
   this.scope.play(this.art,[{width:'36px',height:'36px',left:'16px',top:'11px'},{width:to.width+'px',height:to.height+'px',left:'0px',top:'0px'}],{duration:this.duration(MOTION.transition)}),
   this.scope.play(this.selector,[{opacity:1},{opacity:0}],{duration:this.duration(450)}),
   this.scope.play(this.root.querySelector('.im-hero-copy'),[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:this.duration(650),delay:this.duration(800)}),
   this.scope.play(this.background,[{backgroundColor:'#f1f2f0'},{backgroundColor:'#101112'}],{duration:this.duration(MOTION.transition)}),
   this.scope.play(this.visual,[relativeRect(this.visual,this.root),this.rectFor('home')],{duration:this.duration(MOTION.transition)}),
   this.scope.play(this.root.querySelector('.im-header'),[{color:'#111111'},{color:'#f3f1ed'}],{duration:this.duration(MOTION.transition)}),
   this.scope.play(this.label,[{opacity:1},{opacity:0}],{duration:this.duration(300)})
  ]);if(this.disposed||token!==this.scope.version)return;this.settle('home',true);this.onNavigate?.('home');
 }
 step(direction){const index=majorCategories.indexOf(this.queued||this.pendingCategory||this.category);this.requestCategory(majorCategories[(index+direction+majorCategories.length)%majorCategories.length].id);}
 requestCategory(id,focus=false){const next=resolveCategory(id);if(this.mode!=='choose'||this.busy==='transition'||this.disposed)return;if(this.busy==='switch'){this.queued=next;this.queueFocus=focus;return;}if(next.id===this.category.id)return;this.switchTo(next,focus);}
 async switchTo(next,focus=false){
  this.scope.cancel();const token=this.scope.version;this.busy='switch';this.pendingCategory=next;this.root.dataset.phase='switching';this.root.setAttribute('aria-busy','true');const previous=this.category,oldLayer=this.activeLayer,newLayer=1-oldLayer;
  const figure=this.figures[newLayer],img=figure.querySelector('img');img.src=`./src/assets/silhouette-${next.pose}.webp`;const loaded=await this.decode(img);if(!loaded){img.src=this.figures[oldLayer].querySelector('img').src;await this.decode(img);}if(this.disposed||token!==this.scope.version)return;
  const before=new Map([...this.slots].map(([id,el])=>[id,el.getBoundingClientRect()]));const sharedFrom=this.detachShared();
  this.category=next;this.resetSlots();this.arrange();const to={...this.capsuleRect(),color:next.color};this.glows[newLayer].style.background=`radial-gradient(ellipse,${next.glow}b8 0%,${next.glow}60 38%,transparent 72%)`;
  const duration=this.duration(MOTION.switch),cycle=this.rail.scrollWidth;
  const moves=[...this.slots].map(([id,el])=>{const delta=flipDelta(before.get(id),el.getBoundingClientRect(),cycle);return this.scope.play(el,[{transform:`translate(${delta.x}px,${delta.y}px)`},{transform:'translate(0,0)'}],{duration});});
  this.label.textContent=next.name;this.shared.setAttribute('aria-label',`${next.name}，当前选中专业方向`);
  await Promise.all([
   ...moves,
   this.scope.play(this.shared,[{...sharedFrom,backgroundColor:previous.color},{...to,backgroundColor:next.color}],{duration}),
   this.scope.play(this.label,[{opacity:.15,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:duration?500:0}),
   this.scope.play(this.figures[oldLayer],[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(-12px)'}],{duration}),
   this.scope.play(figure,[{opacity:0,transform:'translateX(14px)'},{opacity:1,transform:'translateX(0)'}],{duration}),
   this.scope.play(this.glows[oldLayer],[{opacity:1},{opacity:0}],{duration}),
   this.scope.play(this.glows[newLayer],[{opacity:0},{opacity:1}],{duration}),
   (async()=>{await this.scope.play(this.info,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-7px)'}],{duration:duration?200:0});if(this.disposed||token!==this.scope.version)return;this.applyInfo();await this.scope.play(this.info,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:duration?450:0});})()
  ]);if(this.disposed||token!==this.scope.version)return;
  this.activeLayer=newLayer;this.settle('choose');if(focus)this.shared.focus({preventScroll:true});this.root.querySelector('.im-status').textContent=`已选择${next.name}。可进入原有专业探索。`;
  const queued=this.queued,queuedFocus=this.queueFocus;this.queued=null;if(queued&&queued.id!==this.category.id)this.requestCategory(queued.id,queuedFocus);else this.onCategory?.(next.id);
 }
 update({stage,categoryId}){const mode=stage==='choose'?'choose':'home',c=resolveCategory(categoryId);if(this.disposed)return;
  if(this.busy||mode!==this.mode||c.id!==this.category.id){this.scope.cancel();this.queued=null;this.category=c;const img=this.figures[this.activeLayer].querySelector('img');img.src=`./src/assets/silhouette-${c.pose}.webp`;this.glows[this.activeLayer].style.background=`radial-gradient(ellipse,${c.glow}b8 0%,${c.glow}60 38%,transparent 72%)`;this.settle(mode,true);}
 }
 resize(){if(this.disposed)return;const commit=this.busy==='transition'?this.desired:null,switching=this.busy==='switch';this.scope.cancel();this.queued=null;this.figures[this.activeLayer].querySelector('img').src=`./src/assets/silhouette-${this.category.pose}.webp`;this.glows[this.activeLayer].style.background=`radial-gradient(ellipse,${this.category.glow}b8 0%,${this.category.glow}60 38%,transparent 72%)`;this.settle(commit||this.mode);this.root.querySelector('[data-im-enter]').disabled=false;if(commit)this.onNavigate?.(commit);else if(switching)this.onCategory?.(this.category.id);}
 click(event){const b=event.target.closest('button');if(!b||b.disabled||!this.root.contains(b))return;const d=b.dataset;
  if(Date.now()<(this.suppressClickUntil||0)){event.preventDefault();return;}
  if('imEnter'in d)this.enter();else if('imSkip'in d)this.enter(true);else if('imHome'in d)this.leave();else if('imPrev'in d)this.step(-1);else if('imNext'in d)this.step(1);else if('category'in d)this.requestCategory(d.category,true);else if('imExplore'in d&&!this.busy)this.onExplore?.(this.category.id);
 }
 keydown(e){if(this.mode!=='choose'||(!e.target.closest('.im-capsule-rail')&&e.target!==this.shared))return;const keys={ArrowRight:1,ArrowLeft:-1};if(e.key in keys){e.preventDefault();const index=majorCategories.indexOf(this.queued||this.pendingCategory||this.category);this.requestCategory(majorCategories[(index+keys[e.key]+majorCategories.length)%majorCategories.length].id,true);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();this.requestCategory(majorCategories[e.key==='Home'?0:majorCategories.length-1].id,true);}}
 dispose(){this.disposed=true;this.scope.cancel();this.abort.abort();this.media?.removeEventListener?.('change',this.onReduced);this.queued=null;}
}
let current=null;
export function initImmersive(root,state,callbacks){const scene=root.querySelector?.('#immersive-experience');if(!scene){current?.dispose();current=null;return null;}if(current?.root===scene){current.update(state);return current;}current?.dispose();current=new ImmersiveController(scene,callbacks);return current;}
export function disposeImmersive(){current?.dispose();current=null;}
