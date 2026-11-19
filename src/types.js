/**
 * Domain shapes for the V1 career-navigation product.
 * Mock data follows these contracts so a future API can replace `src/data/api.js`.
 *
 * Major
 *   { id, name, intro, careerIds[] }
 *
 * Career
 *   { id, name, tagline, relatedMajorIds[], connections[],
 *     work[], scenes[], marketIntro, map: {x, y} }
 *
 * Skill
 *   { id, name, category: 'core'|'tool'|'general'|'bonus' }
 *
 * CareerSkillRequirement  (market profile, mockable / replaceable)
 *   { careerId, skillId, importance: 1-5, why, jobSignals[] }
 *
 * Question
 *   { id, careerId, skillId, prompt, options[{label, score 0-100}], feedback[] }
 *
 * UserAnswer
 *   { questionId, optionIndex, score }
 */

export const SKILL_CATEGORIES = {
  core: "核心能力",
  tool: "工具能力",
  general: "通用能力",
  bonus: "加分能力",
};
