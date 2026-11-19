import { majorDirections } from "./directions.js";
import { majors } from "./majors.js";
import { careers, careerById } from "./careers.js";
import { skills, skillById } from "./skills.js";
import { requirementsForCareer, signalsForSkill } from "./market.js";
import { questionsForCareer } from "./questions.js";

/**
 * Data access layer. Swap implementations here when a backend exists.
 * Callers should not import mock files directly from views.
 */
export const dataSource = "mock";

export async function getMajors() {
  return majors;
}

export async function getMajor(id) {
  return majors.find((m) => m.id === id) ?? null;
}

export async function getCareersForMajor(majorId) {
  if (majorId === "all") return careers;
  const major = majors.find((m) => m.id === majorId);
  if (!major) return [];
  return major.careerIds.map((id) => careerById[id]).filter(Boolean);
}

export async function getCareer(id) {
  return careerById[id] ?? null;
}

export async function getSkill(id) {
  return skillById[id] ?? null;
}

export async function getSkills() {
  return skills;
}

export async function getMarketProfile(careerId) {
  const reqs = requirementsForCareer(careerId);
  return reqs.map((r) => ({
    ...r,
    skill: skillById[r.skillId],
    signals: signalsForSkill(careerId, r.skillId),
  }));
}

export async function getAssessment(careerId) {
  const profile = await getMarketProfile(careerId);
  const skillIds = profile.map((p) => p.skillId);
  return questionsForCareer(careerId, skillIds);
}

// Direction IDs are scoped to the current major; never fall back to another major.
export async function getMajorDirections(majorId) {
  return majorDirections[majorId] || [];
}
export async function getCareersForDirection(majorId, directionId) {
  const candidates = await getCareersForMajor(majorId);
  if (!directionId) return candidates;
  const direction = (await getMajorDirections(majorId)).find(d=>d.id === directionId);
  if (!direction) return [];
  return candidates.filter(c=>direction.careerIds.includes(c.id));
}
