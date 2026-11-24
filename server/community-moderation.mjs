import { cookieDigest, currentMember, fromOwnSite, readJson, reply } from "./accounts.mjs";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function createCommunityModeration(db) {
  return async (req, res) => {
    if (!db) return reply(res, 503, { error: "社区审核暂未配置。" });
    if (req.method === "POST" && !fromOwnSite(req)) return reply(res, 403, { error: "请在本站完成此操作。" });
    try {
      const member = await currentMember(db, cookieDigest(req));
      if (!member) return reply(res, 401, { error: "请先登录。" });
      const { rowCount } = await db.query("SELECT 1 FROM community.moderator WHERE member_id = $1", [member.id]);
      if (!rowCount) return reply(res, 403, { error: "需要社区审核权限。" });

      if (req.method === "GET") {
        const { rows } = await db.query(
          `SELECT p.id, p.title, p.body, p.status, q.reason, q.created_at, q.reviewed_at
           FROM community.post_report AS q JOIN community.post AS p ON p.id = q.post_id
           ORDER BY q.reviewed_at NULLS FIRST, q.created_at DESC LIMIT 50`,
        );
        return reply(res, 200, { reports: rows });
      }
      if (req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return reply(res, 405, { error: "不支持此操作。" });
      }
      const input = await readJson(req);
      const reason = typeof input?.reason === "string" ? input.reason.trim() : "";
      if (typeof input?.postId !== "string" || !uuid.test(input.postId) ||
          !["hidden", "visible"].includes(input.status) || !reason || reason.length > 500) {
        return reply(res, 400, { error: "请选择处置并填写原因。" });
      }
      const result = await db.query(
        `WITH changed AS (
           UPDATE community.post SET status = $2 WHERE id = $1
           AND EXISTS (SELECT 1 FROM community.moderator WHERE member_id = $3)
           AND EXISTS (SELECT 1 FROM community.post_report WHERE post_id = $1) RETURNING id
         ), audited AS (
           INSERT INTO community.moderation_action(post_id, moderator_id, decision, reason)
           SELECT id, $3, $2, $4 FROM changed RETURNING post_id
         )
         UPDATE community.post_report SET reviewed_at = now() FROM audited
         WHERE community.post_report.post_id = audited.post_id
         RETURNING community.post_report.post_id`,
        [input.postId, input.status, member.id, reason],
      );
      if (result.rowCount === 0) return reply(res, 404, { error: "未找到可处置的举报。" });
      return reply(res, 200, { reviewed: true });
    } catch {
      return reply(res, 503, { error: "审核服务暂不可用。" });
    }
  };
}
