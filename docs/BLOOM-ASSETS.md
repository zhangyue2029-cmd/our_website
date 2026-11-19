> 当前范围：第二页仅汉语言文学与新闻传播两个原有入口；下方为素材制作记录，不代表额外开放专业数据。

# Bloom / Silhouette · 素材与提示词

使用内置 imagegen 预生成，所有请求设置 transparent_background=true。网站运行时只读取随包交付的本地WebP，不接入AI服务。未复制参考视频中的人物或花朵素材。

花朵800×800，摄影式剪影700×900；只进行缩放、透明补边及WebP格式优化（quality 90、alphaQuality 100），不改绘人物内容。前两页不使用结果页的3D卡通伙伴。

4组剪影轮廓在13门类间复用，以姿态与光晕区分，不暗示个人身份、性格或专业能力。完整花朵贴图在三个视觉层复用，使用比例和方向产生层次，不宣称逐瓣三维建模。

## 花朵实际提示词

```text
Use case: stylized-concept. Asset type: transparent website hero flower, reusable and layered in animation. One exquisite large sculptural flower with seven broad ruffled translucent petals, asymmetric organic open bloom, viewed almost face-on at slight three-quarter angle. Iridescent silk-organza and thin luminous glass material, pale lavender, lilac, warm peach and icy periwinkle edges, subtle subsurface light and naturally folded dimensional petal surfaces. Elegant editorial botanical art, realistic high-end macro studio render with detailed light transmission, actual flower structure and depth, not a radial gradient or icon. No stem, no leaves, no vase, no person, no text, no logo, no backdrop. Entire flower fully within square composition with 10% transparent margins and separated irregular petal silhouette. Isolated on a genuinely transparent background. Professional creative studio campaign aesthetic, not cartoon.
```

## 人物公共提示词

将 SUBJECT 替换为下列每张素材的主体说明：

```text
Use case: photorealistic-natural. Asset type: transparent cinematic editorial human silhouette for a website. Subject: SUBJECT Photograph of a real-looking anonymous human, not a named person. Frame from above the entire hair outline down to lower chest/upper torso, realistic adult anatomy and skin/hair silhouette. Subject rendered nearly black charcoal, facial interior intentionally in deep shadow with only tiny subtle neutral edge light describing the real nose and neck; preserve delicate photographic hair edges. High-end studio silhouette photography, crisp sharp silhouette with no glow baked into the outline. Portrait orientation, entire head and both shoulder ends fully contained with generous transparent margins, flat lower crop across chest. No glasses, no jewelry, no props, no occupational costume, no cartoon, no drawing, no flat vector, no 3D character, no halo, no text or watermark. Isolated on genuine transparency, absolutely no colored or white background. Must be a sophisticated photographic shadow, not a faceless icon.
```

### src/assets/silhouette-a.webp

```text
A young adult person in exact side profile facing right, naturally curly short hair and unadorned dark crewneck, head slightly lifted; clear forehead, nose bridge, lips, jawline, long natural neck and relaxed shoulders.
```

### src/assets/silhouette-b.webp

```text
A young adult person in left-facing side profile with loosely tied-up hair and a few fine flyaway strands, unadorned dark crewneck, calm natural posture; clear forehead, nose, lips, chin, neck and shoulders.
```

### src/assets/silhouette-c.webp

```text
An adult person with cropped textured hair in right-facing three-quarter profile, gaze level, relaxed chin and shoulders, unadorned dark collarless top, mature natural human proportions.
```

### src/assets/silhouette-d.webp

```text
An adult person with shoulder-length natural wavy hair in left-facing three-quarter profile, subtly lifted chin, unadorned dark top, mature natural head, neck and shoulder anatomy.
```

图像生成不具有像素级确定性。本项目已包含最终使用的素材，不需要用户重新生成。

