import {
  backgroundCategories, backgroundLimits, hasBackgroundEvidence, normalizeBackground,
  readBackgroundDraft, writeBackgroundDraft,
} from "../lib/background-draft.js";

export function BackgroundForm() {
  return `<form data-background-form>
    <p>草稿自动保存在当前浏览器，请勿填写联系方式或证件号码。</p>
    <p role="status" data-draft-status></p>
    ${backgroundCategories.map(([id, title]) => `<fieldset class="card info-card" data-background-category="${id}">
      <legend>${title}</legend>
      <div data-background-rows></div>
      <button class="btn btn-ghost" type="button" data-background-add>添加${title}条目</button>
    </fieldset>`).join("")}
    <label>自由补充（选填）
      <textarea name="narrative" maxlength="${backgroundLimits.narrative}" rows="4"></textarea>
    </label>
    <div class="page-actions">
      <button class="btn btn-primary" type="submit">完成填写</button>
      <button class="btn btn-ghost" type="button" data-background-clear>清除这个职业的草稿</button>
    </div>
    <p role="status" data-background-feedback></p>
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
      feedback.textContent = "";
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
    feedback.textContent = "";
    save();
  });
  form.querySelector("[data-background-clear]").addEventListener("click", () => {
    for (const field of fields) {
      field.querySelector("[data-background-rows]").replaceChildren();
      field.querySelector("[data-background-add]").disabled = false;
    }
    narrative.value = "";
    save();
    feedback.textContent = "已清空表单。";
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const draft = draftFromForm();
    if (!hasBackgroundEvidence(draft)) {
      feedback.textContent = "请至少填写一个经历名称，或在自由补充中描述一项经历。";
      return;
    }
    const saved = writeBackgroundDraft(careerId, draft);
    storageMessage(saved);
    feedback.textContent = saved
      ? "草稿已保存。职业分析尚未开放。"
      : "职业分析尚未开放，浏览器也未能保存草稿。";
  });
}
