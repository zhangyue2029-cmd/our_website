/**
 * Market requirement (importance 1-5) vs user score (0-100).
 * Buckets describe gap, never "fit / unfit".
 */
export function marketScore(importance) {
  return Math.round((importance / 5) * 100);
}

export function gapLevel(userScore, importance) {
  const market = marketScore(importance);
  const ratio = userScore / Math.max(market, 1);
  if (ratio >= 0.78) return "have";
  if (ratio >= 0.48) return "forming";
  return "grow";
}

export function gapLabel(level) {
  if (level === "have") return "较小";
  if (level === "forming") return "正在缩小";
  return "较大";
}

export function buildPortrait(profile, answersBySkill) {
  return profile
    .map((item) => {
      const userScore = answersBySkill[item.skillId] ?? 0;
      const level = gapLevel(userScore, item.importance);
      return {
        skillId: item.skillId,
        name: item.skill.name,
        category: item.skill.category,
        importance: item.importance,
        market: marketScore(item.importance),
        userScore,
        level,
        gapLabel: gapLabel(level),
        why: item.why,
      };
    })
    .sort((a, b) => b.importance - a.importance || b.userScore - a.userScore);
}

export function summarizeGap(portrait, careerName) {
  const have = portrait.filter((p) => p.level === "have");
  const forming = portrait.filter((p) => p.level === "forming");
  const grow = portrait.filter((p) => p.level === "grow");
  const focus = grow.slice(0, 3).map((p) => p.name);
  const formingNames = forming.slice(0, 2).map((p) => p.name);

  const lines = [];
  if (have.length) {
    lines.push("你已经具备进入这个方向的部分基础。");
  } else {
    lines.push("你可以从现有兴趣和一次具体实践开始，不必一次补齐所有能力。");
  }

  if (focus.length) {
    const extra = formingNames.length ? `同时，${formingNames.join("、")}也正在形成。` : "";
    lines.push(`当前主要差距集中在${focus.join("、")}。${extra}`);
  } else if (forming.length) {
    lines.push(`你和「${careerName}」之间的距离，更多是把正在形成的能力做扎实。`);
  } else {
    lines.push(`以你目前的积累，已经比较接近「${careerName}」方向的入门要求。`);
  }

  lines.push("差距可以被培养，它不是适不适合的结论。");
  return { have, forming, grow, lines };
}
