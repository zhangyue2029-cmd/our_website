import assert from 'node:assert/strict';
import {
  backgroundCategories, backgroundLimits, hasBackgroundEvidence, normalizeBackground,
  readBackgroundDraft, writeBackgroundDraft,
} from '../src/lib/background-draft.js';
import { parseRoute, routeFor } from '../src/lib/router.js';

const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key),
};

const draft = normalizeBackground({
  entries: {
    courses: [{ name: '新闻写作', details: '完成一篇人物稿' }],
    projects: [{ name: '', details: '' }],
    unrelated: [{ name: 'ignored' }],
  },
  narrative: '<草稿>',
});
assert.deepEqual(Object.keys(draft.entries), backgroundCategories.map(([id]) => id));
assert.ok(hasBackgroundEvidence(draft));
assert.ok(hasBackgroundEvidence(normalizeBackground({ narrative: '为校刊写人物特稿' })));
assert.ok(!hasBackgroundEvidence(normalizeBackground({
  narrative: '  ', entries: { courses: [{ name: ' ', details: '缺少名称' }] },
})));

const oversized = normalizeBackground({
  narrative: '字'.repeat(2000),
  entries: { courses: Array.from({ length: 20 }, () => ({ name: '字'.repeat(200) })) },
});
assert.equal(oversized.narrative.length, backgroundLimits.narrative);
assert.equal(oversized.entries.courses.length, backgroundLimits.entries);
assert.equal(oversized.entries.courses[0].name.length, backgroundLimits.name);
assert.equal(writeBackgroundDraft('journalist', draft), true);
assert.deepEqual(readBackgroundDraft('journalist'), { draft, available: true });
assert.deepEqual(readBackgroundDraft('editor').draft, normalizeBackground());
assert.equal(writeBackgroundDraft('journalist', normalizeBackground()), true);
assert.equal(memory.size, 0);
memory.set('quxiang-background-v1:journalist', '{bad JSON');
assert.deepEqual(readBackgroundDraft('journalist').draft, normalizeBackground());
localStorage.setItem = localStorage.getItem = () => { throw Error('Blocked'); };
assert.equal(readBackgroundDraft('journalist').available, false);
assert.equal(writeBackgroundDraft('journalist', draft), false);

const path = '#/background?category=journalism&major=journalism&career=journalist&part=recruitment';
assert.equal(routeFor(parseRoute(path)), path);
assert.ok(!routeFor(parseRoute(path)).includes(draft.entries.courses[0].name));
console.log('PASS: background validation, bounded input, per-career persistence, corrupt data recovery, storage failure and URL isolation.');
