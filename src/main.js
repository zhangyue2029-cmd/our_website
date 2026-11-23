import { ImmersivePages } from "./immersive/view.js";
import { initImmersive, disposeImmersive } from "./immersive/controller.js";
import { resolveCategory } from "./data/categories.js";
import { getState, setState, resetJourney, canSaveProgress, subscribe } from "./lib/store.js";
import { getMajors, getCareersForMajor, getCareer, getMarketProfile, getAssessment, getMajorDirections, getCareersForDirection } from "./data/api.js";
import { directionSources, directionNote } from "./data/directions.js";
import { createRouter, STAGE_TITLES } from "./lib/router.js";
import { personaFor } from "./lib/results.js";
import { ResultNav, RadarChart, AbilityTable, DistanceView, AdviceView, PersonaSummary } from "./components/results.js";
import { PersonaArt } from "./components/Persona.js";
import { buildPortrait, summarizeGap } from "./lib/gap.js";
import { JourneyHeader, BottomNav, Icon } from "./components/chrome.js";
import { SpatialArt, CareerArt, MetricCards } from "./components/SpatialArt.js";
import { initGalaxy } from "./components/GalaxyInteraction.js";
import { CareerMap } from "./components/CareerMap.js";
import { SkillCardList, SkillBars, GapColumns, QuestionCard } from "./components/skills.js";

const app = document.getElementById("app");
let cache = { majors: [], careers: [], allCareers: [], career: null, profile: [], questions: [], portrait: [] };
let renderToken = 0;
let previousScreen = "";
const stageTitles = STAGE_TITLES;
const answeredCount = () => cache.questions.filter(q => getState().answers[q.id]).length;
const completed = () => cache.questions.length > 0 && answeredCount() === cache.questions.length;
const firstUnanswered = () => Math.max(0, cache.questions.findIndex(q => !getState().answers[q.id]));

// Build an isolated snapshot: stale asynchronous work must never overwrite the visible data.
async function hydrate(source) {
  const [majors, allCareers] = await Promise.all([getMajors(), getCareersForMajor("all")]);
  const categoryId = resolveCategory(source.categoryId,source.majorId).id;
  const majorId = source.majorId === "all" || majors.some(m => m.id === source.majorId) ? source.majorId : null;
  const directions = majorId ? await getMajorDirections(majorId) : [];
  const directionId = directions.some(d=>d.id===source.directionId) ? source.directionId : null;
  const majorCareers = majorId ? await getCareersForMajor(majorId) : [];
  const careers = majorId ? await getCareersForDirection(majorId,directionId) : [];
  const careerId = majorCareers.some(c => c.id === source.careerId) ? source.careerId : null;
  const [career, profile, questions] = careerId ? await Promise.all([getCareer(careerId), getMarketProfile(careerId), getAssessment(careerId)]) : [null, [], []];
  const answers = {};
  for (const q of questions) {
    const saved = source.answers[q.id];
    const option = saved && q.options[saved.optionIndex];
    if (option) answers[q.id] = { questionId: q.id, skillId: q.skillId, optionIndex: saved.optionIndex, score: option.score };
  }
  const complete = questions.length > 0 && questions.every(q => answers[q.id]);
  let stage = source.stage === "majors" ? "choose" : source.stage;
  let questionIndex = Math.min(source.questionIndex, Math.max(0, questions.length - 1));
  if (!majorId && !["home","choose","majors"].includes(stage)) stage = "choose";
  else if (!careerId && !["home", "choose", "majors", "focus", "explore"].includes(stage)) stage = "explore";
  else if (["portrait", "structure", "distance", "advice", "gap"].includes(stage) && !complete) {
    stage = "assess";
    questionIndex = Math.max(0, questions.findIndex(q => !answers[q.id]));
  }
  const patch = { categoryId, majorId, directionId, careerId, answers, stage, questionIndex };
  const portrait = buildPortrait(profile, Object.fromEntries(Object.values(answers).map(a => [a.skillId, a.score])));
  return { patch, data: { majors, directions, majorCareers, allCareers, careers, career, profile, questions, portrait } };
}

function renderHome(){return ImmersivePages({stage:'home',categoryId:getState().categoryId});}
function renderChoose(){return ImmersivePages({stage:"choose",categoryId:getState().categoryId});}
function renderFocus() {
 const s=getState(),m=cache.majors.find(m=>m.id===s.majorId),source=directionSources[s.majorId];
 if(!m)return `<section>${heading('02 / EXPLORATION PATHS','跨专业，自由探索。','从现有全部职业中选择，不添加未经核实的专业分类。','majors')}<button class="btn btn-primary" data-to="explore">进入职业星系 ${Icon('arrow')}</button></section>`;
 return `<section class="stage-enter focus-page">${heading(`02 / ${m.name}`,s.majorId==='chinese'?'从语言与文学，向外探索。':'从事实与传播，向外探索。','选择一条学习与探索路径，或查看这个专业的全部职业。','majors')}<p class="classification-note">${directionNote}</p><div class="direction-grid">${cache.directions.map((d,i)=>`<button type="button" class="learning-direction ${d.id===s.directionId?'is-selected':''}" data-direction="${d.id}" aria-pressed="${d.id===s.directionId}"><span class="direction-index">0${i+1}</span><span class="direction-content"><strong>${d.name}</strong><span>${d.intro}</span><span class="topic-list">${d.topics.map(t=>`<span>${t}</span>`).join('')}</span></span>${SpatialArt(d.art,'learning-art')}<span class="round-arrow">${Icon('arrow')}</span></button>`).join('')}</div><div class="page-actions"><button class="btn btn-primary" data-all-directions>查看${m.name}全部 ${m.careerIds.length} 个职业 ${Icon('arrow')}</button><details class="source-note"><summary>学习领域的参考与分类说明</summary><p>领域主题参考 <a href="${source.url}" target="_blank" rel="noopener">${source.title}</a>；具体路径名称及职业子集由本站编辑组织，不是该校正式方向清单。院校培养方案、师范要求及资格条件需要另行确认。</p></details></div></section>`;
}

function heading(kicker, title, description, back = "") {
  return `<div class="page-heading">${back ? `<button class="text-button back-button" data-to="${back}">${Icon("back")} 返回${stageTitles[back]}</button>` : ""}<p class="eyebrow">${kicker}</p><h1 class="display" tabindex="-1">${title}</h1><p class="sub">${description}</p></div>`;
}
function renderExplore() {
  const s = getState();
  const major = s.majorId === "all" ? "跨专业探索" : cache.majors.find(m => m.id === s.majorId)?.name;
  const direction = cache.directions.find(item => item.id === s.directionId);
  const highlightDirection = s.majorId === "journalism" && direction;
  const careers = highlightDirection ? cache.majorCareers : cache.careers;
  return `<section class="stage-enter">${heading(major, "你的专业，能够走向哪里？", "点选一个职业，了解它的日常，也看见它需要怎样的能力。", "focus")}${direction ? `<p class="path-context">当前路径：${direction.name}<button class="text-button" data-all-directions>${highlightDirection ? "清除路径高亮" : "查看专业全部职业"}</button></p>` : ""}${CareerMap({ careers, highlightedIds: highlightDirection ? direction.careerIds : [], selectedId: s.careerId, majorId: s.majorId, majorName: major })}</section>`;
}
function renderDetail() {
 const c=cache.career,part=getState().detailPart||'overview';
 const overview=`<div class="detail-grid"><article class="card info-card"><p class="eyebrow">01 / 工作内容</p><h2>这个职业，主要做什么？</h2><ol class="work-list">${c.work.map((x,i)=>`<li><span>0${i+1}</span>${x}</li>`).join('')}</ol></article><article class="card info-card"><p class="eyebrow">02 / 工作场景</p><h2>可能在哪里工作？</h2><ul class="scene-tags">${c.scenes.map(x=>`<li>${x}</li>`).join('')}</ul><p class="fine-print">相关专业：${cache.majors.filter(m=>c.relatedMajorIds.includes(m.id)).map(m=>m.name).join(' · ')}</p></article></div>`;
 const paths=`<article class="career-paths"><p class="eyebrow">相邻职业 / 原有关系数据</p><h2>沿着联系，看看更多可能。</h2><div class="related-careers">${c.connections.map(id=>cache.allCareers.find(x=>x.id===id)).filter(Boolean).map(x=>`<button class="btn btn-ghost" data-major-career="${x.id}">${x.name}${Icon('arrow')}</button>`).join('')}</div><p>${c.marketIntro}</p><p class="fine-print">相邻关系用于探索，不等于职业晋升路径；本项目没有可靠的薪资、年限与晋升数据。</p></article>`;
 return `<section class="stage-enter"><div class="spatial-heading">${heading('04 / CAREER PROFILE',c.name,c.tagline,'explore')}${CareerArt(c.id)}</div><nav class="detail-tabs" aria-label="职业档案分页"><button data-detail-part="overview" ${part==='overview'?'aria-current="page"':''}>工作与场景</button><button data-detail-part="paths" ${part==='paths'?'aria-current="page"':''}>相邻职业与下一步</button></nav>${part==='paths'?paths:overview}<div class="page-actions"><button class="btn btn-primary" data-to="market">查看 ${cache.profile.length} 项能力要求 ${Icon('arrow')}</button><button class="text-button" data-resume-assess>看看我的能力 ${Icon('arrow')}</button></div></section>`;
}

function demoNote() { return `<div class="notice">${Icon("info")}<p>当前为演示数据，用于理解职业能力要求，不代表实时招聘统计。</p></div>`; }
function renderMarket() {
  return `<section class="stage-enter"><div class="spatial-heading compact-heading">${heading(cache.career.name,"市场正在寻找什么样的人？","拆解企业关注的核心能力，点击卡片了解具体要求。","detail")}${CareerArt(cache.career.id)}</div>${demoNote()}<div class="section-heading"><h2>能力要求 <span class="count">${cache.profile.length} 项</span></h2><span class="muted">重要程度：1—5</span></div>${SkillCardList({profile:cache.profile,openId:getState().selectedSkillId})}<div class="action-panel"><div><h2>了解市场，也看看自己。</h2><p>通过 ${cache.questions.length} 个问题，梳理已有的能力。</p></div><button class="btn btn-primary" data-resume-assess>${answeredCount() && !completed() ? "继续能力互动" : "看看我现在有什么"}${Icon("arrow")}</button></div></section>`;
}
function renderAssess() {
 const s=getState(),q=cache.questions[s.questionIndex];
 if(!q)return `<section>${heading('能力互动','暂时没有可用题目','请选择其他职业继续探索。','explore')}</section>`;
 return `<section class="stage-enter assessment-page"><header class="assessment-header"><div><p class="eyebrow">05 / ${cache.career.name}</p><h1 tabindex="-1">看看我的能力。</h1></div><button class="text-button" data-to="market">${Icon('back')} 返回能力要求</button></header>${QuestionCard({question:q,index:s.questionIndex,total:cache.questions.length,selected:s.answers[q.id]?.optionIndex,answered:answeredCount()})}</section>`;
}
function resultHeading(stage,title,desc){return `${heading(`06 / 目标职业 · ${cache.career.name}`,title,desc,'market')}${ResultNav(stage)}`;}
function renderPortrait() {
 const p=personaFor(cache.portrait),summary=summarizeGap(cache.portrait,cache.career.name);
 return `<section class="stage-enter result-page">${resultHeading('portrait','我的职业画像。','从真实经历出发，为这一次探索找到一个形象。')}<div class="persona-layout"><div class="persona-stage persona-${p.color}">${PersonaArt(p)}</div><article class="persona-copy"><p class="eyebrow">去向原创伙伴 / 结果视觉主题</p><h2>${p.name}</h2><p>${summary.lines[0]}</p><p>已完成 ${cache.questions.length} 个问题。目标职业：${cache.career.name}。</p>${PersonaSummary(cache.portrait)}<button class="btn btn-primary" data-to="structure">查看我的能力结构 ${Icon('arrow')}</button></article></div><div class="result-footer"><button class="text-button" data-review>回看并修改回答 ${Icon('arrow')}</button><button class="text-button" data-to="gap">查看原有差距分类 ${Icon('arrow')}</button></div></section>`;
}
function renderStructure(){return `<section class="stage-enter result-page">${resultHeading('structure','我的能力结构。','每一个维度，都来自本次目标职业对应的真实题目。')}<div class="radar-layout"><div class="radar-panel"><div class="radar-legend"><span><i></i>当前自评分</span><span><i></i>演示市场参考</span></div>${RadarChart(cache.portrait)}</div><aside class="radar-explanation"><h2>把积累，画成轮廓。</h2><p>使用本次 ${cache.portrait.length} 项已测能力作为图轴，不虚构“人格”维度。</p><p>各项范围 0–100；自评分来自原选项，市场参考由原重要程度换算。</p><button class="btn btn-primary" data-to="distance">看与职业的距离 ${Icon('arrow')}</button></aside></div>${AbilityTable(cache.portrait)}<details class="individual-skills"><summary>展开每项能力的对照与原因</summary>${SkillBars({portrait:cache.portrait,openId:getState().selectedSkillId})}</details></section>`;}
function renderDistance(){return `<section class="stage-enter result-page">${resultHeading('distance','我与职业的距离。','看清已有积累、参考要求和需要优先补足的能力。')}${DistanceView(cache.portrait)}<div class="page-actions"><button class="btn btn-primary" data-to="advice">查看发展建议 ${Icon('arrow')}</button><button class="text-button" data-to="structure">${Icon('back')} 返回能力结构</button></div></section>`;}
function renderAdvice(){return `<section class="stage-enter result-page">${resultHeading('advice','把下一步，变具体。','根据这次回答与目标职业，把差距转化为可以开始的练习。')}${AdviceView(cache.portrait,cache.career)}<div class="page-actions"><button class="btn btn-primary" data-review>完成实践后，重新看看能力 ${Icon('arrow')}</button><button class="text-button" data-to="explore">探索其他职业 ${Icon('arrow')}</button></div></section>`;}

function renderGap() {
  const summary = summarizeGap(cache.portrait,cache.career.name);
  return `<section class="stage-enter"><div class="spatial-heading compact-heading">${heading(cache.career.name,"每一份差距，都有成长的空间。","我们只谈能力差距，不给“适不适合”的判决。","portrait")}${SpatialArt("portrait","gap-art")}</div>${GapColumns(summary)}<article class="summary"><span class="info-icon">${Icon("leaf")}</span><div><p class="eyebrow">写给下一步的你</p>${summary.lines.map(l=>`<p>${l}</p>`).join("")}</div></article><div class="actions"><button class="btn btn-primary" data-to="explore">看看其他职业${Icon("arrow")}</button><button class="btn btn-ghost" data-review>回看我的回答</button></div></section>`;
}
function renderDirection() {
  const c = cache.career;
  if (!c) return `<section>${heading("MY DIRECTION","我的方向","一个想走近的职业，就是探索的开始。") }<div class="empty-state">${Icon("route")}<h2>你的下一站，还等你来发现。</h2><p>先从专业或职业出发，选一个你想了解的方向。</p><button class="btn btn-primary" data-tab-jump>去探索${Icon("arrow")}</button></div></section>`;
  const done = completed(), count = answeredCount();
  return `<section class="stage-enter">${heading("MY DIRECTION","我的方向","不急着给自己一个答案，沿着这条路径继续看看。") }<article class="direction-card">${CareerArt(c.id)}<div class="direction-label">${Icon("compass")} 当前目标职业</div><h2>${c.name}</h2><p>${c.tagline}</p><div class="direction-progress"><span>${done ? "能力画像已生成" : `能力互动：已回答 ${count} / ${cache.questions.length} 题`}</span><progress value="${count}" max="${cache.questions.length}" aria-label="能力互动完成进度"></progress></div><button class="btn btn-primary" ${done ? 'data-to="portrait"' : count ? 'data-resume-assess' : 'data-to="detail"'}>${done ? "查看我的画像" : "继续这条路径"}${Icon("arrow")}</button></article><div class="actions"><button class="text-button" data-to="explore">探索其他职业 ${Icon("arrow")}</button></div></section>`;
}
function renderMine() {
  const s = getState(), major = s.majorId === "all" ? "跨专业探索" : cache.majors.find(m=>m.id === s.majorId)?.name ?? "尚未选择";
  return `<section class="stage-enter">${heading("MY EXPLORATION","我的探索记录","保留你的起点、方向，以及每一次对自己的新认识。") }<div class="mine-layout"><dl class="card mine-list"><div><dt>${Icon("book")} 专业起点</dt><dd>${major}</dd></div><div><dt>${Icon("compass")} 目标职业</dt><dd>${cache.career?.name ?? "尚未选择"}</dd></div><div><dt>${Icon("chart")} 能力互动</dt><dd>${cache.career ? `${answeredCount()} / ${cache.questions.length} 题${completed() ? " · 已完成" : ""}` : "尚未开始"}</dd></div></dl><aside class="card local-note">${SpatialArt("compass","record-art")}<h2>属于这一次探索</h2><p>当前版本不设登录、社区和等级。你的探索进度保存在当前浏览器中。</p><p>${canSaveProgress() ? "更换浏览器或清除网站数据后，记录不会同步保留。" : "当前浏览器无法保存进度，关闭页面后本次记录可能丢失。"}</p></aside></div><div class="reset-row"><div><h2>想从头再出发？</h2><p>重新开始会清除当前专业、目标职业和回答。</p></div><button class="btn btn-ghost" data-reset>重新开始探索</button></div></section>`;
}
function view() {
  const s = getState();
  if (s.tab === "direction") return renderDirection();
  if (s.tab === "mine") return renderMine();
  return ({home:renderHome,choose:renderChoose,majors:renderChoose,focus:renderFocus,explore:renderExplore,detail:renderDetail,market:renderMarket,assess:renderAssess,portrait:renderPortrait,structure:renderStructure,distance:renderDistance,advice:renderAdvice,gap:renderGap}[s.stage] || renderHome)();
}
function paint(focus) {
  const s = getState(), title = s.tab === "explore" ? stageTitles[s.stage] : s.tab === "direction" ? "我的方向" : "我的";
  const screen = `${s.tab}:${s.stage}:${s.careerId}:${s.directionId}:${s.stage === "assess" ? s.questionIndex : s.stage === "detail" ? s.detailPart : ""}`;
  const changed = previousScreen !== screen;
  app.classList?.toggle("same-screen",!changed);
  document.title = `${title} · 去向 — 大学生职业导航`;
  app.setAttribute?.('data-stage',s.tab==='explore'?s.stage:s.tab);
  const immersive=s.tab==='explore' && ['home','choose'].includes(s.stage);
  const callbacks={onNavigate:navigate,onCategory:id=>setState({categoryId:id}),onExplore:selectMajor};
  if(immersive && app.querySelector?.('#immersive-experience')){
    initImmersive(app,s,callbacks);router.sync();previousScreen=screen;return;
  }
  if(!immersive)disposeImmersive();
  // Selecting an answer must not rebuild the shell or move the viewport.
  const questionWrap=app.querySelector?.('.question-wrap');
  if(!changed && s.tab==='explore' && s.stage==='assess' && questionWrap){
    questionWrap.outerHTML=QuestionCard({question:cache.questions[s.questionIndex],index:s.questionIndex,total:cache.questions.length,selected:s.answers[cache.questions[s.questionIndex].id]?.optionIndex,answered:answeredCount()});
    if(focus)app.querySelector?.(`[${focus.attribute}="${focus.value}"]`)?.focus({preventScroll:true});
    router.sync();return;
  }
  const detailsState=[...app.querySelectorAll("details")].map(el=>el.open);
  app.innerHTML = `${JourneyHeader({stage:s.stage,tab:s.tab,saved:canSaveProgress(),hasCareer:!!cache.career,hasMajor:!!s.majorId,complete:completed()})}<div class="workspace"><header class="topbar"><span class="breadcrumb"><span>去向</span><span>/</span>${title}</span><span class="demo-badge"><span class="status-dot"></span> 职业探索 · EDITION 02</span></header><main id="main-content" tabindex="-1">${view()}</main><footer class="page-footer"><span>去向 <span class="footer-divider">/</span> 每一种可能，都值得探索。</span><span>大学生职业导航 · 演示版</span></footer></div>${BottomNav({tab:s.tab})}<dialog id="reset-dialog" aria-labelledby="reset-title" aria-describedby="reset-description"><form method="dialog"><span class="info-icon">${Icon("route")}</span><h2 id="reset-title">重新开始这段探索？</h2><p id="reset-description">当前的专业、目标职业和回答将被清除。</p><div class="actions"><button class="btn btn-ghost" value="cancel" autofocus>保留记录</button><button type="button" class="btn btn-primary" data-confirm-reset>确认重新开始</button></div></form></dialog>`;
  if(!changed) [...app.querySelectorAll("details")].forEach((el,i)=>{el.open=detailsState[i]||false;});
  if (changed && previousScreen && !immersive) {
    document.querySelector(s.stage === "assess" && s.tab === "explore" ? "#question-title" : "h1")?.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:"instant"});
  } else if (focus) {
    for (const el of app.querySelectorAll(`[${focus.attribute}]`)) {
      if (el.getAttribute(focus.attribute) === focus.value) { el.focus({preventScroll:true}); break; }
    }
  }
  initGalaxy(app);
  if(immersive)initImmersive(app,s,callbacks);
  router.sync();
  previousScreen = screen;
}
function navigate(stage) {
  setState({tab:"explore",stage,selectedSkillId:null,lastFeedback:null});
}
function selectMajor(id) {
  const s=getState();
  if(id!=='all'&&!cache.majors.some(m=>m.id===id))return;
  const categoryId=id==='all'?s.categoryId:id;
  if(id===s.majorId){setState({categoryId,stage:id==='all'?'explore':'focus',tab:'explore',selectedSkillId:null,lastFeedback:null});}
  else setState({categoryId,majorId:id,directionId:null,detailPart:'overview',careerId:null,answers:{},questionIndex:0,stage:id==='all'?'explore':'focus',tab:'explore',selectedSkillId:null});
}
function goExplore() {
  const s = getState();
  navigate(s.majorId ? (s.stage === "home" ? "focus" : s.stage) : "choose");
}
app.addEventListener("click", event => {
  const el = event.target.closest("button, a[data-home]");
  if (!el || el.disabled) return;
  const d = el.dataset, s = getState();
  if ("categoryLiterature" in d) navigate("choose");
  else if ("detailPart" in d) setState({detailPart:d.detailPart});
  else if ("direction" in d) {
    if(!cache.directions.some(x=>x.id===d.direction))return;
    const direction=cache.directions.find(x=>x.id===d.direction);
    const keepCareer=direction.careerIds.includes(s.careerId);
    setState({directionId:d.direction,stage:"explore",tab:"explore",selectedSkillId:null,...(keepCareer?{}:{careerId:null,answers:{},questionIndex:0})});
  }
  else if ("allDirections" in d) setState({directionId:null,stage:"explore",tab:"explore"});
  else if ("majorCareer" in d) {
    const target=cache.allCareers.find(c=>c.id===d.majorCareer);
    if (!target) return;
    const majorId=cache.majorCareers.some(c=>c.id===target.id)?s.majorId:"all";
    if(target.id===s.careerId) navigate("detail");
    else setState({majorId,directionId:null,detailPart:"overview",careerId:target.id,answers:{},questionIndex:0,stage:"detail",tab:"explore",selectedSkillId:null});
  }
  else if ("home" in d) { event.preventDefault(); navigate("home"); }
  else if ("major" in d) selectMajor(d.major);
  else if ("career" in d) {
    if (d.career === s.careerId) navigate("detail");
    else setState({careerId:d.career,detailPart:"overview",answers:{},questionIndex:0,stage:"detail",tab:"explore",selectedSkillId:null});
  }
  else if ("to" in d) navigate(d.to);
  else if ("tab" in d) d.tab === "explore" ? goExplore() : setState({tab:d.tab});
  else if ("tabJump" in d) goExplore();
  else if ("skill" in d) setState({selectedSkillId:s.selectedSkillId === d.skill ? null : d.skill});
  else if ("option" in d) {
    const q = cache.questions[s.questionIndex], optionIndex = Number(d.option), option = q?.options[optionIndex];
    if (option) setState({answers:{...s.answers,[q.id]:{questionId:q.id,skillId:q.skillId,optionIndex,score:option.score}}});
  }
  else if ("nextQuestion" in d) {
    const q = cache.questions[s.questionIndex];
    if (!q || !s.answers[q.id]) return;
    if (s.questionIndex + 1 < cache.questions.length) setState({questionIndex:s.questionIndex+1});
    else if (completed()) navigate("portrait");
    else setState({questionIndex:firstUnanswered()});
  }
  else if ("prevQuestion" in d) setState({questionIndex:Math.max(0,s.questionIndex-1)});
  else if ("resumeAssess" in d) setState({stage:"assess",tab:"explore",questionIndex:completed()?0:firstUnanswered(),selectedSkillId:null});
  else if ("review" in d) setState({stage:"assess",tab:"explore",questionIndex:0,selectedSkillId:null});
  else if ("reset" in d) document.getElementById("reset-dialog").showModal();
  else if ("confirmReset" in d) { document.getElementById("reset-dialog")?.close(); resetJourney(); }
});
async function refresh() {
  const token = ++renderToken;
  const active = document.activeElement;
  const attribute = ["data-skill", "data-option", "data-tab", "data-to", "data-major", "data-career"].find(name => active?.hasAttribute(name));
  const focus = attribute ? {attribute,value:active.getAttribute(attribute)} : null;
  try {
    const {patch,data} = await hydrate(getState());
    if (token !== renderToken) return;
    cache = data;
    const s = getState();
    if (Object.entries(patch).some(([key,value])=>JSON.stringify(s[key]) !== JSON.stringify(value))) { setState(patch); return; }
    paint(focus);
  } catch (error) {
    if (token !== renderToken) return;
    console.error("页面初始化失败",error);
    app.innerHTML = '<main class="boot-state" role="alert"><h1>页面暂时没有加载成功</h1><p>请刷新重试；若仍有问题，可重新开始探索。</p><button class="btn btn-primary" data-confirm-reset>重新开始探索</button></main>';
  }
}
const router=createRouter({getState,setState});
subscribe(refresh);
router.start();
refresh();
