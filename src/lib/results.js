import {summarizeGap} from './gap.js';
import {SKILL_CATEGORIES} from '../types.js';
export function abilityDistance(portrait){
 const valid=portrait.filter(p=>Number.isFinite(p.userScore)&&Number.isFinite(p.market)&&p.importance>0);
 const weight=valid.reduce((sum,p)=>sum+p.importance,0);
 if(!weight)return null;
 const current=valid.reduce((sum,p)=>sum+p.importance*p.userScore,0)/weight;
 const target=valid.reduce((sum,p)=>sum+p.importance*p.market,0)/weight;
 const shortfall=valid.reduce((sum,p)=>sum+p.importance*Math.max(0,p.market-p.userScore),0)/weight;
 return {current,target,shortfall,netGap:target-current,count:valid.length};
}
export function personaFor(portrait){
 const grouped=Object.keys(SKILL_CATEGORIES).map(category=>{const items=portrait.filter(p=>p.category===category);return {category,count:items.length,score:items.length?items.reduce((s,p)=>s+p.userScore,0)/items.length:0};}).filter(x=>x.count);
 const ranking=grouped.sort((a,b)=>b.score-a.score);
 const neutral=!ranking.length||ranking[0].score<=14||ranking.filter(x=>Math.abs(x.score-ranking[0].score)<.01).length>1;
 const key=neutral?'explorer':ranking[0].category;
 const names={explorer:'启程伙伴',core:'灵感伙伴',tool:'造物伙伴',general:'连接伙伴',bonus:'探索伙伴'};
 const colors={explorer:'yellow',core:'coral',tool:'blue',general:'mint',bonus:'lavender'};
 return {key,name:names[key],color:colors[key],category:neutral?null:ranking[0].category,score:neutral?null:ranking[0].score,
 reason:neutral?'当前多个类别表现接近，或经历尚少，使用中性的启程形象。':`${SKILL_CATEGORIES[ranking[0].category]}的平均自评分为 ${ranking[0].score.toFixed(1)} / 100，在本次已测类别中最高。`,
 groups:ranking};
}
const exercises={
 writing:['选一个校园议题，写一篇面向真实读者的短文','请一位读者标出不清楚的句子，修改并保存前后两版'],
 interviewing:['围绕一个真实问题设计 6 个开放问题，完成一次征得同意的访谈','整理事实、原话与待核实信息，并补问遗漏点'],
 'news-sense':['连续一周记录 5 个候选选题，说明公共价值和信息来源','对比已发布报道，复盘选题判断的依据'],
 editing:['找一篇获得使用许可的文章，完成结构调整与校对','记录每项修改的理由，请作者或同伴反馈'],
 'content-planning':['为一个主题设计 4 期栏目，明确读者与每期价值','做出一份选题表，复盘内容之间是否重复'],
 'social-ops':['为校园项目设计一周账号发布与互动计划','记录触达、互动及反馈，选一个问题调整下一轮内容'],
 'video-edit':['使用合法素材剪一段 60 秒视频，完成字幕和音量调整','保存工程并请同伴反馈节奏与信息清晰度'],
 'visual-story':['围绕一件小事画出 6 镜头分镜并拍摄','请观众复述故事，检查信息是否被正确理解'],
 'brand-strategy':['选择熟悉的组织，写清目标人群、主张和差异','用 3 个传播触点检查语气与主张是否一致'],
 'pr-crisis':['以公开案例整理事实、利益相关方和沟通风险','模拟一份对外说明，标注未核实内容与回应边界'],
 'product-thinking':['记录一个真实使用困难，拆成问题、假设与方案','用纸面原型验证一项假设，说明取舍依据'],
 'user-research':['征得同意后访谈 3 位目标用户，围绕真实使用场景提问','区分观察与推断，整理需求证据和待验证问题'],
 'product-design':['为一个简单任务绘制流程并制作可点击原型','请同伴试用，记录卡点并修订一个交互'],
 'project-mgmt':['为一项两周小项目列出任务、责任与依赖','每周检查进度与风险，保存一次复盘'],
 communication:['在一次小组协作中记录目标、分工和决策','请参与者核对理解是否一致，修正沟通遗漏'],
 'data-analysis':['整理一份可公开使用的小数据集，定义一个问题和指标','制作二维图表，区分发现、推断与样本局限'],
 'ai-tools':['用 AI 辅助一次资料整理，保留原始材料与提示词','逐项核对输出的事实、引用与隐私边界'],
 'info-org':['把一组零散材料整理成带来源的结构化笔记','请他人在笔记中查找信息，修正导航与命名'],
 'user-ops':['为一个现有群体梳理需求、分层及互动计划','记录实际反馈，复盘哪些动作有帮助'],
 marketing:['为一次校园活动明确人群、渠道和转化目标','对照目标记录结果，说明渠道与物料的改进依据'],
 copywriting:['为同一个传播目标写 5 组标题和短文案','请目标读者说明理解和行动意愿，再选择修改'],
 literary:['精读两篇风格不同的作品，分析结构、节奏与语言','引用具体段落支持判断，讨论不同理解'],
 publishing:['依据公开资料画出选题到出版的流程与交付物','模拟管理一次稿件版本、编辑意见和排期'],
 teaching:['把一个知识点做成 10 分钟讲解和一项练习','请学习者完成练习，据反馈修改讲解'],
 screenwriting:['写一份短故事大纲，明确人物目标、阻碍与变化','用一场戏验证冲突是否可被观众理解']
};
export function reportFor(portrait,careerName){
 const summary=summarizeGap(portrait,careerName);
 const strengths=[...portrait].sort((a,b)=>(b.userScore/Math.max(b.market,1))-(a.userScore/Math.max(a.market,1))).slice(0,2);
 const priorities=[...portrait].filter(p=>p.market>p.userScore).sort((a,b)=>b.importance-a.importance||(b.market-b.userScore)-(a.market-a.userScore)).slice(0,3);
 const actions=priorities.map(p=>({ ...p,steps:exercises[p.skillId]||['完成一次与该能力有关的真实练习','保存过程并根据反馈复盘'],mode:p.level==='grow'?'从小练习开始':p.level==='forming'?'重复练习并收集反馈':'在更真实的项目中巩固'}));
 return {summary,strengths,priorities,actions};
}
