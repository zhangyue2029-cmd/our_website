import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { hasBackgroundEvidence, normalizeBackground } from "../src/lib/background-draft.js";
import { recruitmentReference } from "../src/data/recruitment-reference.js";

const derive = promisify(scrypt);
const dummySalt = randomBytes(16);
const sessionCookie = "qx_session";
const sessionSeconds = 14 * 24 * 60 * 60;
const maxBody = 256 * 1024;

export function cookieDigest(req) {
  const cookies = (req.headers.cookie ?? "").split(";").map(item => item.trim());
  const prefix = sessionCookie + "=";
  const token = cookies.find(item => item.startsWith(prefix))?.slice(prefix.length);
  return /^[a-f0-9]{64}$/.test(token ?? "") ? tokenDigest(token) : null;
}
function tokenDigest(token) {
  return createHash("sha256").update(token).digest();
}
function sessionHeader(token, seconds) {
  return `${sessionCookie}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
}
export function reply(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(body));
}

export async function readJson(req) {
  if (req.headers["content-type"]?.split(";")[0].trim() !== "application/json") return null;
  if (Number(req.headers["content-length"]) > maxBody) return null;
  let size = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > maxBody) return null;
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export function fromOwnSite(req) {
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  if (!req.headers.origin) return true;
  try {
    return new URL(req.headers.origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function toProfile(row) {
  return { username: row.username, displayName: row.display_name, communityRole: row.community_role };
}

export async function currentMember(db, digest) {
  if (!digest) return null;
  const { rows } = await db.query(
    `SELECT member.id, username, display_name, community_role
     FROM accounts.member AS member JOIN accounts.session AS session ON member.id = session.member_id
     WHERE token_hash = $1 AND expires_at > now()`,
    [digest],
  );
  return rows[0] ?? null;
}

async function passwordKey(password, salt) {
  return derive(password, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
}

export function createAccountHandler(db) {
  const recent = [];
  let active = 0;

  async function authenticate(req, res, registering, body) {
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const { password, communityRole } = body;
    if (!/^[a-z0-9_]{3,24}$/.test(username) || typeof password !== "string" || Buffer.byteLength(password) > 512 ||
        password.length < (registering ? 12 : 1)) {
      return reply(res, 400, { error: "请输入有效用户名和密码。注册密码需至少 12 位。" });
    }
    if (registering && (!displayName || displayName.length > 40 || !["student", "employed"].includes(communityRole))) {
      return reply(res, 400, { error: "请填写昵称并选择身份。" });
    }
    const now = Date.now();
    while (recent.length && recent[0] < now - 60_000) recent.shift();
    if (active >= 3 || recent.length >= 30) {
      return reply(res, 429, { error: "账号请求较多，请稍后重试。" });
    }
    recent.push(now);
    active++;
    try {
      let member;
      if (registering) {
        const salt = randomBytes(16);
        const key = await passwordKey(password, salt);
        const { rows } = await db.query(
          `INSERT INTO accounts.member(id, username, display_name, community_role, password_salt, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING
           RETURNING id, username, display_name, community_role`,
          [randomUUID(), username, displayName, communityRole, salt, key],
        );
        member = rows[0];
        if (!member) return reply(res, 409, { error: "无法使用这个用户名注册。" });
      } else {
        const { rows } = await db.query(
          "SELECT id, username, display_name, community_role, password_salt, password_hash FROM accounts.member WHERE username = $1",
          [username],
        );
        member = rows[0];
        const key = await passwordKey(password, member?.password_salt ?? dummySalt);
        if (!member || !timingSafeEqual(key, member.password_hash)) {
          return reply(res, 401, { error: "用户名或密码不正确。" });
        }
      }

      const token = randomBytes(32).toString("hex");
      await db.query("DELETE FROM accounts.session WHERE member_id = $1 AND expires_at <= now()", [member.id]);
      await db.query(
        "INSERT INTO accounts.session(token_hash, member_id, expires_at) VALUES ($1, $2, $3)",
        [tokenDigest(token), member.id, new Date(now + sessionSeconds * 1000)],
      );
      const previous = cookieDigest(req);
      if (previous) await db.query("DELETE FROM accounts.session WHERE token_hash = $1", [previous]);
      res.setHeader("Set-Cookie", sessionHeader(token, sessionSeconds));
      return reply(res, registering ? 201 : 200, { profile: toProfile(member) });
    } finally {
      active--;
    }
  }

  return async (req, res, route) => {
    if (!db) return reply(res, 503, { error: "账号服务暂未配置。" });
    if (req.method === "POST" && !fromOwnSite(req)) return reply(res, 403, { error: "请在本站完成此操作。" });
    try {
      const digest = cookieDigest(req);
      if (req.method === "GET" && route === "/api/account/session") {
        const member = await currentMember(db, digest);
        return reply(res, 200, { profile: member ? toProfile(member) : null });
      }
      if (req.method === "POST" && route === "/api/account/logout") {
        if (digest) await db.query("DELETE FROM accounts.session WHERE token_hash = $1", [digest]);
        res.setHeader("Set-Cookie", sessionHeader("", 0));
        return reply(res, 200, { profile: null });
      }
      if (req.method === "POST" && ["/api/account/register", "/api/account/login"].includes(route)) {
        const body = await readJson(req);
        if (!body) return reply(res, 400, { error: "无法读取账号资料。" });
        return await authenticate(req, res, route.endsWith("/register"), body);
      }
      if (route === "/api/account/background" && ["GET", "POST"].includes(req.method)) {
        const member = await currentMember(db, digest);
        if (!member) return reply(res, 401, { error: "请先登录后保存背景档案。" });
        if (req.method === "GET") {
          const { rows } = await db.query(
            "SELECT career_id, draft, updated_at FROM accounts.background WHERE member_id = $1 ORDER BY updated_at DESC",
            [member.id],
          );
          return reply(res, 200, { drafts: rows });
        }
        const body = await readJson(req);
        if (typeof body?.careerId !== "string" || !Object.hasOwn(recruitmentReference.careers, body.careerId)) {
          return reply(res, 400, { error: "请选择支持背景填写的职业。" });
        }
        if (body.action === "remove") {
          await db.query("DELETE FROM accounts.background WHERE member_id = $1 AND career_id = $2",
            [member.id, body.careerId]);
          return reply(res, 200, { removed: true });
        }
        const draft = normalizeBackground(body.draft);
        if (!hasBackgroundEvidence(draft)) return reply(res, 400, { error: "请至少填写一项有效经历。" });
        await db.query(
          `INSERT INTO accounts.background(member_id, career_id, draft) VALUES ($1, $2, $3)
           ON CONFLICT (member_id, career_id) DO UPDATE SET draft = EXCLUDED.draft, updated_at = now()`,
          [member.id, body.careerId, draft],
        );
        return reply(res, 200, { saved: true });
      }
      if (req.method === "GET" && route === "/api/account/reports") {
        const member = await currentMember(db, digest);
        if (!member) return reply(res, 401, { error: "登录后可查看私人报告。" });
        const { rows } = await db.query(
          "SELECT career_id, report, saved_at FROM accounts.report WHERE member_id = $1 ORDER BY saved_at DESC",
          [member.id],
        );
        return reply(res, 200, { reports: rows });
      }
      if (route === "/api/account/bookmarks" && ["GET", "POST"].includes(req.method)) {
        const member = await currentMember(db, digest);
        if (!member) return reply(res, 401, { error: "登录后可查看收藏。" });
        if (req.method === "POST") {
          const body = await readJson(req);
          if (typeof body?.postId !== "string" || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(body.postId)) {
            return reply(res, 400, { error: "请选择要取消收藏的帖子。" });
          }
          await db.query("DELETE FROM community.reaction WHERE post_id = $1 AND member_id = $2 AND kind = 'bookmark'",
            [body.postId, member.id]);
          return reply(res, 200, { removed: true });
        }
        const { rows } = await db.query(
          `SELECT p.id, p.title, p.body FROM community.public_posts AS p
           JOIN community.reaction AS r ON p.id = r.post_id
           WHERE r.kind = 'bookmark' AND r.member_id = $1 ORDER BY p.created_at DESC, p.id DESC LIMIT 50`,
          [member.id],
        );
        return reply(res, 200, { posts: rows });
      }
      return reply(res, 404, { error: "账号操作不存在。" });
    } catch {
      return reply(res, 503, { error: "账号服务暂时不可用，请稍后重试。" });
    }
  };
}
