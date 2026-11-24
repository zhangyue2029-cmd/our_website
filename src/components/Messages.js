import { accountRequest } from "../lib/account-request.js";

const labels = { pending: "等待答复", accepted: "已接受", declined: "已拒绝", blocked: "已屏蔽" };

export async function mountInbox(panel, isCurrent) {
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const list = document.createElement("div");
  const refresh = button("刷新消息", () => load());
  panel.replaceChildren(refresh, status, list);

  function button(label, onClick) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "text-button";
    element.textContent = label;
    element.addEventListener("click", onClick);
    return element;
  }

  async function load() {
    refresh.disabled = true;
    try {
      const { conversations } = await accountRequest("conversations");
      if (!isCurrent()) return;
      list.replaceChildren();
      for (const conversation of conversations) renderConversation(conversation);
      status.textContent = conversations.length ? "" : "目前没有私信请求。";
    } catch (error) {
      if (isCurrent()) status.textContent = error.message;
    } finally {
      refresh.disabled = false;
    }
  }

  function renderConversation(conversation) {
    const root = document.createElement("details");
    const heading = document.createElement("summary");
    const content = document.createElement("div");
    const endpoint = "conversations/" + encodeURIComponent(conversation.id);
    heading.textContent = `${conversation.contact} · ${conversation.incoming ? "收到的请求" : "发出的请求"} · ${labels[conversation.status]}`;

    async function run(action, callback = load) {
      try {
        await accountRequest(endpoint, action);
        if (isCurrent()) await callback();
      } catch (error) {
        if (isCurrent()) status.textContent = error.message;
      }
    }

    async function history() {
      try {
        const { messages } = await accountRequest(endpoint);
        if (!isCurrent()) return;
        content.replaceChildren();
        for (const message of messages) {
          const item = document.createElement("div");
          const body = document.createElement("p");
          body.className = "community-post-body";
          body.textContent = (message.mine ? "我：" : conversation.contact + "：") + message.body;
          item.append(body);
          if (!message.mine) {
            item.append(button("举报这条消息", async () => {
              const reason = window.prompt("请填写举报原因");
              if (!reason?.trim()) return;
              await run({ action: "report", messageId: message.id, reason }, () => { status.textContent = "举报已提交。"; });
            }));
          }
          content.append(item);
        }
      } catch (error) {
        if (isCurrent()) status.textContent = error.message;
      }
    }

    root.append(heading, content);
    if (conversation.status === "pending" && conversation.incoming) {
      root.append(button("接受请求", () => run({ action: "accept" })),
        button("拒绝请求", () => run({ action: "decline" })));
    }
    if (conversation.status !== "blocked") {
      root.append(button("屏蔽私信", () => {
        if (window.confirm("屏蔽后，双方都无法继续发送消息。确定屏蔽？")) run({ action: "block" });
      }));
    }
    if (conversation.status === "accepted") {
      const form = document.createElement("form");
      form.innerHTML = '<label>私信<textarea name="body" maxlength="2000" required rows="3"></textarea></label><button class="btn btn-primary" type="submit">发送</button>';
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const submit = form.querySelector("[type=submit]");
        if (submit.disabled) return;
        submit.disabled = true;
        try {
          await run({ action: "send", body: form.elements.body.value }, async () => {
            form.reset();
            await history();
          });
        } finally {
          submit.disabled = false;
        }
      });
      root.append(form);
    }
    root.addEventListener("toggle", () => { if (root.open) history(); });
    list.append(root);
  }

  await load();
}
