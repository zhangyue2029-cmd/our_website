export function PostInteractions(postId) {
  const panel = document.createElement("details");
  panel.className = "post-interactions";
  panel.innerHTML = `<summary>评论与互动</summary>
    <p role="status" data-interaction-status></p>
    <div data-interaction-actions hidden>
      <button class="text-button" type="button" data-like></button>
      <button class="text-button" type="button" data-bookmark></button>
    </div>
    <p data-interaction-count></p>
    <div data-comment-list></div>
    <button class="text-button" type="button" data-tab="mine" data-interaction-login hidden>登录后参与互动</button>
    <form data-comment-form hidden>
      <label><span data-comment-label>发表评论</span><textarea name="body" maxlength="1200" required rows="3"></textarea></label>
      <button class="text-button" type="button" data-cancel-reply hidden>取消回复</button>
      <button class="btn btn-primary" type="submit">发送评论</button>
    </form>
    <form data-report-form hidden>
      <label>举报原因<textarea name="reason" maxlength="500" required rows="2"></textarea></label>
      <button class="text-button" type="submit">提交举报</button>
    </form>`;
  const status = panel.querySelector("[data-interaction-status]");
  const list = panel.querySelector("[data-comment-list]");
  const form = panel.querySelector("[data-comment-form]");
  const report = panel.querySelector("[data-report-form]");
  const like = panel.querySelector("[data-like]");
  const bookmark = panel.querySelector("[data-bookmark]");
  const cancel = panel.querySelector("[data-cancel-reply]");
  const label = panel.querySelector("[data-comment-label]");
  const endpoint = "/api/community/posts/" + encodeURIComponent(postId) + "/interactions";
  let snapshot;
  let replyTo;
  let busy = false;

  function selectReply(comment) {
    replyTo = comment;
    label.textContent = comment ? "回复 " + (comment.author_name ?? "匿名用户") : "发表评论";
    cancel.hidden = !comment;
    if (comment) form.elements.body.focus();
  }

  async function request(body) {
    const response = await fetch(endpoint, body ? {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    } : undefined);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "暂时无法加载互动。");
    return result;
  }
  function render(data) {
    snapshot = data;
    panel.querySelector("[data-interaction-actions]").hidden = !data.signedIn;
    panel.querySelector("[data-interaction-login]").hidden = data.signedIn;
    form.hidden = report.hidden = !data.signedIn;
    panel.querySelector("[data-interaction-count]").textContent = `${data.likes} 人点赞`;
    like.textContent = data.liked ? "取消点赞" : "点赞";
    bookmark.textContent = data.bookmarked ? "取消收藏" : "收藏";
    like.setAttribute("aria-pressed", String(data.liked));
    bookmark.setAttribute("aria-pressed", String(data.bookmarked));
    const comments = new Map(data.comments.map(comment => [comment.id, comment]));
    list.replaceChildren();
    for (const comment of data.comments) {
      const row = document.createElement("article");
      const name = document.createElement("strong");
      const parent = comments.get(comment.parent_id);
      name.textContent = (comment.author_name ?? "匿名用户") +
        (comment.parent_id ? " · 回复" + (parent ? " " + (parent.author_name ?? "匿名用户") : "") : "");
      const body = document.createElement("p");
      body.textContent = comment.body;
      row.append(name, body);
      if (data.signedIn) {
        const reply = document.createElement("button");
        reply.type = "button";
        reply.className = "text-button";
        reply.textContent = "回复";
        reply.addEventListener("click", () => selectReply(comment));
        row.append(reply);
      }
      list.append(row);
    }
  }
  async function run(work) {
    if (busy) return;
    busy = true;
    status.textContent = "正在处理…";
    try {
      status.textContent = await work();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      busy = false;
    }
  }
  panel.addEventListener("toggle", () => {
    if (!panel.open || snapshot) return;
    run(async () => { render(await request()); return ""; });
  });
  cancel.addEventListener("click", () => selectReply(null));
  for (const [button, action, state] of [[like, "like", "liked"], [bookmark, "bookmark", "bookmarked"]]) {
    button.addEventListener("click", () => run(async () => {
      await request({ action, enabled: !snapshot[state] });
      render(await request());
      return "";
    }));
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    run(async () => {
      await request({ action: "comment", body: form.elements.body.value, parentId: replyTo?.id ?? null });
      form.reset();
      selectReply(null);
      render(await request());
      return "评论已发送。";
    });
  });
  report.addEventListener("submit", event => {
    event.preventDefault();
    run(async () => {
      await request({ action: "report", reason: report.elements.reason.value });
      report.reset();
      return "举报已提交。";
    });
  });
  return panel;
}
