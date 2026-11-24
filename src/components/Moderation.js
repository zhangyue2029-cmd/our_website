export async function mountModerationPanel(panel, isCurrent) {
  const list = panel.querySelector("[data-reports-list]");
  const status = panel.querySelector("[data-moderation-status]");
  const endpoint = "/api/community/moderation";

  async function fetchReports() {
    const response = await fetch(endpoint);
    if (!isCurrent()) return;
    if (response.status === 401 || response.status === 403) {
      panel.hidden = true;
      return;
    }
    if (!response.ok) throw new Error("审核队列暂不可用。");
    const { reports } = await response.json();
    if (!isCurrent()) return;
    list.replaceChildren();
    panel.hidden = false;
    for (const report of reports) {
      const item = document.createElement("article");
      item.className = "card info-card";
      const heading = document.createElement("h3");
      heading.textContent = report.title;
      const body = document.createElement("p");
      body.textContent = report.body;
      const detail = document.createElement("p");
      const visibility = report.status === "visible" ? "可见" : "已隐藏";
      detail.textContent = `${report.reviewed_at ? "已处理" : "待处理"} · ${visibility} · 举报原因：${report.reason}`;
      const form = document.createElement("form");
      form.innerHTML = `<label>处置原因<textarea name="reason" maxlength="500" required rows="2"></textarea></label>
        <div><button class="btn btn-ghost" type="submit" value="hidden">隐藏</button>
        <button class="btn btn-ghost" type="submit" value="visible">保持可见或恢复</button></div>`;
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const button = event.submitter;
        if (!button || !isCurrent()) return;
        button.disabled = true;
        try {
          const result = await fetch(endpoint, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: report.id, status: button.value, reason: form.elements.reason.value }),
          });
          if (!result.ok) throw new Error((await result.json()).error || "处置失败。");
          await fetchReports();
          status.textContent = "处置已记录。";
        } catch (error) {
          status.textContent = error.message;
        } finally {
          button.disabled = false;
        }
      });
      item.append(heading, body, detail, form);
      list.append(item);
    }
    if (!reports.length) status.textContent = "暂无举报。";
  }

  try {
    await fetchReports();
  } catch (error) {
    status.textContent = error.message;
  }
}
