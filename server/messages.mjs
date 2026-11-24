import { randomUUID } from "node:crypto";
import { cookieDigest, currentMember, fromOwnSite, readJson, reply } from "./accounts.mjs";

const idPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const validId = value => typeof value === "string" && idPattern.test(value);

async function transact(db, action) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function changeConversation(db, memberId, id, input) {
  return transact(db, async client => {
    const { rows } = await client.query(
      `SELECT requester_id, recipient_id, status FROM community.conversation
       WHERE id = $1 AND $2 IN (requester_id, recipient_id) FOR UPDATE`,
      [id, memberId],
    );
    const conversation = rows[0];
    if (!conversation) return [404, { error: "会话不存在。" }];
    const action = input?.action;
    if (action === "send") {
      if (conversation.status !== "accepted") return [403, { error: "只有对方接受请求后才可发送消息。" }];
      const content = typeof input.body === "string" ? input.body.trim() : "";
      if (!content || content.length > 2000) return [400, { error: "请填写有效的消息内容。" }];
      const { rowCount } = await client.query(
        `INSERT INTO community.message(id, conversation_id, sender_id, body)
         SELECT $1, $2, $3, $4
         WHERE (SELECT count(*) FROM community.message WHERE conversation_id = $2
           AND sender_id = $3 AND created_at > now() - interval '1 minute') < 12`,
        [randomUUID(), id, memberId, content],
      );
      return rowCount ? [201, { saved: true }] : [429, { error: "消息发送较频繁，请稍后再试。" }];
    }
    if (action === "report") {
      const reason = typeof input.reason === "string" ? input.reason.trim() : "";
      if (!validId(input.messageId) || !reason || reason.length > 500) return [400, { error: "请填写举报原因。" }];
      const { rowCount } = await client.query(
        `INSERT INTO community.message_report(message_id, reporter_id, reason)
         SELECT id, $3, $4 FROM community.message WHERE id = $1 AND conversation_id = $2 AND sender_id <> $3
         ON CONFLICT (message_id, reporter_id) DO UPDATE SET reason = EXCLUDED.reason`,
        [input.messageId, id, memberId, reason],
      );
      return rowCount ? [200, { saved: true }] : [404, { error: "未找到可举报的消息。" }];
    }

    let next;
    if (action === "block") next = "blocked";
    else if (conversation.recipient_id === memberId && conversation.status === "pending") {
      if (action === "accept") next = "accepted";
      if (action === "decline") next = "declined";
    }
    if (!next) return [403, { error: "当前会话状态不支持此操作。" }];
    await client.query("UPDATE community.conversation SET status = $2 WHERE id = $1", [id, next]);
    return [200, { status: next }];
  });
}

export function createMessageHandler(db) {
  return async (req, res, id) => {
    if (!db) return reply(res, 503, { error: "私信服务暂未配置。" });
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return reply(res, 405, { error: "不支持此操作。" });
    }
    if (req.method === "POST" && !fromOwnSite(req)) return reply(res, 403, { error: "请在本站完成此操作。" });
    if (id !== null && !validId(id)) return reply(res, 404, { error: "会话不存在。" });

    try {
      const member = await currentMember(db, cookieDigest(req));
      if (!member) return reply(res, 401, { error: "请登录后使用私信。" });
      if (req.method === "GET" && id === null) {
        const { rows } = await db.query(
          `SELECT c.id, c.status, c.recipient_id = $1 AS incoming, m.display_name AS contact
           FROM community.conversation AS c
           JOIN accounts.member AS m ON m.id = CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END
           WHERE $1 IN (requester_id, recipient_id) ORDER BY c.created_at DESC, c.id DESC LIMIT 50`,
          [member.id],
        );
        return reply(res, 200, { conversations: rows });
      }
      if (req.method === "GET") {
        const { rowCount } = await db.query(
          "SELECT 1 FROM community.conversation WHERE id = $1 AND $2 IN (requester_id, recipient_id)",
          [id, member.id],
        );
        if (!rowCount) return reply(res, 404, { error: "会话不存在。" });
        const { rows } = await db.query(
          `SELECT m.id, m.body, m.created_at, m.sender_id = $2 AS mine
           FROM community.message AS m JOIN community.conversation AS c ON c.id = m.conversation_id
           WHERE c.id = $1 AND $2 IN (c.requester_id, c.recipient_id)
           ORDER BY m.created_at DESC, m.id DESC LIMIT 50`,
          [id, member.id],
        );
        return reply(res, 200, { messages: rows.reverse() });
      }
      const input = await readJson(req);
      if (id !== null) {
        const [status, body] = await changeConversation(db, member.id, id, input);
        return reply(res, status, body);
      }
      if (!validId(input?.postId)) return reply(res, 400, { error: "请选择可联系作者的帖子。" });
      const { rows } = await db.query(
        `INSERT INTO community.conversation(id, requester_id, recipient_id)
         SELECT $1, $2, p.member_id FROM community.post AS p
         WHERE p.id = $3 AND p.status = 'visible' AND NOT p.anonymous AND p.member_id <> $2
           AND (SELECT count(*) FROM community.conversation WHERE requester_id = $2
             AND created_at > now() - interval '1 minute') < 5
         ON CONFLICT DO NOTHING RETURNING id`,
        [randomUUID(), member.id, input.postId],
      );
      if (!rows.length) return reply(res, 409, { error: "无法发起请求。可能已有会话，或该帖子不允许联系作者。" });
      return reply(res, 201, { requested: true });
    } catch {
      return reply(res, 503, { error: "私信服务暂不可用。" });
    }
  };
}
