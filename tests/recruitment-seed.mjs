import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getCareersForMajor } from '../src/data/api.js';

async function readSeed(filename) {
  const file = new URL('../data/recruitment/' + filename, import.meta.url);
  return JSON.parse(await readFile(file, 'utf8'));
}

const seed = await readSeed('journalism-general-v1.json');
const { sources } = await readSeed('journalism-sources-v1.json');
const careerIds = (await getCareersForMajor('journalism')).map(career => career.id);

assert.equal(seed.status, 'pending_review');
assert.deepEqual(Object.keys(seed).sort(), ['requirements', 'status', 'version']);
assert.deepEqual([...new Set(seed.requirements.map(item => item.careerId))].sort(), careerIds.sort());
assert.equal(new Set(seed.requirements.map(item => item.id)).size, seed.requirements.length);

for (const [id, source] of Object.entries(sources)) {
  if (id.startsWith('xlsx:')) {
    assert.equal(id, 'xlsx:' + source.row);
    assert.ok(careerIds.includes(source.careerId));
    assert.match(source.origin, /^(official_link|historical_official|secondary_unverified)$/);
    assert.match(source.recruitmentType, /^(campus|internship|experienced|historical)$/);
    assert.equal(new URL(source.url).protocol, 'https:');
    if (source.listedDate !== null) assert.match(source.listedDate, /^\d{4}-\d{2}-\d{2}$/);
  } else {
    assert.match(id, /^docx:\d+$/);
    assert.equal(source.origin, 'unlinked_attachment');
    assert.equal(source.url, undefined);
    assert.ok(source.careerIds.every(careerId => careerIds.includes(careerId)));
  }
}

for (const requirement of seed.requirements) {
  const { id, careerId, category, summary, sourceIds } = requirement;
  assert.deepEqual(Object.keys(requirement).sort(), ['careerId', 'category', 'id', 'sourceIds', 'summary']);
  assert.ok(id.startsWith(careerId + ':'));
  assert.match(category, /^(task|skill|portfolio)$/);
  assert.ok(summary.trim());
  assert.doesNotMatch(summary, /汽车|家具|茶饮|咖啡|教育行业|智能云|百度|腾讯|人民日报|千川|专八|\d+\s*年以上/);
  if (category === 'portfolio') assert.match(summary, /^可准备/);
  assert.ok(sourceIds.length);
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  for (const sourceId of sourceIds) {
    const source = sources[sourceId];
    assert.ok(source, sourceId);
    assert.ok(source.careerId === careerId || source.careerIds?.includes(careerId), id);
    assert.ok(!source.adjacentRole, id);
    assert.notEqual(source.origin, 'secondary_unverified', id);
    assert.notEqual(source.origin, 'historical_official', id);
  }
}

const response = await getCareersForMajor('chinese');
assert.equal(response.length, 10);
console.log(`PASS: ${seed.requirements.length} candidate requirements for ${careerIds.length} careers and ${Object.keys(sources).length} traceable source records; no changes to the Chinese literature catalog.`);
