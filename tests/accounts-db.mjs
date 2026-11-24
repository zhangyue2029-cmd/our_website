import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import pg from 'pg';
import { createAccountHandler } from '../server/accounts.mjs';
import { createAnalysisHandler } from '../server/background-analysis.mjs';
import { createMessageHandler } from '../server/messages.mjs';
import { createCommunityModeration } from '../server/community-moderation.mjs';
import { createCommunityInteractions } from '../server/community-interactions.mjs';
import { createCommunityHandler } from '../server/community.mjs';
import { parseRoute, routeFor } from '../src/lib/router.js';

test('real database isolates sessions and drafts by owner', async () => {
  const db = new pg.Pool({ connectionString: process.env.QX_DATABASE_URL });
  const handle = createAccountHandler(db);
  const community = createCommunityHandler(db);
  const interactions = createCommunityInteractions(db);
  const moderation = createCommunityModeration(db);
  const messages = createMessageHandler(db);
  let resolveSlow;
  let slowStarted;
  const waiting = new Promise(resolve => { slowStarted = resolve; });
  let providerCalls = 0;
  const analysis = createAnalysisHandler(async input => {
    providerCalls++;
    const summary = input.entries[0].details;
    if (summary === '失败分析') throw Error('unavailable');
    if (summary === '较早分析') {
      await new Promise(resolve => { resolveSlow = resolve; slowStarted(); });
    }
    const requirementId = input.requirements[0].id;
    return { summary, transfer: [], gaps: [{ requirementId, text: '复核素材。' }],
      actions: [{ requirementId, text: '制作核查清单。' }] };
  }, { db });
  const server = createServer((req, res) => {
    if (req.url === '/api/background-analysis') return analysis(req, res);
    const conversation = req.url.match(/^\/api\/account\/conversations(?:\/([^/]+))?$/);
    if (conversation) return messages(req, res, conversation[1] ?? null);
    if (req.url === '/api/community/moderation') return moderation(req, res);
    if (req.url.endsWith('/interactions')) return interactions(req, res, req.url.split('/')[4]);
    if (req.url.startsWith('/api/community/')) return community(req, res);
    return handle(req, res, req.url);
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    async function request(route, body, cookie, extraHeaders = {}) {
      const headers = { ...extraHeaders };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (cookie) headers.Cookie = cookie;
      return fetch('http://127.0.0.1:' + server.address().port + '/api/' + (route.startsWith('community/') || route === 'background-analysis' ? route : 'account/' + route),
        { method: body === undefined ? 'GET' : 'POST', headers, body: JSON.stringify(body) });
    }
    assert.equal((await request('background')).status, 401);
    assert.deepEqual(await (await request('session')).json(), { profile: null });
    const password = 'local-test-password';
    const member = { username: 'student_one', displayName: '测试学生', communityRole: 'student', password };
    assert.equal((await request('register', { ...member, communityRole: 'admin' })).status, 400);
    const register = await request('register', member);
    assert.equal(register.status, 201);
    const setCookie = register.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly; Secure; SameSite=Lax/);
    const firstCookie = setCookie.split(';')[0];
    assert.equal((await request('register', member)).status, 409);
    assert.equal((await request('login', { username: member.username, password: 'wrong' })).status, 401);
    const profile = await (await request('session', undefined, firstCookie)).json();
    assert.deepEqual(profile.profile, { username: member.username, displayName: member.displayName, communityRole: 'student' });
    const other = await request('register', { ...member, username: 'other_user', communityRole: 'employed' });
    assert.equal(other.status, 201);
    const secondCookie = other.headers.get('set-cookie').split(';')[0];

    const draft = { careerId: 'journalist', draft: { narrative: '私人校刊采访背景' } };
    assert.equal((await request('background', draft, firstCookie, { Origin: 'https://outside.example' })).status, 403);
    assert.equal((await request('background', draft, firstCookie)).status, 200);
    assert.equal((await request('background', { ...draft, careerId: '__proto__' }, firstCookie)).status, 400);
    assert.deepEqual(await (await request('background', undefined, secondCookie)).json(), { drafts: [] });
    assert.equal((await request('background', { careerId: 'journalist', action: 'remove' }, secondCookie)).status, 200);
    const firstDrafts = await (await request('background', undefined, firstCookie)).json();
    assert.equal(firstDrafts.drafts[0].draft.narrative, draft.draft.narrative);

    const post = { careerId: 'journalist', kind: 'question', title: '采访问题', body: '<b>提问</b>', anonymous: true };
    assert.equal((await request('community/posts', post)).status, 401);
    assert.equal((await request('community/posts', { ...post, kind: 'experience' }, firstCookie)).status, 403);
    assert.equal((await request('community/posts', post, secondCookie)).status, 403);
    const posted = await request('community/posts', post, firstCookie);
    assert.equal(posted.status, 201);
    const { id } = await posted.json();
    assert.equal((await request('community/posts', { ...post, kind: 'experience', anonymous: false, careerId: 'editor' }, secondCookie)).status, 201);
    const published = await (await request('community/posts?career=journalist&kind=question&q=' + encodeURIComponent('采访'))).json();
    assert.equal(published.posts.length, 1);
    assert.equal(published.posts[0].author_name, null);
    assert.equal(published.posts[0].body, '<b>提问</b>');
    assert.ok(!JSON.stringify(published).includes(member.username));
    assert.ok(!Object.hasOwn(published.posts[0], 'member_id'));
    const visible = await (await request('community/posts?career=editor&kind=experience')).json();
    assert.equal(visible.posts[0].author_name, member.displayName);
    const interact = 'community/posts/' + id + '/interactions';
    assert.equal((await request(interact, { action: 'comment', body: '访客留言' })).status, 401);
    assert.equal((await request(interact, { action: 'comment', body: '匿名作者补充' }, firstCookie)).status, 201);
    const parent = (await (await request(interact)).json()).comments[0];
    assert.equal(parent.author_name, null);
    assert.ok(!Object.hasOwn(parent, 'member_id'));
    assert.equal((await request(interact, { action: 'comment', body: '回复', parentId: parent.id }, secondCookie)).status, 201);
    const otherPost = visible.posts[0].id;
    assert.equal((await request('community/posts/' + otherPost + '/interactions',
      { action: 'comment', body: '跨帖回复', parentId: parent.id }, secondCookie)).status, 404);
    await Promise.all([1, 2].map(() => request(interact, { action: 'like', enabled: true }, secondCookie)));
    assert.equal((await request(interact, { action: 'bookmark', enabled: true }, secondCookie)).status, 200);
    const publicInteraction = await (await request(interact)).json();
    assert.equal(publicInteraction.likes, 1);
    assert.equal(publicInteraction.bookmarked, false);
    assert.ok(publicInteraction.comments.some(comment => comment.parent_id === parent.id));
    const secondInteraction = await (await request(interact, undefined, secondCookie)).json();
    assert.equal(secondInteraction.liked, true);
    assert.equal(secondInteraction.bookmarked, true);
    assert.equal((await request(interact, { action: 'like', enabled: false }, secondCookie)).status, 200);
    assert.equal((await (await request(interact)).json()).likes, 0);
    await Promise.all([1, 2].map(() => request(interact, { action: 'report', reason: '待审核' }, secondCookie)));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM community.post_report')).rows[0].n, 1);
    assert.deepEqual((await (await request('bookmarks', undefined, firstCookie)).json()).posts, []);
    assert.equal((await (await request('bookmarks', undefined, secondCookie)).json()).posts[0].id, id);
    assert.equal((await request('bookmarks', { postId: id }, firstCookie)).status, 200);
    assert.equal((await (await request('bookmarks', undefined, secondCookie)).json()).posts.length, 1);
    assert.equal((await request('bookmarks', { postId: id }, secondCookie)).status, 200);
    assert.deepEqual((await (await request('bookmarks', undefined, secondCookie)).json()).posts, []);

    const review = { postId: id, status: 'hidden', reason: '下架测试' };
    assert.equal((await request('community/moderation', undefined, secondCookie)).status, 403);
    assert.equal((await request('community/moderation', review, secondCookie)).status, 403);
    await db.query("INSERT INTO community.moderator SELECT id FROM accounts.member WHERE username = $1", [member.username]);
    const queue = await (await request('community/moderation', undefined, firstCookie)).json();
    assert.equal(queue.reports[0].reason, '待审核');
    assert.equal(queue.reports[0].reviewed_at, null);
    assert.equal((await request('community/moderation', review, firstCookie)).status, 200);
    assert.deepEqual((await (await request('community/posts?career=journalist')).json()).posts, []);
    assert.equal((await request(interact)).status, 404);
    assert.equal((await request('community/moderation', { ...review, status: 'visible', reason: '恢复测试' }, firstCookie)).status, 200);
    assert.equal((await request(interact)).status, 200);
    assert.deepEqual((await db.query('SELECT decision FROM community.moderation_action ORDER BY id')).rows,
      [{ decision: 'hidden' }, { decision: 'visible' }]);


    assert.equal((await request('conversations', { postId: id }, secondCookie)).status, 409);
    assert.equal((await request('conversations', { postId: otherPost }, secondCookie)).status, 409);
    assert.equal((await request('conversations', { postId: otherPost }, firstCookie)).status, 201);
    assert.equal((await request('conversations', { postId: otherPost }, firstCookie)).status, 409);
    const firstInbox = await (await request('conversations', undefined, firstCookie)).json();
    const recipientInbox = await (await request('conversations', undefined, secondCookie)).json();
    const chat = 'conversations/' + firstInbox.conversations[0].id;
    assert.equal(firstInbox.conversations[0].incoming, false);
    assert.equal(recipientInbox.conversations[0].incoming, true);
    assert.equal((await request(chat, { action: 'send', body: '请接受后再聊' }, firstCookie)).status, 403);
    assert.equal((await request(chat, { action: 'accept' }, firstCookie)).status, 403);
    assert.equal((await request(chat, { action: 'accept' }, secondCookie)).status, 200);
    assert.equal((await request(chat, { action: 'send', body: '私人对话' }, firstCookie)).status, 201);
    const received = (await (await request(chat, undefined, secondCookie)).json()).messages[0];
    assert.equal(received.body, '私人对话');
    assert.equal(received.mine, false);
    assert.equal((await request(chat, { action: 'report', messageId: received.id, reason: '需要复核' }, secondCookie)).status, 200);
    const outsider = await request('register', { ...member, username: 'outsider_one' });
    const outsiderCookie = outsider.headers.get('set-cookie').split(';')[0];
    assert.equal((await request(chat, undefined, outsiderCookie)).status, 404);
    assert.equal((await request(chat, { action: 'block' }, outsiderCookie)).status, 404);
    assert.equal((await request(chat, { action: 'block' }, secondCookie)).status, 200);
    assert.equal((await request(chat, { action: 'send', body: '已屏蔽' }, firstCookie)).status, 403);
    assert.equal((await request('conversations', { postId: otherPost }, outsiderCookie)).status, 201);
    const outsiderInbox = await (await request('conversations', undefined, outsiderCookie)).json();
    const secondChat = 'conversations/' + outsiderInbox.conversations[0].id;
    assert.equal((await request(secondChat, { action: 'decline' }, secondCookie)).status, 200);
    assert.equal((await request(secondChat, { action: 'send', body: '已拒绝' }, outsiderCookie)).status, 403);

    const analyze = (narrative, saveReport, cookie) => request('background-analysis', {
      requestId: randomUUID(), careerId: 'journalist', draft: { narrative }, saveReport,
    }, cookie);
    assert.equal((await analyze('缺少会话', true)).status, 401);
    assert.equal(providerCalls, 0);
    assert.equal((await analyze('只看临时报告', false, firstCookie)).status, 200);
    assert.deepEqual((await (await request('reports', undefined, firstCookie)).json()).reports, []);
    const slow = analyze('较早分析', true, firstCookie);
    await waiting;
    assert.equal((await analyze('较新分析', true, firstCookie)).status, 200);
    resolveSlow();
    assert.equal((await slow).status, 200);
    assert.equal((await analyze('失败分析', true, firstCookie)).status, 502);
    const { reports } = await (await request('reports', undefined, firstCookie)).json();
    assert.equal(reports.length, 1);
    assert.equal(reports[0].report.summary, '较新分析');
    assert.deepEqual((await (await request('reports', undefined, secondCookie)).json()).reports, []);
    assert.equal((await request('reports')).status, 401);

    const login = await request('login', { username: member.username, password }, firstCookie);
    assert.equal(login.status, 200);
    const replacement = login.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('background', undefined, firstCookie)).status, 401);
    assert.equal((await request('background', { careerId: 'journalist', action: 'remove' }, replacement)).status, 200);
    assert.deepEqual(await (await request('background', undefined, replacement)).json(), { drafts: [] });
    assert.equal((await request('logout', {}, replacement)).status, 200);
    assert.equal((await request('background', undefined, replacement)).status, 401);
    assert.equal((await db.query("SELECT count(*)::int AS count FROM accounts.member WHERE password_hash IS NOT NULL")).rows[0].count, 3);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await db.end();
  }
});

test('background return context survives an account page reload', () => {
  const hash = '#/mine?category=journalism&major=journalism&career=journalist&return=background&part=recruitment';
  assert.equal(parseRoute(hash).stage, 'background');
  assert.equal(routeFor(parseRoute(hash)), hash);
});
