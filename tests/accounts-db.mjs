import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import pg from 'pg';
import { createAccountHandler } from '../server/accounts.mjs';
import { createCommunityHandler } from '../server/community.mjs';
import { parseRoute, routeFor } from '../src/lib/router.js';

test('real database isolates sessions and drafts by owner', async () => {
  const db = new pg.Pool({ connectionString: process.env.QX_DATABASE_URL });
  const handle = createAccountHandler(db);
  const community = createCommunityHandler(db);
  const server = createServer((req, res) => req.url.startsWith('/api/community/')
    ? community(req, res) : handle(req, res, req.url)).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    async function request(route, body, cookie, extraHeaders = {}) {
      const headers = { ...extraHeaders };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (cookie) headers.Cookie = cookie;
      return fetch('http://127.0.0.1:' + server.address().port + '/api/' + (route.startsWith('community/') ? route : 'account/' + route),
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
    await db.query("UPDATE community.post SET status = 'hidden' WHERE id = $1", [id]);
    assert.deepEqual((await (await request('community/posts?career=journalist')).json()).posts, []);

    const login = await request('login', { username: member.username, password }, firstCookie);
    assert.equal(login.status, 200);
    const replacement = login.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('background', undefined, firstCookie)).status, 401);
    assert.equal((await request('background', { careerId: 'journalist', action: 'remove' }, replacement)).status, 200);
    assert.deepEqual(await (await request('background', undefined, replacement)).json(), { drafts: [] });
    assert.equal((await request('logout', {}, replacement)).status, 200);
    assert.equal((await request('background', undefined, replacement)).status, 401);
    assert.equal((await db.query("SELECT count(*)::int AS count FROM accounts.member WHERE password_hash IS NOT NULL")).rows[0].count, 2);
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
