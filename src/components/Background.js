import { renderReport } from "./AnalysisReport.js";
import { accountRequest } from "../lib/account-request.js";
import {
  backgroundCategories, backgroundLimits, hasBackgroundEvidence, normalizeBackground,
  readBackgroundDraft, writeBackgroundDraft,
} from "../lib/background-draft.js";

export function BackgroundForm() {
  return `<form data-background-form>
    <p>草稿自动保存在当前浏览器。完成填写时，会将有效经历发送给 AI 分析服务。请勿填写联系方式或证件号码。</p>
    <p role="status" data-draft-status></p>
    ${backgroundCategories.map(([id, title]) => `<fieldset class="card info-card" data-background-category="${id}">
      <legend>${title}</legend>
      <div data-background-rows></div>
      <button class="btn btn-ghost" type="button" data-background-add>添加${title}条目</button>
    </fieldset>`).join("")}
    <label>自由补充（选填）
      <textarea name="narrative" maxlength="${backgroundLimits.narrative}" rows="4"></textarea>
    </label>
    <label data-background-save-report hidden><span><input type="checkbox" name="saveReport"> 将成功报告保存到我的账号</span></label>
    <div class="page-actions">
      <button class="btn btn-primary" type="submit">完成填写</button>
      <button class="btn btn-ghost" type="button" data-background-account>保存到账号</button>
      <button class="btn btn-ghost" type="button" data-background-clear>清除这个职业的草稿</button>
    </div>
    <p role="status" data-background-feedback></p>
    <button class="text-button" type="button" data-background-login data-tab="mine" hidden>登录后返回继续</button>
    <div class="card info-card" data-background-report hidden></div>
    <template data-background-row>
      <div class="background-row">
        <label>名称<input name="entryName" maxlength="${backgroundLimits.name}"></label>
        <label>任务或成果（选填）
          <textarea name="entryDetails" maxlength="${backgroundLimits.details}" rows="2"></textarea>
        </label>
        <button class="btn btn-ghost" type="button" data-background-remove>删除此条目</button>
      </div>
    </template>
  </form>`;
}

export function mountBackgroundForm(form, careerId) {
  const { draft, available } = readBackgroundDraft(careerId);
  const fields = Array.from(form.querySelectorAll("[data-background-category]"));
  const narrative = form.elements.narrative;
  const template = form.querySelector("template");
  const status = form.querySelector("[data-draft-status]");
  const feedback = form.querySelector("[data-background-feedback]");
  const report = form.querySelector("[data-background-report]");
  const submit = form.querySelector("[type=submit]");
  const saveReport = form.elements.saveReport;
  accountRequest("session").then(({ profile }) => {
    form.querySelector("[data-background-save-report]").hidden = !profile;
  }).catch(() => {});
  let lastRequest;

  function invalidateReport() {
    feedback.textContent = "";
    report.hidden = true;
    report.replaceChildren();
  }

  function storageMessage(working) {
    status.textContent = working ? "" : "此浏览器无法保存草稿。离开页面前请自行保留内容。";
  }
  function draftFromForm() {
    const entries = Object.fromEntries(fields.map(field => [
      field.dataset.backgroundCategory,
      Array.from(field.querySelectorAll(".background-row"), row => ({
        name: row.querySelector("[name=entryName]").value,
        details: row.querySelector("[name=entryDetails]").value,
      })),
    ]));
    return normalizeBackground({ entries, narrative: narrative.value });
  }
  function save() {
    storageMessage(writeBackgroundDraft(careerId, draftFromForm()));
  }
  function addRow(field, value = { name: "", details: "" }) {
    const rows = field.querySelector("[data-background-rows]");
    const add = field.querySelector("[data-background-add]");
    if (rows.children.length >= backgroundLimits.entries) return;
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector("[name=entryName]").value = value.name;
    row.querySelector("[name=entryDetails]").value = value.details;
    rows.append(row);
    add.disabled = rows.children.length >= backgroundLimits.entries;
    row.querySelector("[data-background-remove]").addEventListener("click", () => {
      row.remove();
      add.disabled = false;
      add.focus();
      invalidateReport();
      save();
    });
    return row;
  }

  storageMessage(available);
  narrative.value = draft.narrative;
  for (const field of fields) {
    for (const row of draft.entries[field.dataset.backgroundCategory]) addRow(field, row);
    field.querySelector("[data-background-add]").addEventListener("click", () => {
      addRow(field)?.querySelector("input").focus();
    });
  }
  form.addEventListener("input", () => {
    invalidateReport();
    save();
  });
  form.querySelector("[data-background-clear]").addEventListener("click", () => {
    for (const field of fields) {
      field.querySelector("[data-background-rows]").replaceChildren();
      field.querySelector("[data-background-add]").disabled = false;
    }
    narrative.value = "";
    invalidateReport();
    save();
    feedback.textContent = "已清空表单。";
  });
  const accountButton = form.querySelector("[data-background-account]");
  const signIn = form.querySelector("[data-background-login]");
  accountButton.addEventListener("click", async () => {
    signIn.hidden = true;
    const draft = draftFromForm();
    if (!hasBackgroundEvidence(draft)) {
      feedback.textContent = "请先填写一项有效经历再保存到账号。";
      return;
    }
    accountButton.disabled = true;
    try {
      await accountRequest("background", { careerId, draft });
      feedback.textContent = "已保存到账号的私人背景档案。";
    } catch (error) {
      feedback.textContent = error.message;
      signIn.hidden = error.status !== 401;
    } finally {
      accountButton.disabled = false;
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const draft = draftFromForm();
    if (!hasBackgroundEvidence(draft)) {
      feedback.textContent = "请至少填写一个经历名称，或在自由补充中描述一项经历。";
      return;
    }

    storageMessage(writeBackgroundDraft(careerId, draft));
    const saveToAccount = saveReport.checked;
    const currentSignature = () => JSON.stringify([draftFromForm(), saveReport.checked]);
    const signature = currentSignature();
    invalidateReport();
    submit.disabled = true;
    feedback.textContent = "正在分析个人背景…";
    try {
      if (lastRequest?.signature !== signature) {
        lastRequest = { signature, id: crypto.randomUUID() };
      }
      const response = await fetch("/api/background-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerId, draft, saveReport: saveToAccount, requestId: lastRequest.id }),
      });
      const result = await response.json();
      if (currentSignature() !== signature) return;
      if (!response.ok) {
        feedback.textContent = result.error || "暂时无法分析，请重试。";
        return;
      }
      renderReport(report, result);
      feedback.textContent = "分析完成。";
    } catch {
      if (currentSignature() === signature) feedback.textContent = "暂时无法分析，请重试。";
    } finally {
      submit.disabled = false;
    }
  });
}
