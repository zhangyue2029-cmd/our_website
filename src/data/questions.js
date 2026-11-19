/**
 * One-question-at-a-time assessment bank.
 * Each question maps to a skill. Scores (0-100) feed the user portrait.
 */
const OPTIONS_EXPERIENCE = [
  { label: "没有", score: 12 },
  { label: "了解过", score: 38 },
  { label: "做过", score: 68 },
  { label: "比较熟悉", score: 88 },
];

const OPTIONS_TOOL = [
  { label: "没有", score: 12 },
  { label: "接触过", score: 40 },
  { label: "可以完成简单任务", score: 66 },
  { label: "可以独立完成", score: 90 },
];

const OPTIONS_FREQ = [
  { label: "几乎没有", score: 14 },
  { label: "偶尔", score: 42 },
  { label: "经常", score: 70 },
  { label: "已经比较习惯", score: 88 },
];

export const questionBank = {
  "user-research": {
    prompt: "你有过用户调研或访谈经历吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["先记下：这块还比较新。", "有概念，就有往前走的起点。", "真实做过，会成为你的底气。", "这项会成为你的明显优势。"],
  },
  "product-design": {
    prompt: "你使用过产品设计或原型工具吗？",
    options: OPTIONS_TOOL,
    feedback: ["工具可以后补，先看清问题更重要。", "接触过就已经比纯想象更进一步。", "能做简单设计，说明你能把想法可视化。", "独立完成设计，会明显缩短协作成本。"],
  },
  "data-analysis": {
    prompt: "你是否做过数据分析，或用数据做过判断？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["数据感可以慢慢练，先建立意识。", "了解过指标，已经迈出第一步。", "做过分析，说明你开始用证据说话。", "熟悉数据会让你的判断更稳。"],
  },
  "product-thinking": {
    prompt: "你有没有把一个模糊问题，拆成可执行方案的经历？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["拆解问题是可以训练的能力。", "你已经开始朝这个方向想了。", "有过完整拆解，会很加分。", "这项会成为你接近产品方向的核心。"],
  },
  communication: {
    prompt: "你是否经常在小组里负责对齐、沟通或推进？",
    options: OPTIONS_FREQ,
    feedback: ["协作可以在项目里慢慢长出来。", "偶尔推进过，已经有感觉。", "经常沟通，是非常可迁移的能力。", "这项会成为你进入很多职业的底座。"],
  },
  "project-mgmt": {
    prompt: "你有没有带过活动、作业项目或实习项目的排期？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["项目管理往往从一次完整经历开始。", "了解过流程，就不陌生。", "带过项目，说明你能对节奏负责。", "这项会让团队更愿意把事交给你。"],
  },
  "ai-tools": {
    prompt: "你在写作、调研或设计里，使用过 AI 工具吗？",
    options: OPTIONS_TOOL,
    feedback: ["AI 是加速器，可以之后补上。", "接触过就比完全没用过更有优势。", "已经能完成简单任务了。", "能独立使用，会成为明显加分。"],
  },
  "info-org": {
    prompt: "你是否经常把零散资料整理成结构清晰的笔记或文档？",
    options: OPTIONS_FREQ,
    feedback: ["信息整理非常适合用项目来练。", "偶尔整理过，已经有方法意识。", "经常做，说明你能降低混乱。", "这项在内容、产品和公关里都很通用。"],
  },
  writing: {
    prompt: "你是否持续进行过面向他人的写作（报道、文案、论文、公众号等）？",
    options: OPTIONS_FREQ,
    feedback: ["写作可以靠主题训练慢慢长。", "有过面向他人的写作，就有基础。", "持续写，会成为你的职业资产。", "表达已经比较稳定了。"],
  },
  interviewing: {
    prompt: "你有过采访、深度提问或正式访谈的经历吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["提问是可以设计的能力。", "了解过访谈方法，就有入口。", "真实做过，现场感会留下来。", "这项会让你在记者和调研里很有底。"],
  },
  "news-sense": {
    prompt: "你是否经常判断“这件事值不值得被更多人知道”？",
    options: OPTIONS_FREQ,
    feedback: ["判断力来自持续看世界。", "你已经开始建立标准。", "经常做判断，说明你有公共意识。", "这项是新闻与公关方向的关键。"],
  },
  editing: {
    prompt: "你有过改稿、校对或帮别人把文章改清楚的经历吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["把关能力可以在改别人文字里练。", "接触过改稿流程了。", "做过完整把关，很有价值。", "这项会直接接到编辑岗位。"],
  },
  "content-planning": {
    prompt: "你是否策划过栏目、选题系列或账号内容节奏？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["策划可以从一个小栏目开始。", "了解过内容节奏，就不陌生。", "做过策划，说明你能看见结构。", "这项会成为内容方向的核心。"],
  },
  "social-ops": {
    prompt: "你运营过社交媒体账号，或负责过互动增长吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["账号可以从低成本实验开始。", "接触过平台机制，已经有感觉。", "真实运营过，经历很珍贵。", "这项和新媒体岗位非常贴近。"],
  },
  "video-edit": {
    prompt: "你使用过视频剪辑工具吗？",
    options: OPTIONS_TOOL,
    feedback: ["剪辑工具可以按项目补。", "接触过就比纯观看更进一步。", "能完成简单成片了。", "独立剪辑会成为视听方向的实力。"],
  },
  "visual-story": {
    prompt: "你有没有用镜头、分镜或画面结构讲过一个故事？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["视觉叙事可以从短视频练习开始。", "了解过结构，就有方法。", "做过完整叙事，很加分。", "这项会让编导方向更清晰。"],
  },
  "brand-strategy": {
    prompt: "你是否梳理过一个品牌/组织“到底想被怎样看见”？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["品牌感可以靠观察和好问题培养。", "想过这个问题，就已经在路上。", "做过梳理，说明你能抓住主张。", "这项接近品牌策划的核心。"],
  },
  "pr-crisis": {
    prompt: "你有没有处理过对外沟通、口径或公共争议相关的事情？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["分寸感可以在案例里学。", "了解过公关逻辑，就有入口。", "有过真实沟通，非常宝贵。", "这项会直接接到公关工作。"],
  },
  "user-ops": {
    prompt: "你是否维护过社群、同学组织或一类用户关系？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["用户经营可以从一个小群开始。", "接触过社群，就有体感。", "真实维护过，会留下方法。", "这项很接近用户运营日常。"],
  },
  marketing: {
    prompt: "你有没有做过推广、招新、活动拉新或效果评估？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["市场动作可以从一次活动开始复盘。", "了解过渠道，已经有概念。", "做过推广，说明你碰过真实反馈。", "这项会接到市场营销方向。"],
  },
  copywriting: {
    prompt: "你写过广告语、活动文案或品牌短句吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["短句训练可以很快起步。", "尝试过就比只写长文更接近岗位。", "做过真实文案，很有说服力。", "这项会成为文案方向的核心。"],
  },
  literary: {
    prompt: "你是否经常判断文本的完成度、风格和节奏？",
    options: OPTIONS_FREQ,
    feedback: ["审美会在大量阅读里变清楚。", "你已经有判断意识。", "经常判断，说明语感稳定。", "这项是文学背景很可迁移的能力。"],
  },
  publishing: {
    prompt: "你了解或参与过从选题到成书/成刊的流程吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["流程知识可以靠项目补上。", "了解过出版链路，就不陌生。", "参与过，会成为难得经历。", "这项很贴近出版编辑。"],
  },
  teaching: {
    prompt: "你有过讲解、辅导或把复杂内容教给别人的经历吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["讲解能力非常适合用模拟课堂练。", "尝试过教学，已经有感觉。", "真实教过，反馈会让你成长。", "这项会直接接到教学与知识讲解。"],
  },
  screenwriting: {
    prompt: "你写过剧本、故事大纲或完整人物关系吗？",
    options: OPTIONS_EXPERIENCE,
    feedback: ["结构可以靠短故事训练。", "接触过大纲方法，就有入口。", "写过完整结构，很有力量。", "这项会成为编剧方向的核心。"],
  },
};

export function questionsForCareer(careerId, skillIds) {
  return skillIds
    .filter((id) => questionBank[id])
    .slice(0, 8)
    .map((skillId, index) => ({
      id: `${careerId}-${skillId}`,
      careerId,
      skillId,
      order: index + 1,
      ...questionBank[skillId],
    }));
}
