import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { createAnalysisHandler } from '../server/background-analysis.mjs';
import { recruitmentReference } from '../src/data/recruitment-reference.js';

const draft = { entries: { courses: [{ name: '新闻写作', details: '撰写校刊采访稿' }] } };
const request = overrides => ({ requestId: randomUUID(), careerId: 'journalist', draft, ...overrides });

async function runServer(provider, verify) {
  const server = createServer(createAnalysisHandler(provider)).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const url = 'http://127.0.0.1:' + server.address().port;
    await verify((input, headers) => fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(input),
    }));
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

function sampleReport(input) {
  const requirementId = input.requirements[0].id;
  return {
    summary: '已有写作经历，可练习更完整的核查流程。',
    transfer: [{ entryId: 'courses:1', requirementId, text: '解释如何将采访稿的经验应用于具体任务。' }],
    gaps: [{ requirementId, text: '补充可复核的素材和过程记录。' }],
    actions: [{ requirementId, text: '制作一份来源核查清单。' }],
  };
}

test('validates input, handles duplicate requests and returns the approved reference', async () => {
  let calls = 0;
  await runServer(input => {
    calls++;
    assert.equal(input.referenceVersion, 'journalism-general-v1');
    assert.equal(input.requirements.length, 4);
    assert.ok(input.requirements.every(item => item.id.startsWith('journalist:')));
    assert.deepEqual(input.entries, [{ id: 'courses:1', name: '新闻写作', details: '撰写校刊采访稿' }]);
    return sampleReport(input);
  }, async post => {
    assert.equal((await post(request({ draft: {} }))).status, 400);
    assert.equal((await post(request({ careerId: 'publisher' }))).status, 400);
    assert.equal((await post(request({ careerId: '__proto__' }))).status, 400);
    assert.equal((await post(request(), { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
    assert.equal((await post(request({ extra: 'x'.repeat(270_000) }))).status, 413);
    const body = request();
    const responses = await Promise.all([post(body), post(body)]);
    assert.equal(calls, 1);
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const result = await response.json();
      assert.equal(result.referenceVersion, 'journalism-general-v1');
      assert.equal(result.transfer[0].entry, '新闻写作');
      assert.ok(result.transfer[0].requirement);
      assert.ok(!Object.hasOwn(result, 'score'));
    }
    assert.equal((await post({ ...body, draft: { narrative: '另一个背景' } })).status, 409);
    assert.equal((await post(body)).status, 200);
    assert.equal(calls, 1);
  });
});

test('refuses invented references, unsupported scores and analysis errors; retries same request', async () => {
  let attempts = 0;
  await runServer(input => {
    const result = sampleReport(input);
    attempts += 1;
    if (attempts === 1) result.transfer[0].requirementId = 'editor:invented';
    if (attempts === 2) result.summary = '覆盖率 99%';
    if (attempts === 3) throw Error('unavailable');
    return result;
  }, async post => {
    const body = request();
    for (let i = 1; i <= 3; i++) {
      const response = await post(body);
      assert.equal(response.status, 502);
      assert.deepEqual(Object.keys(await response.json()), ['error']);
    }
    assert.equal((await post(body)).status, 200);
    assert.equal(attempts, 4);
  });
});

test('default rules cover all published careers, preserve uncertainty and avoid cross-career references', async () => {
  await runServer(undefined, async post => {
    for (const [careerId, requirements] of Object.entries(recruitmentReference.careers)) {
      const response = await post(request({ careerId, draft: { narrative: '参加了大学社团。' } }));
      assert.equal(response.status, 200, careerId);
      const result = await response.json();
      assert.equal(result.rulesVersion, 'journalism-rules-v1');
      assert.equal(result.transfer.length, 0);
      assert.deepEqual(result.gaps.map(item => item.requirementId), requirements.map(item => item.id));
      assert.ok(result.actions.every(item => item.requirementId.startsWith(careerId + ':')));
      assert.ok(result.actions.length > 0);
    }
    const positive = await (await post(request())).json();
    assert.equal(positive.transfer[0].requirementId, 'journalist:reporting');
    assert.match(positive.transfer[0].text, /采访稿|新闻写作/);
    const negated = await (await post(request({ draft: { entries: {
      courses: [{ name: '视频剪辑', details: '我不会视频剪辑。' }],
    }, narrative: '计划做人物采访。尚未接触事实核查。' } }))).json();
    assert.deepEqual(negated.transfer, []);
    assert.equal(negated.gaps.length, 4);

    const planning = await (await post(request({ careerId: 'new-media', draft: { narrative: '负责制定账号发布计划。' } }))).json();
    assert.equal(planning.transfer[0].requirementId, 'new-media:account-planning');

    const all = await (await post(request({ draft: { narrative: '校园采访。事实核查。视频剪辑。采访对接。' } }))).json();
    assert.equal(all.transfer.length, 4);
    assert.deepEqual(all.gaps, []);
    assert.ok(all.actions.length > 0);

    const boundary = await (await post(request({
      careerId: 'user-ops', draft: { narrative: '使用nosql数据库。' },
    }))).json();
    assert.deepEqual(boundary.transfer, []);
  });
});
