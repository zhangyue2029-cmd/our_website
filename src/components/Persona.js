// Pre-generated original characters; result matching happens locally in results.js.
// No live AI service, no hidden API call and no personality diagnosis.
export function PersonaArt(persona){
 const asset=['core','tool','general'].includes(persona.key)?persona.key:'explorer';
 return `<img class="persona-image" src="./src/assets/persona-${asset}.webp" width="720" height="720" alt="去向原创${persona.name}，${asset==='core'?'手持笔记与笔的创作伙伴':asset==='tool'?'手持平板与几何模块的造物伙伴':asset==='general'?'手持连接模块的协作伙伴':'手持地图的启程伙伴'}" decoding="async">`;
}
