import { PostInteractions } from "./PostInteractions.js";
import { accountRequest } from "./Account.js";
import { recruitmentReference } from "../data/recruitment-reference.js";

export function CommunityPanel(careers) {
  const options = careers.filter(career => Object.hasOwn(recruitmentReference.careers, career.id))
    .map(career => `<option value="${career.id}">${career.name}</option>`).join("");
  return `<section class="stage-enter background-page" data-community>
    <h1 tabindex="-1">分享圈子</h1>
    <form class="card info-card" data-community-filter>
      <label>职业<select name="career"><option value="">全部职业</option>${options}</select></label>
      <label>帖子类型<select name="kind"><option value="">全部类型</option><option value="question">求助提问</option><option value="experience">经验分享</option></select></label>
      <label>关键词<input name="q" type="search" maxlength="100"></label>
      <button class="btn btn-primary" type="submit">筛选帖子</button>
    </form>
    <details class="card info-card">
      <summary>发布帖子</summary>
      <p data-community-author role="status">正在检查登录状态…</p>
      <button class="text-button" type="button" data-tab="mine" data-community-login hidden>前往登录</button>
      <form data-community-compose hidden>
        <label>职业<select name="careerId" required><option value="">请选择</option>${options}</select></label>
        <label>标题<input name="title" required maxlength="120"></label>
        <label>正文<textarea name="body" required maxlength="4000" rows="6"></textarea></label>
        <label><span><input name="anonymous" type="checkbox"> 匿名发布</span></label>
        <button class="btn btn-primary" type="submit" data-community-submit>发布</button>
      </form>
    </details>
    <p data-community-status role="status"></p>
    <div data-community-feed></div>
    <button class="btn btn-ghost" type="button" data-community-next hidden>加载更多</button>
  </section>`;
}

export function mountCommunityPanel(root, careers) {
  const filters = root.querySelector("[data-community-filter]");
  const form = root.querySelector("[data-community-compose]");
  const feed = root.querySelector("[data-community-feed]");
  const status = root.querySelector("[data-community-status]");
  const author = root.querySelector("[data-community-author]");
  const next = root.querySelector("[data-community-next]");
  const publish = root.querySelector("[data-community-submit]");
  let kind;
  let page = 0;
  let version = 0;
  let selectedFilters = new URLSearchParams();

  async function posts(options, body) {
    const response = await fetch("/api/community/posts" + options, body === undefined ? undefined : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "暂时无法访问圈子。");
    return result;
  }

  function showPost(item) {
    const article = document.createElement("article");
    article.className = "card info-card community-post";
    const title = document.createElement("h2");
    title.textContent = item.title;
    const meta = document.createElement("p");
    const career = careers.find(career => career.id === item.career_id)?.name ?? "";
    const type = item.kind === "question" ? "求助提问" : "经验分享";
    const name = item.anonymous ? "匿名用户" : item.author_name;
    meta.textContent = [type, career, name].filter(Boolean).join(" · ");
    const text = document.createElement("p");
    text.className = "community-post-body";
    text.textContent = item.body;
    article.append(title, meta, text, PostInteractions(item.id));
    feed.append(article);
  }

  async function load(target) {
    const token = ++version;
    next.disabled = true;
    if (target === 0) {
      feed.replaceChildren();
      next.hidden = true;
    }
    status.textContent = "正在加载帖子…";
    try {
      const query = new URLSearchParams(selectedFilters);
      query.set("page", String(target));
      const data = await posts("?" + query);
      if (token !== version) return;
      for (const post of data.posts) showPost(post);
      next.hidden = !data.hasMore;
      page = target;
      status.textContent = target === 0 && !data.posts.length ? "暂无符合条件的帖子。" : "";
    } catch (error) {
      if (token === version) status.textContent = error.message;
    } finally {
      if (token === version) next.disabled = false;
    }
  }

  filters.addEventListener("submit", event => {
    event.preventDefault();
    selectedFilters = new URLSearchParams(new FormData(filters));
    load(0);
  });
  next.addEventListener("click", () => load(page + 1));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!kind || publish.disabled) return;
    publish.disabled = true;
    const fields = Object.fromEntries(new FormData(form));
    try {
      await posts("", { ...fields, kind, anonymous: form.elements.anonymous.checked });
      form.reset();
      filters.reset();
      selectedFilters = new URLSearchParams();
      await load(0);
      author.textContent = "帖子已发布。";
    } catch (error) {
      author.textContent = error.message;
    } finally {
      publish.disabled = false;
    }
  });

  accountRequest("session").then(({ profile }) => {
    if (!profile) {
      author.textContent = "登录后可发布帖子。";
      root.querySelector("[data-community-login]").hidden = false;
      return;
    }
    kind = profile.communityRole === "student" ? "question" : "experience";
    author.textContent = kind === "question" ? "以在校生身份发布求助帖。" : "以已就业分享者身份发布经验帖（未认证）。";
    publish.textContent = kind === "question" ? "发布求助" : "发布经验";
    form.hidden = false;
  }).catch(error => { author.textContent = error.message; });
  load(0);
}
