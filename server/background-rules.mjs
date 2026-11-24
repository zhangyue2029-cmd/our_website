export const backgroundRuleVersion = "journalism-rules-v1";

const rules = {
  "brand:communication-plan": [["整合传播", "传播方案", "媒介计划"], "为一个校园活动写一页传播方案，列出受众、渠道和发布节奏。"],
  "brand:coordination": [["项目分工", "跨团队协作", "资料审核"], "整理一次项目的分工表，标出自己的职责与交付节点。"],
  "brand:measurement": [["传播复盘", "传播指标", "品牌复盘"], "选一个传播项目，整理目标、可取得的指标和下一轮改进。"],
  "brand:positioning": [["品牌定位", "品牌主张", "受众洞察"], "选一个品牌，写出目标受众、核心主张和支撑该主张的材料。"],
  "content-ops:content-classification": [["内容分类", "内容分层", "内容标签"], "为十篇内容制定分类标签，并说明分类如何帮助检索或分发。"],
  "content-ops:content-supply": [["内容供给", "内容缺口", "消费趋势"], "抽样观察一个栏目，列出常见主题和缺失的受众需求。"],
  "content-ops:distribution-review": [["分发数据", "内容复盘", "内容策略"], "对照两篇内容的分发表现，写出一项可验证的调整。"],
  "content-ops:strategy-sample": [["运营案例", "内容复盘报告", "内容案例"], "整理一份内容案例，说明原目标、调整和观察结果。"],
  "copywriter:brief": [["卖点提炼", "卖点改写", "产品说明", "用户语言"], "把一段产品说明改成三条面向用户的卖点，并解释措辞。"],
  "copywriter:iteration": [["文案复盘", "文案测试", "内容反馈"], "写两版标题，比较受众反馈并记录你会保留的版本。"],
  "copywriter:portfolio": [["文案作品集", "文案样稿", "文案案例"], "整理两种渠道的文案样稿，附上任务、修改过程和结果。"],
  "copywriter:writing": [["活动文案", "广告文案", "宣传文案", "传播稿", "脚本撰写"], "围绕同一活动写一条社媒文案和一段短视频脚本。"],
  "editor:editing": [["文字编辑", "稿件编辑", "编校", "校对", "内容审核"], "选择一篇稿件做结构与文字校改，保留带批注的版本。"],
  "editor:editing-sample": [["编辑样稿", "改稿对照", "编辑前后对照"], "制作一份编辑前后对照稿，并说明三处关键修改。"],
  "editor:layout": [["图文排版", "版面设计", "文稿排版"], "把同一篇稿件排成移动端和纸面两版，解释各自的信息层级。"],
  "editor:planning": [["选题策划", "专题策划", "栏目策划"], "为一个栏目提三个选题，说明预期读者与发布顺序。"],
  "journalist:coordination": [["采访对接", "采访协调", "约访", "采编分工"], "为一次模拟报道列出受访者、分工和截稿节点。"],
  "journalist:multimedia": [["视频剪辑", "音频剪辑", "摄影报道", "图像编辑"], "用照片、音频或短视频制作一份补充文字报道的材料。"],
  "journalist:reporting": [["新闻写作", "采访稿", "新闻采写", "人物采访", "校园采访", "校刊采访"], "完成一次校园人物采访，留存提纲、采访记录和成稿。"],
  "journalist:verification": [["事实核查", "信息核实", "交叉核对", "信源验证"], "选取报道中的三项事实，整理出处并记录交叉核对方法。"],
  "marketing:audience": [["市场调研", "受众调研", "目标人群", "市场细分"], "围绕一个活动访问目标受众，整理他们的需求和决策因素。"],
  "marketing:budget": [["活动预算", "预算管理", "资源排期"], "为一个活动做预算与排期，标出固定成本和可调整项目。"],
  "marketing:campaign": [["整合营销", "营销活动", "渠道投放"], "写一份营销活动方案，说明渠道安排、资源和检验指标。"],
  "marketing:roi": [["投入产出", "营销复盘", "投放复盘", "roi"], "用已有活动数据整理花费、触达和转化，说明数据局限。"],
  "new-media:account-planning": [["账号运营", "发布计划", "内容日历", "选题策划"], "为一个账号设计一周内容日历，标出每项内容的目标受众。"],
  "new-media:analytics": [["运营数据", "互动指标", "传播复盘", "账号复盘"], "整理五条内容的互动数据，并写下两项可以复测的变化。"],
  "new-media:distribution": [["跨平台发布", "内容分发", "平台运营"], "将同一主题改写成两个平台的版本并说明选择理由。"],
  "new-media:production": [["图文制作", "短视频制作", "视频剪辑", "新媒体文案"], "制作一份图文和一条短视频，给出脚本与成品。"],
  "pm:delivery": [["迭代上线", "上线复盘", "研发测试", "验收测试"], "为一次迭代列出交付节点、验收条件和复盘指标。"],
  "pm:discovery": [["用户调研", "需求分析", "需求优先级", "用户访谈"], "访谈三位潜在用户，整理需求和优先级依据。"],
  "pm:measurement": [["产品指标", "假设验证", "产品数据", "ab测试", "a/b测试"], "为一次产品改动写出假设、核心指标和失败判断。"],
  "pm:requirements": [["需求文档", "交互原型", "产品原型", "prd"], "将一个小功能整理成流程图、原型和一页需求说明。"],
  "pr:campaign": [["议题策划", "公关活动", "传播复盘", "发布会策划"], "围绕一个校园活动写出媒体议题、分工和复盘方案。"],
  "pr:media-relations": [["媒体关系", "媒体沟通", "媒体邀请", "采访协调"], "整理一份媒体沟通计划，明确联系人、问题和跟进时点。"],
  "pr:risk-monitoring": [["舆情监测", "舆情分析", "传播风险", "危机公关"], "选择一个公开案例，写出风险信号、通报节点和回应建议。"],
  "pr:writing": [["新闻稿", "公关稿", "公关文案", "传播方案"], "将一份项目材料改写为一篇新闻稿，附上事实来源。"],
  "user-ops:experiments": [["增长实验", "运营实验", "活动复盘", "ab测试", "a/b测试"], "为一次运营活动写出实验目标、对照和结果判断。"],
  "user-ops:funnel-analysis": [["漏斗分析", "转化漏斗", "sql", "用户看板"], "用表格或查询工具画一个转化漏斗，解释流失最多的环节。"],
  "user-ops:lifecycle": [["用户生命周期", "用户留存", "拉新", "促活"], "针对用户的两个生命周期阶段，各写一项运营动作。"],
  "user-ops:segmentation": [["用户分层", "用户画像", "行为分群"], "用一组匿名行为资料划分用户群，说明各群的运营策略。"],
  "video:iteration": [["视频复盘", "完播率", "受众反馈", "传播数据"], "比较两条视频的观看数据，提出一个剪辑或开头改进方案。"],
  "video:portfolio": [["视频作品集", "视频成片", "原创短片"], "选一部成片，与脚本或分镜一起整理，并标明个人职责。"],
  "video:production": [["视频剪辑", "后期制作", "视频拍摄", "短片制作"], "制作一条短片，保留拍摄清单、剪辑稿和最终成片。"],
  "video:storytelling": [["分镜", "视频脚本", "脚本撰写", "短片选题"], "为一条一分钟短片写脚本并画出关键分镜。"],
};

const notEvidence = /尚未|暂未|并未|从未|未曾|没有|没[做学用写掌参接使完]|不会|不熟悉|不懂|不具备|不参与|不涉及|不擅长|无经验|无相关|不了解|未[做学用写掌参接使完]|希望|想学|想尝试|(?:计划|准备)(?:去|做|学|尝试|参加|开展)|打算|待学习|待补充|求教/;
const normalized = text => text.normalize("NFKC").toLowerCase();

function mentions(clause, term) {
  if (!/^[a-z]+$/.test(term)) return clause.includes(term);
  return new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`).test(clause);
}

function evidenceFor(entries, keywords) {
  for (const entry of entries) {
    const clauses = [entry.details, entry.name].flatMap(text => normalized(text).split(/[。！？!?；;\r\n]+/));
    // Prefer omission if a description contains an explicit denial or a future intention.
    for (const keyword of keywords) {
      const candidates = clauses.filter(clause => mentions(clause, keyword));
      if (candidates.length && !candidates.some(clause => notEvidence.test(clause))) {
        return { entryId: entry.id, keyword };
      }
    }
  }
  return null;
}

export function analyzeBackground({ requirements, entries }) {
  const transfer = [];
  const gaps = [];
  const availableActions = [];
  for (const requirement of requirements) {
    const rule = rules[requirement.id];
    if (!rule) continue;
    const [keywords, advice] = rule;
    const evidence = evidenceFor(entries, keywords);
    availableActions.push({ requirementId: requirement.id, text: advice });
    if (evidence) {
      transfer.push({
        requirementId: requirement.id,
        entryId: evidence.entryId,
        text: `填写内容提到「${evidence.keyword}」，可作为这项要求的相关线索。建议补充你的具体职责、做法和成果。`,
      });
    } else {
      gaps.push({ requirementId: requirement.id, text: "填写内容中暂未找到明确线索。若已有相关经历，可补记任务、过程与成果。" });
    }
  }
  const missing = new Set(gaps.map(row => row.requirementId));
  const prioritized = availableActions.filter(row => missing.has(row.requirementId));
  return {
    summary: transfer.length
      ? "部分或全部要求找到了相关经历线索。补充职责和成果，可以让这些线索更容易核对。"
      : "当前描述中暂未找到明确的岗位准备线索。可以补写具体课程任务、项目做法或作品成果，再对照岗位要求。",
    transfer: transfer.slice(0, 4),
    gaps: gaps.slice(0, 5),
    actions: (prioritized.length ? prioritized : availableActions).slice(0, 3),
    rulesVersion: backgroundRuleVersion,
  };
}
