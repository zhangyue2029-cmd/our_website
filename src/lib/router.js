export const STAGE_TITLES={home:'品牌首页',choose:'选择专业',majors:'选择专业',focus:'选择学习领域',explore:'职业星系',detail:'职业详情',market:'能力要求',background:'个人背景',assess:'看看我的能力',portrait:'我的职业画像',structure:'我的能力结构',distance:'与职业的距离',advice:'我的发展建议',gap:'能力差距'};
const stages=new Set(Object.keys(STAGE_TITLES));
export const normalizeDetailPart = part => ["paths", "recruitment"].includes(part) ? part : "overview";
export function routeFor(s){const page=s.tab==='explore'?s.stage:s.tab;const q=new URLSearchParams();for(const [key,value] of Object.entries({category:s.categoryId&&s.categoryId!=='chinese'?s.categoryId:null,major:s.majorId,direction:s.directionId,career:s.careerId,return:s.tab==='mine'&&s.stage==='background'?'background':null,q:s.stage==='assess'?s.questionIndex:null,part:['detail','background'].includes(s.stage)&&normalizeDetailPart(s.detailPart)!=='overview'?s.detailPart:null})){if(value!==null&&value!==undefined)q.set(key,String(value));}return '#/'+page+(q.size?'?'+q:'');}
export function parseRoute(hash){const [path,query='']=hash.replace(/^#\/?/,'').split('?');const p=new URLSearchParams(query);const page=stages.has(path)||['direction','community','mine'].includes(path)?path:'home';const question=Number(p.get('q'));return {tab:['direction','community','mine'].includes(page)?page:'explore',stage:stages.has(page)?page:page==='mine'&&p.get('return')==='background'?'background':'choose',categoryId:p.get('category')||'chinese',majorId:p.get('major'),directionId:p.get('direction'),careerId:p.get('career'),detailPart:normalizeDetailPart(p.get('part')),questionIndex:Number.isInteger(question)&&question>=0?question:0};}
export function createRouter({getState,setState,host=globalThis.window}){
 if(!host?.history||!host?.location||!host.addEventListener)return {start(){},sync(){}};
 let restoring=false;
 const snapshot=()=>JSON.parse(JSON.stringify(getState()));
 function restore(){restoring=true;const route=parseRoute(host.location.hash);const saved=host.history.state?.quxiangJourney;
 // Only use snapshots for exactly their recorded route, not a manually edited hash.
 const current=getState(),sameCareer=route.careerId===current.careerId;
 const matching=saved&&saved.historyGeneration===current.historyGeneration&&routeFor(saved)===host.location.hash;
 setState(matching?{...saved,answers:sameCareer?current.answers:saved.answers,selectedSkillId:null}:{...route,answers:sameCareer?current.answers:{},selectedSkillId:null});}
 return {
 start(){host.addEventListener('popstate',restore);host.addEventListener('hashchange',()=>{if(routeFor(getState())!==host.location.hash)restore();});
  if(host.location.hash)restore();else setState({stage:'home',tab:'explore'});
 },
 sync(){const hash=routeFor(getState()),data={quxiangJourney:snapshot()};
  if(restoring||!host.history.state?.quxiangJourney){host.history.replaceState(data,'',hash);restoring=false;}
  else if(host.location.hash!==hash)host.history.pushState(data,'',hash);
  else host.history.replaceState(data,'',hash);
 }
 };
}
