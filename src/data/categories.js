/** Two visual entry points mapped directly to the existing project data.
 * These are site exploration entries, not a complete undergraduate taxonomy.
 * Original majors, learning directions, careers and assessments are unchanged.
 */
export const majorCategories=[
 {id:'chinese',name:'汉语言文学',en:'CHINESE LANGUAGE & LITERATURE',description:'从语言、审美和文本出发，走向编辑、内容、品牌、产品和表达。',color:'#bca8ed',glow:'#b7a1e6',pose:'a',majorIds:['chinese']},
 {id:'journalism',name:'新闻传播',en:'JOURNALISM & COMMUNICATION',description:'从叙事、洞察和传播出发，走向内容、品牌、产品和运营。',color:'#99d6ee',glow:'#9fcfe9',pose:'c',majorIds:['journalism']}
];
export const categoryById=Object.fromEntries(majorCategories.map(c=>[c.id,c]));
export const resolveCategory=(id,majorId)=>categoryById[id]||categoryById[majorId]||majorCategories[0];
export function majorsInCategory(categoryId,majors){const category=categoryById[categoryId];return category?majors.filter(m=>category.majorIds.includes(m.id)):[];}
export function capsuleOrder(id){const index=Math.max(0,majorCategories.findIndex(c=>c.id===id)),half=Math.floor(majorCategories.length/2);return majorCategories.map((_,i)=>majorCategories[(index-half+i+majorCategories.length)%majorCategories.length].id);}
