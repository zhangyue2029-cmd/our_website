import { SKILL_CATEGORIES } from "../types.js";
import { Icon } from "./chrome.js";
export function SkillCardList({ profile, openId }) {
  return `<div class="skill-grid">${profile.map((item, i) => {
    const open = openId === item.skillId;
    return `<article class="card skill-card ${open ? "is-open" : ""}"><button class="skill-toggle" type="button" data-skill="${item.skillId}" aria-expanded="${open}" aria-controls="skill-${item.skillId}"><span class="skill-top"><span class="cat">${SKILL_CATEGORIES[item.skill.category]}</span><span class="muted">${String(i+1).padStart(2,"0")}</span></span><span class="skill-title">${item.skill.name}${Icon("chevron")}</span><span class="skill-bottom"><span>市场重要程度</span><span class="dots" aria-label="${item.importance} / 5">${"●".repeat(item.importance)}${"○".repeat(5-item.importance)}</span></span></button>
      <div class="why" id="skill-${item.skillId}" ${open ? "" : "hidden"}><h3>为什么需要这项能力？</h3><p>${item.why}</p>${item.signals.length ? item.signals.map(signal => `<blockquote><span>${signal.companyType} · 岗位要求示例</span><p>“${signal.snippet}”</p></blockquote>`).join("") : '<p class="muted">暂无岗位要求示例。</p>'}<p class="fine-print">演示数据，非实时招聘信息。</p></div></article>`;
  }).join("")}</div>`;
}
export function SkillBars({ portrait, openId }) {
  return `<div class="bars">${portrait.map(p => {
    const open = openId === p.skillId;
    return `<article class="card bar-row is-${p.level}"><button class="bar-toggle" type="button" data-skill="${p.skillId}" aria-expanded="${open}" aria-controls="compare-${p.skillId}"><span class="bar-label"><strong>${p.name}</strong><span><b>${p.userScore}</b><small> / 100</small>${Icon("chevron")}</span></span><span class="track"><span class="fill" style="width:${p.userScore}%"></span><span class="market-marker" style="left:calc(${p.market}% - 2px)"></span></span><span class="bar-meta"><span>${SKILL_CATEGORIES[p.category]}</span><span>差距${p.gapLabel}</span></span></button><div class="compare" id="compare-${p.skillId}" ${open ? "" : "hidden"}><div><span>市场参考值</span><strong>${p.market} / 100</strong></div><div><span>当前自评分</span><strong>${p.userScore} / 100</strong></div><p>${p.why}</p></div></article>`;
  }).join("")}</div>`;
}
export function GapColumns({ have, forming, grow }) {
  const col = (cls, title, items, mark, caption) => `<section class="card gap-col ${cls}"><div class="gap-col-top"><span class="gap-symbol">${mark}</span><span class="count">${items.length} 项能力</span></div><h2>${title}</h2><p>${caption}</p><ul>${items.length ? items.map(p => `<li>${p.name}</li>`).join("") : '<li class="muted">暂无能力归入这一栏</li>'}</ul></section>`;
  return `<div class="gap-grid">${col("have-box","已经具备",have,"✓","保留这份积累，继续实践。")}${col("forming-box","正在形成",forming,"◐","让已有经验变得更扎实。")}${col("grow-box","重点培养",grow,"↗","看见差距，就有了下一步。")}</div>`;
}
export function QuestionCard({ question, index, total, selected, answered }) {
  const valid = Number.isInteger(selected);
  return `<div class="question-wrap"><div class="question-progress"><span>能力互动 <b>${String(index+1).padStart(2,"0")}</b><span class="muted"> / ${String(total).padStart(2,"0")}</span></span><span class="muted">按你的真实经历选择</span></div><progress value="${answered ?? index+(valid?1:0)}" max="${total}" aria-label="已回答题目数"></progress><article class="card question-card"><span class="eyebrow">认识自己 · 一次一件事</span><h2 id="question-title" tabindex="-1">${question.prompt}</h2><div class="options" role="group" aria-labelledby="question-title">${question.options.map((opt,i) => `<button type="button" class="option ${selected === i ? "is-selected" : ""}" data-option="${i}" aria-pressed="${selected === i}"><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${opt.label}</span><span class="option-check">${selected === i ? Icon("check") : ""}</span></button>`).join("")}</div><p class="feedback" role="status">${valid ? question.feedback[selected] : "没有标准答案，选择最贴近你现在的状态。"}</p><div class="question-actions"><button class="btn btn-ghost" data-prev-question ${index === 0 ? "disabled" : ""}>${Icon("back")} 上一题</button><button class="btn btn-primary" data-next-question ${valid ? "" : "disabled"}>${index+1 === total ? "生成能力画像" : "下一题"}${Icon("arrow")}</button></div></article><p class="question-note">你的回答只用于这次能力对照，不是职业适合度判定。</p></div>`;
}

