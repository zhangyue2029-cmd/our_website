export function initGalaxy(root) {
 const galaxy=root.querySelector?.('[data-galaxy]');if(!galaxy)return;
 const nodes=[...galaxy.querySelectorAll('[data-node]')], lines=[...galaxy.querySelectorAll('.galaxy-line')];
 const data=JSON.parse(galaxy.querySelector('[data-galaxy-data]').textContent);
 const peek=galaxy.querySelector('.peek'),open=galaxy.querySelector('[data-open-career]');
 let selected=galaxy.dataset.selected||null,hovered=null;
 function refresh(){const current=hovered||selected;
 nodes.forEach(el=>{const id=el.dataset.node,linked=!current||id===current||lines.some(l=>(l.dataset.a===current&&l.dataset.b===id)||(l.dataset.b===current&&l.dataset.a===id));el.classList.toggle('dim',!linked);el.classList.toggle('active',id===current);el.setAttribute('aria-pressed',String(id===selected));});
 lines.forEach(l=>{const lit=l.dataset.a===current||l.dataset.b===current;l.classList.toggle('lit',!!current&&lit);l.classList.toggle('dim',!!current&&!lit);});}
 function select(id){selected=id==='major'?null:id;const c=data.find(c=>c.id===selected);peek.hidden=!c;if(c){galaxy.querySelector('[data-peek-title]').textContent=c.name;galaxy.querySelector('[data-peek-tag]').textContent=c.tagline;open.dataset.career=c.id;}else delete open.dataset.career;refresh();}
 nodes.forEach(b=>{b.addEventListener('pointerenter',()=>{hovered=b.dataset.node;refresh();});b.addEventListener('pointerleave',()=>{hovered=null;refresh();});b.addEventListener('focus',()=>{hovered=b.dataset.node;refresh();});b.addEventListener('blur',()=>{hovered=null;refresh();});b.addEventListener('click',()=>select(b.dataset.node));});
 galaxy.querySelector('[data-close-peek]').addEventListener('click',()=>{const prior=selected;select('major');nodes.find(n=>n.dataset.node===prior)?.focus({preventScroll:true});});
 galaxy.addEventListener('keydown',e=>{if(e.key==='Escape'){const prior=selected;select('major');nodes.find(n=>n.dataset.node===prior)?.focus({preventScroll:true});}});
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)galaxy.querySelectorAll('animateMotion').forEach(a=>a.remove());
 select(selected||'major');
}
