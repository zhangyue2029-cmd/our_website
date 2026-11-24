import { renderReport } from "./AnalysisReport.js";
import { writeBackgroundDraft } from "../lib/background-draft.js";

export async function accountRequest(path, body) {
  const options = body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  const response = await fetch("/api/account/" + path, options);
  const value = await response.json();
  if (!response.ok) {
    const error = new Error(value.error || "账号服务暂时不可用。");
    error.status = response.status;
    throw error;
  }
  return value;
}

export function AccountPanel() {
  return `<section class="card info-card background-page account-panel" data-account-panel>
    <h2>我的账号</h2>
    <p role="status" data-account-status>正在检查登录状态…</p>
    <div data-account-guest hidden>
      <form data-account-login>
        <label>用户名<input name="username" required autocomplete="username" maxlength="24"></label>
        <label>密码<input name="password" type="password" required autocomplete="current-password" maxlength="128"></label>
        <button class="btn btn-primary" type="submit">登录</button>
      </form>
      <details class="account-register">
        <summary>创建账号</summary>
        <form data-account-register>
          <label>用户名（3–24 位英文、数字或下划线）<input name="username" required autocomplete="username" pattern="[A-Za-z0-9_]{3,24}" maxlength="24"></label>
          <label>显示昵称<input name="displayName" required maxlength="40"></label>
          <label>密码（至少 12 位）<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label>
          <label>自报身份<select name="communityRole"><option value="student">在校生</option><option value="employed">已就业分享者</option></select></label>
          <button class="btn btn-ghost" type="submit">注册并登录</button>
        </form>
      </details>
    </div>
    <div data-account-member hidden>
      <p data-account-name></p>
      <button class="btn btn-ghost" type="button" data-account-logout>退出登录</button>
      <button class="text-button" type="button" data-tab-jump>返回职业探索</button>
      <h3>背景档案</h3>
      <p>在背景填写页选择「保存到账号」后，档案会出现在这里。</p>
      <ul data-account-drafts></ul>
      <h3>职业报告</h3>
      <div data-account-reports></div>
    </div>
  </section>`;
}

export async function mountAccountPanel(root, careers) {
  const status = root.querySelector("[data-account-status]");
  const guest = root.querySelector("[data-account-guest]");
  const member = root.querySelector("[data-account-member]");
  const list = root.querySelector("[data-account-drafts]");
  const reports = root.querySelector("[data-account-reports]");

  function show(profile) {
    guest.hidden = Boolean(profile);
    member.hidden = !profile;
    list.replaceChildren();
    reports.replaceChildren();
    root.querySelector("[data-account-name]").textContent = profile
      ? `${profile.displayName} · ${profile.communityRole === "employed" ? "已就业分享者（未认证）" : "在校生（自报）"}`
      : "";
  }

  async function loadDrafts() {
    const { drafts } = await accountRequest("background");
    list.replaceChildren();
    if (!drafts.length) {
      const item = document.createElement("li");
      item.textContent = "还没有保存的背景档案。";
      list.append(item);
    }
    for (const { career_id: careerId, draft } of drafts) {
      const career = careers.find(item => item.id === careerId);
      if (!career) continue;
      const row = document.createElement("li");
      const restore = document.createElement("button");
      restore.type = "button";
      restore.className = "text-button";
      restore.textContent = career.name + "：在本机打开账号存档";
      restore.addEventListener("click", () => {
        if (!window.confirm("使用账号存档覆盖此职业在当前浏览器中的草稿？")) return;
        if (!writeBackgroundDraft(careerId, draft)) {
          status.textContent = "当前浏览器无法恢复草稿。";
          return;
        }
        window.location.hash = "#/background?category=journalism&major=journalism&career=" + encodeURIComponent(careerId);
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button";
      remove.textContent = "删除账号存档";
      remove.addEventListener("click", async () => {
        if (!window.confirm("删除这个职业的账号存档？")) return;
        remove.disabled = true;
        try {
          await accountRequest("background", { careerId, action: "remove" });
          await loadDrafts();
          status.textContent = "账号存档已删除。";
        } catch (error) {
          status.textContent = error.message;
        } finally {
          remove.disabled = false;
        }
      });
      row.append(restore, remove);
      list.append(row);
    }
  }

  async function loadReports() {
    const result = await accountRequest("reports");
    reports.replaceChildren();
    if (result.reports.length === 0) {
      reports.textContent = "还没有保存的职业报告。";
    }
    for (const { career_id: careerId, report, saved_at: savedAt } of result.reports) {
      const career = careers.find(item => item.id === careerId);
      if (!career) continue;
      const details = document.createElement("details");
      const label = document.createElement("summary");
      const content = document.createElement("div");
      label.textContent = `${career.name} · ${new Date(savedAt).toLocaleDateString("zh-CN")}`;
      renderReport(content, report);
      details.append(label, content);
      reports.append(details);
    }
  }

  for (const action of ["login", "register"]) {
    root.querySelector(`[data-account-${action}]`).addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector("[type=submit]");
      submit.disabled = true;
      status.textContent = "正在处理…";
      try {
        const { profile } = await accountRequest(action, Object.fromEntries(new FormData(form)));
        form.reset();
        show(profile);
        status.textContent = "已登录。";
        await Promise.all([loadDrafts(), loadReports()]);
      } catch (error) {
        status.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
  }

  root.querySelector("[data-account-logout]").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await accountRequest("logout", {});
      show(null);
      status.textContent = "已退出登录。";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  try {
    const { profile } = await accountRequest("session");
    show(profile);
    status.textContent = profile ? "" : "登录后可保存私人背景档案。";
    if (profile) await Promise.all([loadDrafts(), loadReports()]);
  } catch (error) {
    status.textContent = error.message;
  }
}
