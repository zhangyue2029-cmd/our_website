export function renderReport(container, result) {
  const element = (tag, text) => {
    const node = document.createElement(tag);
    node.textContent = text;
    return node;
  };
  const content = [
    element("h2", "职业准备分析"),
    element("p", result.summary),
    ...(result.rulesVersion ? [element("p", `分析方式：文字线索对照 · ${result.rulesVersion}。命中可用于整理经历，仍需结合实际作品和过程判断。`)] : []),
    element("p", `资料版本：${result.referenceVersion}。本报告依据通用招聘参考，样本不足以计算证据覆盖率。`),
  ];
  const sections = [
    ["经历迁移", result.transfer],
    ["岗位要求与补充学习", result.gaps],
    ["接下来可以做什么", result.actions],
  ];
  for (const [title, rows] of sections) {
    content.push(element("h3", title));
    if (!rows.length) {
      content.push(element("p", title === "经历迁移" ? "目前没有明确的经历线索可与这些要求对应。" : "当前填写已提及本次参考中的各项要求，可以继续用作品和过程补充证据。"));
      continue;
    }
    const list = document.createElement("ul");
    for (const row of rows) {
      const context = row.entry ? `${row.entry} · ${row.requirement}` : row.requirement;
      const item = element("li", "");
      item.append(element("strong", context), element("p", row.text));
      list.append(item);
    }
    content.push(list);
  }
  container.replaceChildren(...content);
  container.hidden = false;
}
