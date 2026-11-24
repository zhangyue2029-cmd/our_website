import { randomUUID } from "node:crypto";
import { cookieDigest, currentMember, fromOwnSite, readJson, reply } from "./accounts.mjs";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const supported = ["comment", "like", "bookmark", "report"];

async function readComments(db, postId) {
  const { rows } = await db.query(
    `SELECT c.id, c.parent_id, c.body, c.created_at,
       CASE WHEN p.anonymous AND p.member_id = c.member_id THEN NULL ELSE m.display_name END AS author_name
     FROM community.comment AS c JOIN accounts.member AS m ON m.id = c.member_id
     JOIN community.post AS p ON p.id = c.post_id
     WHERE c.post_id = $1 AND p.status = 'visible'
     ORDER BY c.created_at DESC, c.id DESC LIMIT 50`,
    [postId],
  );
  return rows;
}

export function createCommunityInteractions(db) {
  return async (req, res, postId) => {
    if (!db) return reply(res, 503, { error: "分享圈子暂未配置。" });
    if (!uuid.test(postId)) return reply(res, 404, { error: "未找到该帖子。" });
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return reply(res, 405, { error: "不支持此操作。" });
    }
    if (req.method === "POST" && !fromOwnSite(req)) return reply(res, 403, { error: "请在本站完成此操作。" });
    try {
      const member = await currentMember(db, cookieDigest(req));
      if (req.method === "POST" && !member) return reply(res, 401, { error: "请登录后参与互动。" });
      const { rows } = await db.query(
        `SELECT count(r.member_id) FILTER (WHERE r.kind = 'like')::integer AS likes,
            coalesce(bool_or(r.kind = 'like' AND r.member_id = $2), false) AS liked,
            coalesce(bool_or(r.kind = 'bookmark' AND r.member_id = $2), false) AS bookmarked
         FROM community.public_posts AS p LEFT JOIN community.reaction AS r ON r.post_id = p.id
         WHERE p.id = $1 GROUP BY p.id`,
        [postId, member?.id ?? null],
      );
      if (rows.length === 0) return reply(res, 404, { error: "未找到该帖子。" });
      if (req.method === "GET") {
        return reply(res, 200, { ...rows[0], comments: await readComments(db, postId), signedIn: Boolean(member) });
      }

      const body = await readJson(req);
      const action = body?.action;
      if (!supported.includes(action)) return reply(res, 400, { error: "互动类型无效。" });
      if (action === "comment") {
        const text = typeof body.body === "string" ? body.body.trim() : "";
        const parent = body.parentId ?? null;
        if (!text || text.length > 1200 || (parent !== null && (typeof parent !== "string" || !uuid.test(parent)))) {
          return reply(res, 400, { error: "请填写有效的回复内容。" });
        }
        const result = await db.query(
          `INSERT INTO community.comment(id, post_id, member_id, parent_id, body)
           SELECT $1, $2, $3, $4, $5
           WHERE EXISTS (SELECT 1 FROM community.public_posts WHERE id = $2)
             AND ($4::uuid IS NULL OR EXISTS (SELECT 1 FROM community.comment WHERE post_id = $2 AND id = $4))`,
          [randomUUID(), postId, member.id, parent, text],
        );
        return result.rowCount
          ? reply(res, 201, { saved: true })
          : reply(res, 404, { error: "未找到对应的帖子或回复。" });
      }
      if (action === "report") {
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";
        if (!reason || reason.length > 500) return reply(res, 400, { error: "请填写举报原因。" });
        await db.query(
          `INSERT INTO community.post_report(post_id, reporter_id, reason) VALUES ($1, $2, $3)
           ON CONFLICT (post_id, reporter_id) DO NOTHING`,
          [postId, member.id, reason],
        );
        return reply(res, 200, { saved: true });
      }
      if (typeof body.enabled !== "boolean") return reply(res, 400, { error: "请提供互动状态。" });
      if (body.enabled) {
        await db.query(
          "INSERT INTO community.reaction(post_id, member_id, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [postId, member.id, action],
        );
      } else {
        await db.query("DELETE FROM community.reaction WHERE post_id = $1 AND member_id = $2 AND kind = $3",
          [postId, member.id, action]);
      }
      return reply(res, 200, { saved: true });
    } catch {
      return reply(res, 503, { error: "互动服务暂时不可用，请稍后重试。" });
    }
  };
}
