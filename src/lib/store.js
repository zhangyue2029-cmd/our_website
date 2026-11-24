import { normalizeDetailPart } from "./router.js";

const KEY = "quxiang-journey-v1";
const fresh = () => ({ historyGeneration:0, categoryId:"chinese", stage: "home", tab: "explore", majorId: null, directionId: null, detailPart: "overview", careerId: null,
  answers: {}, questionIndex: 0, selectedSkillId: null, focusingCareerId: null, lastFeedback: null });
const stages = ["home", "choose", "majors", "focus", "explore", "detail", "market", "background", "assess", "portrait", "structure", "distance", "advice", "gap"];
let storageAvailable = true;

function load() {
  let raw;
  try { raw = localStorage.getItem(KEY); }
  catch { storageAvailable = false; return fresh(); }
  try {
    const parsed = JSON.parse(raw || "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fresh();
    const answers = {};
    if (parsed.answers && typeof parsed.answers === "object") {
      for (const [id, a] of Object.entries(parsed.answers)) {
        if (a && typeof a.skillId === "string" && Number.isInteger(a.optionIndex) && a.optionIndex >= 0 && a.optionIndex < 4) answers[id] = a;
      }
    }
    return { ...fresh(), historyGeneration:Number.isInteger(parsed.historyGeneration) && parsed.historyGeneration>=0 ? parsed.historyGeneration : 0, stage: stages.includes(parsed.stage) ? parsed.stage : "home",
      tab: ["explore", "direction", "mine"].includes(parsed.tab) ? parsed.tab : "explore",
      categoryId: typeof parsed.categoryId === "string" ? parsed.categoryId : "chinese",
      majorId: typeof parsed.majorId === "string" ? parsed.majorId : null,
      detailPart: normalizeDetailPart(parsed.detailPart),
      directionId: typeof parsed.directionId === "string" ? parsed.directionId : null,
      careerId: typeof parsed.careerId === "string" ? parsed.careerId : null,
      questionIndex: Number.isInteger(parsed.questionIndex) ? Math.max(0, parsed.questionIndex) : 0,
      answers };
  } catch { return fresh(); }
}
let state = load();
const listeners = new Set();
function persist() {
  try {
    const { focusingCareerId, lastFeedback, ...rest } = state;
    localStorage.setItem(KEY, JSON.stringify(rest));
    storageAvailable = true;
  } catch { storageAvailable = false; }
}
export function getState() { return state; }
export function canSaveProgress() { return storageAvailable; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setState(patch) {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((fn) => fn(state));
}
export function resetJourney() {
  const generation = state.historyGeneration;
  state = {...fresh(),historyGeneration:generation+1};
  persist();
  listeners.forEach((fn) => fn(state));
}
export function answersBySkill() {
  const map = {};
  for (const answer of Object.values(state.answers)) map[answer.skillId] = Math.max(map[answer.skillId] ?? 0, answer.score);
  return map;
}

