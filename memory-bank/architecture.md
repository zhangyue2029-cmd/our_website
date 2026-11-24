# 网站初版架构与回归基线

基线为 master 的 e6faf3c。V2.0 工作使用 v2-development。本页描述已检出的实现。

## 启动与数据流

Node.js 18+ 运行 npm start 后，由本地静态服务器在 127.0.0.1:8124 提供 index.html 和 src 下的资源。浏览器加载原生 CSS 和 JavaScript 模块。入口根据 hash 路由和本地状态调用静态数据访问层，再渲染对应页面。代码中未发现服务器端业务接口、认证、账号存储或生产数据库。当前仓库没有部署工作流，线上托管方式待核实。

## 文件索引

| 路径 | 作用 |
|---|---|
| README.md | 初版启动说明、旧站行为和 V2.0 文档入口。 |
| package.json | 本地启动和两套验证命令。 |
| _server.cjs | 本地 HTTP 静态文件服务器。支持通过 QX_PORT 更换端口。 |
| index.html | 应用容器、样式加载、资源预载、入口模块和加载失败提示。 |
| 启动预览.cmd | Windows 本地启动入口。 |
| src/main.js | 组合页面、加载职业数据、绑定界面事件并协调路由和重绘。 |
| src/types.js | 记录领域数据形状，导出能力分类名称。 |
| src/data/api.js | 对内的异步静态数据访问层。学习方向按所属专业校验，并与专业职业集合取交集。 |
| src/data/categories.js | 两个专业胶囊入口、显示信息及类别到专业映射。 |
| src/data/majors.js | 专业、原始标识和职业关联。 |
| src/data/directions.js | 两个专业各四个学习方向、职业子集和课程参考。 |
| src/data/careers.js | 14 个职业的标识、详情、跨职业连接和位置数据。 |
| src/data/market.js | 初版模拟岗位能力要求和招聘信号。 |
| src/data/questions.js | 职业选择题、选项评分和反馈。 |
| src/data/skills.js | 能力字典及各能力的分类。 |
| src/lib/router.js | 解析及生成 hash 链接，通过浏览器历史恢复路径状态。 |
| src/lib/store.js | 保存状态、订阅更新，校验和维护浏览器本地进度。 |
| src/lib/gap.js | 将旧测评回答转换成能力画像、差距级别和摘要。 |
| src/lib/results.js | 计算旧版能力距离、画像类型及建议。 |
| src/components/CareerMap.js | 根据职业集合生成星系 SVG 连线、动画点、节点按钮和预览。 |
| src/components/GalaxyInteraction.js | 管理星系悬停、聚焦、点选、预览关闭和减少动效。 |
| src/components/chrome.js | 图标、侧栏、移动底栏、步骤和进度提示。 |
| src/components/Persona.js | 选择并渲染旧版职业画像立绘。 |
| src/components/SpatialArt.js | 将职业或主题映射到场景插画及指标组件。 |
| src/components/results.js | 旧版结果导航、雷达图、能力表、距离和建议视图。 |
| src/components/skills.js | 能力卡片、条形图、差距栏目及选择题视图。 |
| src/immersive/view.js | 品牌首页、专业胶囊与共用花朵的 HTML。 |
| src/immersive/controller.js | 控制开场、共享花朵转场、胶囊切换及输入事件。 |
| src/immersive/motion.js | 动画时序、坐标变换和动画资源清理。 |
| src/styles/tokens.css | 颜色、字体、间距和阴影变量。 |
| src/styles/app.css | 全局及基础组件样式，包括星系布局和交互样式。 |
| src/styles/redesign.css | 编辑式布局、空间插画和组件外观调整。 |
| src/styles/structure.css | 学习方向、测评和结果页结构及响应式布局。 |
| src/styles/editorial.css | 杂志式排版、色彩和后续页面的覆盖样式。 |
| src/styles/immersive.css | 品牌首页和专业选择页的沉浸式布局、过渡及响应式样式。 |
| src/assets/bloom-flower.webp | 首屏和专业选择共用的花朵。 |
| src/assets/silhouette-a.webp、silhouette-b.webp、silhouette-c.webp、silhouette-d.webp | 沉浸式场景使用的人物剪影素材。 |
| src/assets/persona-core.webp、persona-explorer.webp、persona-general.webp、persona-tool.webp | 分别用于核心能力、探索、通用能力和工具能力画像。 |
| src/assets/broadcast.svg、film.svg、literature.svg、modules.svg、signal.svg | 麦克风、摄影机、书、模块和信号场景插画。 |
| src/assets/compass.svg、portrait.svg | 指南针和结果主题插画。 |
| tools/build-assets.py | 生成项目中的七张本地立体 SVG 插画。 |
| docs/ACCEPTANCE.md | 初版双专业入口版验收记录。 |
| docs/ROUND2-ACCEPTANCE.md | 第二轮页面和交互调校的验收记录。 |
| docs/BLOOM-ASSETS.md | 花朵素材来源及使用说明。 |
| docs/CHARACTER-ASSETS.md | 人物素材来源及制作说明。 |
| docs/TWO-ENTRIES-PRESERVATION.json | 初版双入口改版的源文件保留清单。 |
| docs/去向_PRD_V2.0.md | V2.0 产品需求与产品验收依据。 |
| memory-bank/design-document.md | V2.0 产品及交互设计。 |
| memory-bank/tech-stack.md | 待审计后确认的技术选型。 |
| memory-bank/implementation-plan.md | 分步开发指令和每步测试。 |
| memory-bank/progress.md | 进度、验证和交接记录。 |
| memory-bank/architecture.md | 现有架构、文件职责和回归基线。 |

## 已恢复的初版测试文件

| 路径 | 作用 |
|---|---|
| tests/smoke.mjs | 覆盖 14 个职业的旧版测评、评分、存储和渲染路径。 |
| tests/immersive.mjs | 验证花朵、胶囊切换、历史中断和减少动效。 |
| tests/selector-flow.mjs | 验证专业入口、学习方向跳转及专业切换时的回答状态。 |
| tests/structure.mjs | 验证方向隔离、页面结构和结果访问条件。 |
| tests/assessment-shell.mjs | 验证选择题的局部重绘及滚动控制。 |
| tests/router.mjs | 验证 hash、浏览器前进后退、路径状态和回答保留。 |
| tests/results.mjs | 验证能力画像、差距算法和结果建议。 |
| tests/galaxy.mjs | 验证星系布局、节点交互、连线强调、关闭及减少动效。 |
| tests/ui-regression.mjs | 验证视图、职业详情标签、资源引用及关联职业切换。 |
| tests/protected-files.mjs | 比对受保护源码的 SHA-256。 |
| tests/protected-hashes.json | 受保护文件的哈希基准。 |
| tests/http-runner.cjs | 启动隔离端口的服务器并执行 HTTP 冒烟。 |
| tests/http-smoke.cjs | 验证首页、模块、样式、素材及静态服务器响应。 |

## 第 2 步审计差异

| 范围 | 处置 | 发现 |
|---|---|---|
| 职业标识与关系 | 保留 | 现有两个专业入口。新闻传播有 11 个职业，汉语言文学有 10 个，两组共享部分职业，合并后有 14 个唯一标识。 |
| 路由与星系 | 保留并调整 | 初版主路径为首页 → 专业胶囊 → 学习领域 → 职业星系 → 详情。按学习领域进入时只展示方向子集，V2.0 新闻传播路径需要展示完整星系并突出所属类别。 |
| 个人状态 | 保留并调整 | 初版把探索状态和答题进度保存在 localStorage 的 quxiang-journey-v1 键。V2.0 需兼顾旧专业行为与新背景档案、报告的权限和持久化。 |
| 测评与招聘 | 调整并新增 | 初版岗位能力要求是示例数据。新闻传播需接入经审核的招聘资料和背景分析，其他专业保留现有测评流程。 |
| 认证、社区、后台 | 新增 | 当前「我的」是本地进度界面。初版没有账号认证、社区、私信或招聘审核后台。 |
| 生产托管 | 待核实 | 已知本地启动方式。线上托管、环境变量和正式服务需在后续选型时核实。 |

### 专业与旧链接

- 汉语言文学（chinese）完整星系标识为 editor、publisher、copywriter、screenwriter、teacher、journalist、content-ops、brand、pm、user-ops。浏览器已验证文学阅读与文本研究（chinese-literature）的三个节点以及旧详情链接 `#/detail?major=chinese&direction=chinese-literature&career=editor`。
- 新闻传播（journalism）完整星系标识为 journalist、editor、new-media、content-ops、brand、pr、video、pm、user-ops、marketing、copywriter。浏览器已验证新闻采访与报道（journalism-reporting）的三个节点以及旧详情链接 `#/detail?category=journalism&major=journalism&direction=journalism-reporting&career=journalist`。
- 无第三个现有专业。跨专业入口展示全部 14 个职业，是独立的聚合视图。

### V2.0 星系增量

新闻传播从学习方向进入星系时，src/main.js 将专业全量职业和当前方向的职业标识传给 CareerMap。星系通过 path-highlight 标记相关节点与连线，src/styles/editorial.css 负责显示强调样式。原有 GalaxyInteraction 仍负责临时悬停、焦点和点选。方向状态沿用现有 hash 和浏览器历史，汉语言文学沿用原方向子集。

### 招聘资料候选层

data/recruitment/journalism-general-v1.json 存放以现有职业标识关联的通用要求种子，状态为待审核。data/recruitment/journalism-sources-v1.json 存放附件来源定位和证据类型。tests/recruitment-seed.mjs 验证职业覆盖、候选状态、来源完整性和行业限定回归。旧站静态服务器只从 index.html 和 src 提供文件，两份种子文件供开发和后续审核使用。

### 招聘候选数据库

- db/recruitment/001_candidate_batches.sql 定义私有候选批次、活动发布版本、审计及前台和分析共用的发布视图。
- tools/recruitment-import.mjs 将种子与来源索引生成 psql 导入语句。
- tests/recruitment-db.sh 通过隔离 PostgreSQL 容器验证导入和权限、审核及版本切换。网站仍通过原静态服务器启动，业务接口尚未连接该数据层。

### 通用招聘资料发布到静态站

db/recruitment/export_active.sql 从活动发布视图导出当前版本，tools/recruitment-export.mjs 将结果生成 src/data/recruitment-reference.js。职业详情仅在新闻传播路径显示该资料，招聘要求可通过 part=recruitment 恢复。站点按代码部署更新快照，数据库回退后需重新导出和部署。

### 访客个人背景

src/components/Background.js 提供表单和交互，src/lib/background-draft.js 管理输入结构、长度、验证和按职业隔离的本地草稿。src/styles/background.css 提供表单布局。background 路由只承载目标职业和原详情标签，填写内容保存在独立本地存储键中。tests/background-draft.mjs 验证草稿规则、URL 隔离和存储失败。
