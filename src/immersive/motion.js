// Web Animations + FLIP: no third-party runtime or frame-by-frame React render.
export const MOTION={intro:1100,transition:1650,switch:700,reveal:650};
export const EASE='cubic-bezier(.22,1,.36,1)';
export function relativeRect(element,root){const r=element.getBoundingClientRect(),p=root.getBoundingClientRect();return {left:r.left-p.left,top:r.top-p.top,width:r.width,height:r.height};}
export function shapeFrames(from,to){return [
 {...from,borderRadius:'47% 53% 49% 51%',backgroundColor:'transparent'},
 {offset:.48,left:from.left+(to.left-from.left)*.35,top:from.top+(to.top-from.top)*.4,width:from.width*.64,height:from.height*.48,borderRadius:'38px',backgroundColor:to.color+'55'},
 {left:to.left,top:to.top,width:to.width,height:to.height,borderRadius:'999px',backgroundColor:to.color}
];}
export function flipDelta(from,to,cycle){let dx=from.left-to.left;if(cycle){if(dx>cycle/2)dx-=cycle;if(dx<-cycle/2)dx+=cycle;}return {x:dx,y:from.top-to.top};}
export class AnimationScope {
 constructor(){this.animations=new Set();this.version=0;}
 cancel(preserve=false){this.version++;for(const a of this.animations){if(preserve){try{a.commitStyles?.();}catch{}}a.cancel();}this.animations.clear();}
 async play(element,frames,options={}){if(!element)return false;const {duration=0,...rest}=options;
  if(!duration||!element.animate){const last=frames[frames.length-1];for(const [key,value] of Object.entries(last))if(key!=='offset')element.style[key]=typeof value==='number'&&['width','height','left','top'].includes(key)?value+'px':String(value);return true;}
  const cssFrames=frames.map(frame=>Object.fromEntries(Object.entries(frame).map(([key,value])=>[key,typeof value==='number'&&['width','height','left','top'].includes(key)?value+'px':value])));
  const a=element.animate(cssFrames,{duration,fill:'both',easing:EASE,...rest});this.animations.add(a);
  try{await a.finished;if(this.animations.has(a)){try{if(a.commitStyles)a.commitStyles();else Object.assign(element.style,cssFrames[cssFrames.length-1]);}catch{for(const [key,value] of Object.entries(cssFrames[cssFrames.length-1]))if(key!=='offset')element.style[key]=String(value);}a.cancel();this.animations.delete(a);}return true;}catch{return false;}
 }
}
