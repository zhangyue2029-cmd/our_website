export function Icon(name, className = "") {
  const paths = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
    route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h7a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8"/>',
    user: '<circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    book: '<path d="M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
    pen: '<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z"/>',
    chart: '<path d="M4 4v16h16M8 15v-4m5 4V7m5 8v-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    leaf: '<path d="M5 19C-1 8 10 3 21 3c0 11-5 20-14 14M5 21 16 10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
  };
  return `<svg class="icon ${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.compass}</svg>`;
}
const items = [{ id: "explore", label: "探索", icon: "compass" }, { id: "direction", label: "我的方向", icon: "route" }, { id: "mine", label: "我的", icon: "user" }];
export function Navigation(tab, className) {
  return `<nav class="${className}" aria-label="${className === "bottom-nav" ? "移动端主导航" : "主导航"}">${items.map(item => `<button type="button" data-tab="${item.id}" ${item.id === tab ? 'aria-current="page"' : ""}>${Icon(item.icon)}<span>${item.label}</span>${Icon("chevron", "nav-chevron")}</button>`).join("")}</nav>`;
}
export function JourneyHeader({ stage, tab, saved, hasCareer, hasMajor, complete }) {
  const stages = [["majors", "选择起点"], ["focus", "学习领域"], ["explore", "职业星系"], ["market", "能力要求"], ["assess", "认识自己"], ["portrait", "能力画像"]];
  const stepIndex = {home:0,choose:0,majors:0,focus:1,explore:2,detail:2,market:3,assess:4,portrait:5,structure:5,distance:5,advice:5,gap:5}[stage] ?? 0;
  return `<aside class="sidebar">
    <a class="brand" href="#" data-home aria-label="去向，返回起点"><span class="brand-mark">${Icon("compass")}</span><span>去向<small>CAREER COMPASS</small></span></a>
    <p class="nav-caption">你的职业探索空间</p>
    ${Navigation(tab, "side-nav")}
    <div class="journey"><p class="nav-caption">一段探索，从这里开始</p><ol>${stages.map(([id, label], i) => {
      const enabled = i === 0 || (i <= 2 && hasMajor) || (i <= 4 && hasCareer) || complete;
      return `<li class="${i === stepIndex ? "current" : i < stepIndex ? "passed" : ""}"><button type="button" data-to="${id}" ${enabled ? "" : "disabled"} ${i === stepIndex && tab === "explore" ? 'aria-current="step"' : ""}><span class="step-number">${i < stepIndex ? Icon("check") : `0${i + 1}`}</span>${label}</button></li>`;
    }).join("")}</ol></div>
    <div class="sidebar-note">${Icon("leaf")}<p>专业只是起点，<br>可能性不止一种。</p></div>
    <p class="save-status"><span class="status-dot ${saved ? "" : "warning"}"></span>${saved ? "探索进度保存在此浏览器" : "暂时无法保存，仍可继续探索"}</p>
  </aside>`;
}
export function BottomNav({ tab }) { return Navigation(tab, "bottom-nav"); }

