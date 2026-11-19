const careerAssets = {journalist:'broadcast',editor:'literature','new-media':'signal','content-ops':'modules',brand:'signal',pr:'broadcast',video:'film',pm:'modules','user-ops':'modules',marketing:'signal',publisher:'literature',copywriter:'literature',screenwriter:'film',teacher:'literature'};
export function SpatialArt(kind='compass',className='') {
  return `<span class="spatial-art ${className}" aria-hidden="true"><span class="spatial-halo"></span><img src="./src/assets/${kind}.svg" alt="" width="480" height="360" decoding="async"><span class="spatial-orbit"></span></span>`;
}
export function CareerArt(id) { return SpatialArt(careerAssets[id] || 'modules','career-art'); }
export function MetricCards(portrait) {
 const buckets=[['have','已有积累','继续在实践中巩固'],['forming','正在形成','让经历成为稳定能力'],['grow','重点培养','下一步的练习方向']];
 return `<div class="metric-grid">${buckets.map(([key,title,note])=>`<article class="card metric metric-${key}"><span>${title}</span><strong>${portrait.filter(p=>p.level===key).length}<small> 项</small></strong><p>${note}</p></article>`).join('')}</div>`;
}
