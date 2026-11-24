import { randomUUID } from "node:crypto";
import { cookieDigest, currentMember, fromOwnSite, readJson, reply } from "./accounts.mjs";
import { recruitmentReference } from "../src/data/recruitment-reference.js";

const pageSize = 20;
const kinds = ["question", "experience"];
const validCareer = id => typeof id === "string" && Object.hasOwn(recruitmentReference.careers, id);

export function createCommunityHandler(db) {
  return async (req, res) => {
    if (!db) return reply(res, 503, { error: "分享圈子暂未配置。" });
    try {
      if (req.method === "GET") {
        const { searchParams } = new URL(req.url, "http://localhost");
        const career = searchParams.get("career") || null;
        const kind = searchParams.get("kind") || null;
        const term = (searchParams.get("q") || "").trim().slice(0, 100);
        const page = Number(searchParams.get("page") ?? 0);
        if ((career && !validCareer(career)) || (kind && !kinds.includes(kind)) ||
            !Number.isInteger(page) || page < 0 || page > 500) {
          return reply(res, 400, { error: "筛选条件无效。" });
        }
        const { rows } = await db.query(
          `SELECT * FROM community.public_posts
           WHERE ($1::text IS NULL OR career_id = $1) AND ($2::text IS NULL OR kind = $2)
             AND ($3 = '' OR strpos(lower(title), lower($3)) > 0 OR strpos(lower(body), lower($3)) > 0)
           ORDER BY created_at DESC, id DESC LIMIT $4 OFFSET $5`,
          [career, kind, term, pageSize + 1, page * pageSize],
        );
        return reply(res, 200, { posts: rows.slice(0, pageSize), hasMore: rows.length > pageSize && page < 500 });
      }
      if (req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return reply(res, 405, { error: "不支持此操作。" });
      }
      if (!fromOwnSite(req)) return reply(res, 403, { error: "请在本站完成此操作。" });
      const member = await currentMember(db, cookieDigest(req));
      if (!member) return reply(res, 401, { error: "登录后可发布帖子。" });
      const body = await readJson(req);
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      const text = typeof body?.body === "string" ? body.body.trim() : "";
      if (!title || title.length > 120 || !text || text.length > 4000 || !validCareer(body?.careerId) ||
          !kinds.includes(body?.kind) || typeof body?.anonymous !== "boolean") {
        return reply(res, 400, { error: "请填写标题、正文、职业和帖子类型。" });
      }
      const allowedKind = member.community_role === "student" ? "question" : "experience";
      if (body.kind !== allowedKind) return reply(res, 403, { error: "当前身份无法发布此类帖子。" });

      const id = randomUUID();
      await db.query(
        `INSERT INTO community.post(id, member_id, career_id, kind, title, body, anonymous)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, member.id, body.careerId, body.kind, title, text, body.anonymous],
      );
      return reply(res, 201, { id });
    } catch {
      return reply(res, 503, { error: "分享圈子暂时不可用，请稍后重试。" });
    }
  };
}
