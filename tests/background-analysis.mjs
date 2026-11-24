import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { createAnalysisHandler, createOpenAIProvider } from '../server/background-analysis.mjs';

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

test('refuses invented references, unsupported scores and provider errors; retries same request', async () => {
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
  await runServer(null, async post => {
    assert.equal((await post(request())).status, 503);
  });
});

test('OpenAI adapter sends a structured request with storage disabled', async () => {
  const provider = createOpenAIProvider({
    apiKey: 'test-only', model: 'test-model',
    fetcher: async (url, options) => {
      assert.equal(url, 'https://api.openai.com/v1/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer test-only');
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.equal(body.model, 'test-model');
      assert.equal(body.response_format.type, 'json_object');
      assert.equal(body.messages[1].content, '{"entries":[]}');
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"fixture"}' } }] }));
    },
  });
  assert.deepEqual(await provider({ entries: [] }), { summary: 'fixture' });
});
