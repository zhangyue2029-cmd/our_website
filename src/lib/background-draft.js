export const backgroundCategories = [
  ["courses", "大学课程"],
  ["projects", "比赛与项目"],
  ["experience", "实习与社会实践"],
  ["portfolio", "作品与作品集"],
  ["skills", "技能与工具"],
];

export const backgroundLimits = { entries: 10, name: 120, details: 600, narrative: 1200 };
const draftKey = careerId => `quxiang-background-v1:${careerId}`;
const text = (value, limit) => typeof value === "string" ? value.slice(0, limit) : "";

export function normalizeBackground(value) {
  const entries = Object.fromEntries(backgroundCategories.map(([id]) => {
    const rows = value?.entries?.[id];
    return [id, Array.isArray(rows) ? rows.slice(0, backgroundLimits.entries).map(row => ({
      name: text(row?.name, backgroundLimits.name),
      details: text(row?.details, backgroundLimits.details),
    })).filter(row => row.name || row.details) : []];
  }));
  return { entries, narrative: text(value?.narrative, backgroundLimits.narrative) };
}

export function hasBackgroundEvidence(draft) {
  return Boolean(draft.narrative.trim() || Object.values(draft.entries)
    .some(rows => rows.some(row => row.name.trim())));
}

export function readBackgroundDraft(careerId) {
  let stored;
  try {
    stored = localStorage.getItem(draftKey(careerId));
  } catch {
    return { draft: normalizeBackground(), available: false };
  }

  try {
    return { draft: normalizeBackground(JSON.parse(stored)), available: true };
  } catch {
    return { draft: normalizeBackground(), available: true };
  }
}

export function writeBackgroundDraft(careerId, draft) {
  try {
    const safe = normalizeBackground(draft);
    if (safe.narrative || Object.values(safe.entries).some(rows => rows.length)) {
      localStorage.setItem(draftKey(careerId), JSON.stringify(safe));
    } else {
      localStorage.removeItem(draftKey(careerId));
    }
    return true;
  } catch {
    return false;
  }
}
