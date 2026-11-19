# 原创角色资源与生成说明

网站使用的资源：

| 文件 | 显示主题 | 结果规则 |
| --- | --- | --- |
| `src/assets/persona-core.webp` | 灵感伙伴：笔记与笔 | 已测核心能力均分最高 |
| `src/assets/persona-tool.webp` | 造物伙伴：平板与几何模块 | 已测工具能力均分最高 |
| `src/assets/persona-general.webp` | 连接伙伴：连接模块 | 已测通用能力均分最高 |
| `src/assets/persona-explorer.webp` | 启程/探索伙伴：地图 | 已测加分能力均分最高，或并列/低经验时采用中性主题 |

这些角色是原创数字插画，不是人格分类，不借用 MBTI 的人物、配色造型体系或品牌资产。视觉主题由类别分数决定，不推断性别、身份或用户真实外貌。

由内置 imagegen 预生成，透明背景；检查后转为 720×720 的透明 WebP，质量 88、alphaQuality 100，约 52–57KB/张。只作尺寸和格式优化，没有改绘人物内容。运行时不调用 AI。实际动画为 CSS 的轻微呼吸式缩放、浮动和摇摆，prefers-reduced-motion 下关闭；没有眨眼和骨骼动画。

7 种职业物件仍是可编辑矢量：`tools/build-assets.py` 生成对应 SVG。提高了明亮蓝、紫、黄色及珊瑚高光，保留透视、材质渐变、厚度与软投影。网站本地加载资源，无外部素材 URL。

## 本次实际使用的提示词

每张生成请求均使用 `transparent_background: true`，不引用外部人物。下列公共模板中的 SUBJECT 分别替换为下面四条主体说明：

```text
Use case: stylized-concept. Asset type: original website career capability result character, full-body transparent cutout. Create one exquisite original stylized 3D young-adult digital character for the Chinese brand 去向. Subject: SUBJECT Style: refined art-directed soft 3D editorial illustration with sculpted geometry, rounded but not babyish proportions, slight oversized head, realistic matte clay and fabric material, sophisticated studio quality ambient occlusion, soft daylight from upper left. Full body in a three-quarter front standing pose, centered, fully visible shoes and hair, small natural contact shadow, generous transparent margin. Bright luminous colors with white/ivory, charcoal and restrained saturated accent. No background scenery, no text, no logos, no watermark, no emoji appearance, no MBTI or existing character likeness. Designed as a calm approachable adult professional career exploration companion, not a superhero or toy mascot. 1:1 square composition, extremely clean silhouette.
```

### explorer

```text
A gender-neutral young adult digital guide with a warm ivory face, sculpted midnight hair, yellow utility jacket, ivory trousers, blue sneakers, holding a small folded roadmap and looking slightly upward with quiet curiosity.
```

### core

```text
A young adult creative storyteller with warm terracotta skin, sculpted dark curly hair, coral overshirt over ivory tee, lavender trousers, holding a small cream notebook and a blue pen. Calm expressive face, mature creative professional.
```

### tool

```text
A young adult product maker with light warm skin, short sculpted dark hair, fresh blue overshirt, warm cream trousers, holding a lavender tablet and a small yellow geometric module, calm focused face.
```

### general

```text
A young adult collaborative guide with medium warm skin, dark bob haircut, mint jacket, ivory trousers and coral sneakers, holding two softly interlocking blue and yellow geometric pieces; warm, quietly confident expression.
```

图像生成具有非确定性，使用提示词重新生成不能保证得到完全相同的像素。本包已包含实际使用的最终资源，不需要用户重新生成或购买服务。
