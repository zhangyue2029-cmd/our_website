/**
 * Market skill requirements — mock of:
 * job posts → duties → requirements → skill keywords → frequency → importance
 * Replace this file (or the api layer) when real recruitment data arrives.
 */
export const marketRequirements = [
  // 产品经理
  { careerId: "pm", skillId: "product-thinking", importance: 5, why: "岗位需要把模糊需求翻译成可执行的产品方向，而不是只收集意见。" },
  { careerId: "pm", skillId: "user-research", importance: 4, why: "招聘描述里经常出现用户调研、需求访谈和场景拆解。" },
  { careerId: "pm", skillId: "project-mgmt", importance: 4, why: "产品经理要推动设计、研发、运营按节奏交付。" },
  { careerId: "pm", skillId: "communication", importance: 5, why: "大量岗位把跨部门沟通、对齐目标写进任职要求。" },
  { careerId: "pm", skillId: "data-analysis", importance: 3, why: "企业越来越要求用数据判断优先级和效果，而不是凭感觉。" },
  { careerId: "pm", skillId: "product-design", importance: 4, why: "需要能把方案落到流程、原型和交互逻辑上。" },
  { careerId: "pm", skillId: "ai-tools", importance: 3, why: "加分项：能用 AI 提高调研、文档和原型效率。" },
  { careerId: "pm", skillId: "info-org", importance: 4, why: "要把零散反馈整理成问题清单和决策依据。" },

  { careerId: "journalist", skillId: "interviewing", importance: 5, why: "记者岗位的核心是提问、核实和拿到关键信息。" },
  { careerId: "journalist", skillId: "news-sense", importance: 5, why: "企业要能判断什么值得被公众看见。" },
  { careerId: "journalist", skillId: "writing", importance: 5, why: "几乎所有相关岗位都要求清晰、准确的书面表达。" },
  { careerId: "journalist", skillId: "communication", importance: 4, why: "采访对象、编辑和团队协作贯穿日常。" },
  { careerId: "journalist", skillId: "info-org", importance: 4, why: "需要把复杂材料压成可读结构。" },
  { careerId: "journalist", skillId: "video-edit", importance: 3, why: "融合媒体岗位越来越要求基础视听能力。" },
  { careerId: "journalist", skillId: "ai-tools", importance: 2, why: "检索、转写和初稿辅助正在成为加分项。" },

  { careerId: "editor", skillId: "editing", importance: 5, why: "编辑的核心是判断稿件质量和把关风险。" },
  { careerId: "editor", skillId: "writing", importance: 4, why: "改稿本身就是高强度的语言工作。" },
  { careerId: "editor", skillId: "content-planning", importance: 4, why: "岗位要求能组选题、排栏目，而不只是改句子。" },
  { careerId: "editor", skillId: "info-org", importance: 5, why: "要把作者意图、读者路径和发布时间排清楚。" },
  { careerId: "editor", skillId: "communication", importance: 4, why: "需要持续对接作者、设计和渠道。" },
  { careerId: "editor", skillId: "literary", importance: 3, why: "文本审美帮助判断完成度和风格。" },
  { careerId: "editor", skillId: "ai-tools", importance: 2, why: "辅助校对和资料整理是加分项。" },

  { careerId: "new-media", skillId: "content-planning", importance: 5, why: "账号运营首先是内容节奏和选题系统。" },
  { careerId: "new-media", skillId: "social-ops", importance: 5, why: "招聘高频出现平台规则、互动和增长相关要求。" },
  { careerId: "new-media", skillId: "writing", importance: 4, why: "标题、正文和评论区都需要稳定表达。" },
  { careerId: "new-media", skillId: "data-analysis", importance: 3, why: "需要看播放、完播和互动，调整内容。" },
  { careerId: "new-media", skillId: "video-edit", importance: 3, why: "短视频账号普遍要求基础制作能力。" },
  { careerId: "new-media", skillId: "ai-tools", importance: 3, why: "选题、封面和初稿辅助越来越常见。" },
  { careerId: "new-media", skillId: "communication", importance: 3, why: "要协同拍摄、设计和投放。" },

  { careerId: "content-ops", skillId: "content-planning", importance: 5, why: "内容运营要把供给做成可持续的系统。" },
  { careerId: "content-ops", skillId: "user-research", importance: 4, why: "内容必须接到用户路径，而不是自嗨生产。" },
  { careerId: "content-ops", skillId: "data-analysis", importance: 4, why: "岗位描述常要求看转化、留存和内容效果。" },
  { careerId: "content-ops", skillId: "writing", importance: 3, why: "仍需要判断文本质量和调性。" },
  { careerId: "content-ops", skillId: "project-mgmt", importance: 4, why: "要排期、约稿、协同多个生产方。" },
  { careerId: "content-ops", skillId: "communication", importance: 4, why: "连接产品、设计和创作者。" },
  { careerId: "content-ops", skillId: "ai-tools", importance: 3, why: "提高内容生产和复盘效率。" },

  { careerId: "brand", skillId: "brand-strategy", importance: 5, why: "品牌策划要先说清楚“我们是谁”，再设计动作。" },
  { careerId: "brand", skillId: "copywriting", importance: 4, why: "主张最终要落到可传播的语言。" },
  { careerId: "brand", skillId: "content-planning", importance: 4, why: "战役需要主题、节奏和媒介组合。" },
  { careerId: "brand", skillId: "communication", importance: 4, why: "要协同创意、媒介、业务多方。" },
  { careerId: "brand", skillId: "marketing", importance: 3, why: "品牌动作越来越需要和市场结果对齐。" },
  { careerId: "brand", skillId: "info-org", importance: 3, why: "需要整理竞品、用户感知和品牌资产。" },
  { careerId: "brand", skillId: "ai-tools", importance: 2, why: "资料扫描和初稿辅助为加分项。" },

  { careerId: "pr", skillId: "pr-crisis", importance: 5, why: "公关岗位把口径、风险和对外沟通放在核心位置。" },
  { careerId: "pr", skillId: "writing", importance: 4, why: "新闻稿、声明和内部 briefing 都是日常。" },
  { careerId: "pr", skillId: "communication", importance: 5, why: "维护媒体与利益相关方关系是高频要求。" },
  { careerId: "pr", skillId: "news-sense", importance: 4, why: "要判断议题何时适合被公开讨论。" },
  { careerId: "pr", skillId: "info-org", importance: 4, why: "危机时需要迅速整理事实和时间线。" },
  { careerId: "pr", skillId: "brand-strategy", importance: 3, why: "对外表达必须服务品牌长期感知。" },

  { careerId: "video", skillId: "visual-story", importance: 5, why: "编导首先要会用镜头讲完一件事。" },
  { careerId: "video", skillId: "video-edit", importance: 4, why: "多数岗位要求理解剪辑节奏，甚至能上手。" },
  { careerId: "video", skillId: "content-planning", importance: 4, why: "需要先想清楚结构和信息优先级。" },
  { careerId: "video", skillId: "project-mgmt", importance: 4, why: "现场和后期都依赖排期与协同。" },
  { careerId: "video", skillId: "communication", importance: 4, why: "要对齐导演、出镜者和品牌方。" },
  { careerId: "video", skillId: "writing", importance: 3, why: "脚本和字幕仍是基本功。" },
  { careerId: "video", skillId: "ai-tools", importance: 2, why: "字幕、粗剪辅助正在出现在任职加分里。" },

  { careerId: "user-ops", skillId: "user-ops", importance: 5, why: "岗位核心是分层经营用户，而不是一次性活动。" },
  { careerId: "user-ops", skillId: "user-research", importance: 4, why: "要理解不同用户为什么留下或离开。" },
  { careerId: "user-ops", skillId: "communication", importance: 4, why: "社群、客服和跨部门协同很重。" },
  { careerId: "user-ops", skillId: "data-analysis", importance: 4, why: "留存、活跃和转化是常见考核语言。" },
  { careerId: "user-ops", skillId: "content-planning", importance: 3, why: "运营动作常常通过内容触达。" },
  { careerId: "user-ops", skillId: "project-mgmt", importance: 3, why: "活动与节奏需要被排进日历。" },
  { careerId: "user-ops", skillId: "ai-tools", importance: 2, why: "用户洞察整理和文案辅助为加分。" },

  { careerId: "marketing", skillId: "marketing", importance: 5, why: "市场岗要把人群、渠道和动作连成可执行计划。" },
  { careerId: "marketing", skillId: "data-analysis", importance: 4, why: "效果评估几乎写进每一份相关 JD。" },
  { careerId: "marketing", skillId: "brand-strategy", importance: 3, why: "增长动作仍需服务品牌一致性。" },
  { careerId: "marketing", skillId: "copywriting", importance: 3, why: "投放物料需要可点击的语言。" },
  { careerId: "marketing", skillId: "communication", importance: 4, why: "要协同代理、设计和销售。" },
  { careerId: "marketing", skillId: "content-planning", importance: 3, why: "内容是很多市场动作的载体。" },
  { careerId: "marketing", skillId: "ai-tools", importance: 3, why: "素材生产和数据分析辅助逐渐成为加分。" },

  { careerId: "publisher", skillId: "editing", importance: 5, why: "出版编辑的核心仍是长文本判断与改稿。" },
  { careerId: "publisher", skillId: "publishing", importance: 5, why: "需要理解从选题到印制发行的流程。" },
  { careerId: "publisher", skillId: "literary", importance: 4, why: "审美决定一本书值不值得被做成产品。" },
  { careerId: "publisher", skillId: "project-mgmt", importance: 4, why: "一本书是一个周期很长的项目。" },
  { careerId: "publisher", skillId: "communication", importance: 4, why: "作者、设计、印厂都需要被连接。" },
  { careerId: "publisher", skillId: "info-org", importance: 4, why: "书稿版本和意见必须被管理。" },
  { careerId: "publisher", skillId: "writing", importance: 3, why: "推荐语、简介和沟通文本仍常出现。" },

  { careerId: "copywriter", skillId: "copywriting", importance: 5, why: "文案策划首先要会写出可传播、可转化的句子。" },
  { careerId: "copywriter", skillId: "brand-strategy", importance: 4, why: "语气必须接到品牌主张，而不是炫技。" },
  { careerId: "copywriter", skillId: "writing", importance: 5, why: "语言基本功是门槛。" },
  { careerId: "copywriter", skillId: "literary", importance: 3, why: "审美帮助控制分寸和风格。" },
  { careerId: "copywriter", skillId: "communication", importance: 3, why: "需要消化策略简报并和设计对齐。" },
  { careerId: "copywriter", skillId: "content-planning", importance: 3, why: "战役文案通常按系列出现。" },
  { careerId: "copywriter", skillId: "ai-tools", importance: 3, why: "发散和改写辅助正在被写进加分项。" },

  { careerId: "screenwriter", skillId: "screenwriting", importance: 5, why: "编剧岗位看重结构、冲突和人物动机。" },
  { careerId: "screenwriter", skillId: "writing", importance: 5, why: "对白和场面最终都要落在文字上。" },
  { careerId: "screenwriter", skillId: "literary", importance: 4, why: "文本感受力决定人物是否可信。" },
  { careerId: "screenwriter", skillId: "visual-story", importance: 4, why: "剧本要能被拍摄，而不只是被阅读。" },
  { careerId: "screenwriter", skillId: "communication", importance: 3, why: "改稿过程高度依赖协作。" },
  { careerId: "screenwriter", skillId: "info-org", importance: 3, why: "人物小传、大纲和场次需要被管理。" },

  { careerId: "teacher", skillId: "teaching", importance: 5, why: "核心是让学习者真的跟上，而不是自己讲得很精彩。" },
  { careerId: "teacher", skillId: "literary", importance: 4, why: "语文教学建立在文本理解之上。" },
  { careerId: "teacher", skillId: "communication", importance: 5, why: "课堂、家长沟通和团队教研都需要表达。" },
  { careerId: "teacher", skillId: "info-org", importance: 4, why: "要把知识拆成路径和练习。" },
  { careerId: "teacher", skillId: "writing", importance: 3, why: "教案、评语和讲解文本是日常。" },
  { careerId: "teacher", skillId: "content-planning", importance: 3, why: "课程本身就是一套内容结构。" },
];

export const jobSignals = [
  {
    careerId: "pm",
    skillId: "data-analysis",
    companyType: "内容平台",
    snippet: "能独立完成数据复盘，用指标判断功能优先级，而不是只凭经验拍板。",
  },
  {
    careerId: "pm",
    skillId: "user-research",
    companyType: "互联网公司",
    snippet: "负责用户访谈与需求洞察，输出清晰的问题定义和产品方案。",
  },
  {
    careerId: "pm",
    skillId: "product-thinking",
    companyType: "教育科技",
    snippet: "从业务目标出发拆解用户路径，完成需求文档并推动上线。",
  },
  {
    careerId: "journalist",
    skillId: "interviewing",
    companyType: "媒体机构",
    snippet: "具备独立采访能力，能完成信息核实与成稿。",
  },
  {
    careerId: "new-media",
    skillId: "social-ops",
    companyType: "品牌新媒体",
    snippet: "熟悉主流平台内容机制，能规划账号内容并提升互动。",
  },
  {
    careerId: "editor",
    skillId: "editing",
    companyType: "内容平台",
    snippet: "负责稿件筛选、结构优化与发布把关。",
  },
];

export function requirementsForCareer(careerId) {
  return marketRequirements.filter((r) => r.careerId === careerId);
}

export function signalsForSkill(careerId, skillId) {
  return jobSignals.filter((s) => s.careerId === careerId && s.skillId === skillId);
}
