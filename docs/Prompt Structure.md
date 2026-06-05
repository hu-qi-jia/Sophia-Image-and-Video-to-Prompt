# Prompt Structure

# 提示词结构

> 双语结构规范 — 中英对照
> Bilingual structure spec — English / Chinese parallel

***

<!-- ═══════════════════════════════════════════════════════════════════════ -->

# 1. System Setup / 系统设置

# SYSTEM IDENTITY

# 系统身份

<!-- ═══════════════════════════════════════════════════════════════════════ -->

# 2. Core Rules / 核心规则

# CORE RULES (apply to BOTH axes, both phases)

# 核心规则 (适用于两个轴、两个阶段)

- <br />
  1. **Realism Lock (CANONICAL).** / 写实锁定 (规范) — anti-overclean, source is a REAL imperfect photo
- <br />
  1. **Reproduction fidelity over description.** / 复现保真度优先于描述
- <br />
  1. **Match the source honestly.** / 诚实匹配原图
- <br />
  1. **Style-Content Decoupling (CANONICAL).** / 风格-内容解耦 (规范)
- <br />
  1. **Style carries the majority weight, with hard word budget (CANONICAL).** / 风格占多数权重，配硬性字数预算 (规范)
- <br />
  1. **Only state what is visible or strongly implied.** / 只陈述可见或强烈暗示的内容
- <br />
  1. **Viewer-Relative Direction (CANONICAL).** / 以观察者为基准的方位 (规范)
- <br />
  1. **Preserve spatial proportion honestly.** / 诚实保留空间比例
- <br />
  1. **Pose-Anti-Normalization (CANONICAL).** / 姿态反归一化 (规范)
  - 8.1 Conditional sub-rule. / 条件子规则
- <br />
  1. **Subject scale and crop pressure lock.** / 主体比例与裁切压力锁定
- <br />
  1. **Light Contribution filter (CANONICAL).** / 光源贡献过滤器 (规范)

<!-- ═══════════════════════════════════════════════════════════════════════ -->

# 3. Recognition Priority / 识别优先级

# PORTRAIT REPRODUCTION PRIORITY

# 肖像复现优先级

- <br />
  1. Camera viewpoint and pose geometry preserved
- <br />
  1. Identity geometry preserved, imperfections kept
- <br />
  1. Skin render tier preserved
- <br />
  1. Asymmetric pose geometry kept
- <br />
  1. Multi-source light stack applied to face

<!-- ═══════════════════════════════════════════════════════════════════════ -->

# 4. Recognition Methodology / 识别方法论

<!-- ─────────────────────────────────────────────────────────────────────── -->

## 4.1 Style Analysis / 风格分析

# §STYLE ANALYSIS (analysis-phase rules for the style axis)

# §STYLE ANALYSIS (风格轴的分析阶段规则)

- A. **Image-class fields** (always required) / 图像类别字段 (始终必填)
- B. **Optical / lens fields** (always required) / 光学 / 镜头字段
  - B.1 **Focal length quantification** (mandatory) / 焦距量化 (规范) — state mm equivalent with range
  - B.2 **Ultra-wide / 0.5x selfie detection** / 超广角 / 0.5x 自拍检测
- C. **Light stack fields** (always required) / 光源堆叠字段
  - C.1 **Flash-first detection** (canonical pre-pass) / 闪光优先检测 (规范预检)
  - C.2 **Ambient-interior safeguard** / 环境室内保护规则
  - C.3 **Background light detection** / 背景光检测
  - C.4 **Color temperature lock** (mandatory) / 色温锁定 (规范) — K value for every named light
  - C.5 **Low-key / high-key tone lock** (mandatory) / 调性锁定 (规范) — explicitly name the tonal register
- D. **Color & palette fields** (always required) / 色彩与色板字段
  - D.1 **Surface color rule** (CANONICAL) / 表面色规则 (规范)
  - D.2 **Saturation analysis** (mandatory) / 饱和度分析 — global register + per-region map + quantification anchors
  - D.3 **Saturation preservation rule** (CANONICAL) / 饱和度保留规则 (规范)
  - D.4 **AI saturation drift lock** (mandatory) / AI 饱和度漂移锁定 (规范)
- E. **Tone & contrast fields** (always required) / 色调与对比度字段
  - E.1 **Grey density / desaturated midtone lock** (mandatory for muted/film/vintage) / 灰度密度锁定 (规范)
  - E.2 **Contrast quantification** (mandatory) / 对比度量化 (规范)
  - E.3 **Micro-contrast / clarity lock** (mandatory, anti-AI-drift) / 微对比度/清晰度锁定 (规范)
  - E.4 **AI contrast drift lock** (mandatory, paired with D.4) / AI 对比度漂移锁定 (规范)
  - E.5 **Contrast-saturation coupling rule** (mandatory) / 对比度-饱和度耦合规则 (规范)
- F. **Filter & post-processing fields** (always required) / 滤镜与后期字段
  - F.0 **Environment light spill / stain on nearby surfaces** (mandatory) / 环境光溢出与染色 (规范) — light spill onto walls/ceiling/furniture is the real-photo signature
  - F.1 Deliberate softness signature / 刻意柔化签名
  - F.2 **Beauty / retouch — 7-subaxis assessment** (CANONICAL) / 美颜 / 修图 — 7 子轴评估 (规范)
  - F.3 **Banned generic words** (CANONICAL) / 禁用泛词 (规范)
  - F.4 **Over-cleanup drift lock** (mandatory) / 过度净化锁定 (规范) — preserve imperfection layer
  - F.5 **Over-sharpening drift lock** (mandatory) / 过度锐化锁定 (规范) — preserve natural sharpness tier
- G. **Texture / surface fields** (required if surfaces visible) / 纹理 / 表面字段
- H. **Realism register fields** (always required) / 写实度字段
  - H.1 **AI/CGI 2+ tells** (CANONICAL) / AI / CGI 2+ 迹象 (规范)
- I. **Imperfections-as-style fields** (always required) / 不完美即风格字段
- J. **Composition / framing fields** / 构图 / 取景字段
  - J.1 **5-axis camera viewpoint** (CANONICAL) / 5 轴相机视角 (规范)
  - J.2 **Viewpoint-composition binding** (CANONICAL) / 视角-构图绑定 (规范)
  - J.3 **Viewpoint-composition self-check** / 视角-构图自检
- K. **Mood / atmosphere fields** / 氛围 / 情绪字段

<!-- ─────────────────────────────────────────────────────────────────────── -->

## 4.2 Content Analysis / 内容分析

# §CONTENT ANALYSIS (analysis-phase rules for the content axis)

# §CONTENT ANALYSIS (内容轴的分析阶段规则)

- A. **Subject identity** (always required when human subject present) / 主体身份
  - A.0 **Skin tone description** (mandatory) / 肤色描述 — brightness tier + undertone + saturation
  - A.0b **Skin-tone shift / whitening detection** (mandatory for face photos) / 肤色漂移/美白检测
  - A.1 **Ethnicity / regional appearance cues** (CANONICAL) / 种族 / 区域特征 (规范)
  - A.2 Hair / 头发
  - A.3 Face geometry (6 core dimensions) / 面部几何 (6 核心维度)
  - A.4 Distinctive features (mandatory preservation) / 标志性特征
- B. **Subject body** (always required) / 主体身体
  - Dimensions: silhouette, proportion landmarks, body fat distribution, body fullness / volume distribution, muscle tone / 维度：轮廓、比例标志、体脂分布、身体饱满度/体积分布、肌肉线条
  - B.1 **Body proportion lock** (mandatory when body shape visible) / 身体比例锁定
  - B.2 **Standing body-curve lock** (mandatory for fitted clothing / visible silhouette curves) / 站姿身体曲线锁定
- C. **Subject expression** (always required when face visible) / 主体表情
  - C.1 **7-channel expression signature** (CANONICAL) / 7 通道表情签名 (规范)
- D. **Subject pose** (mandatory concrete values — camera azimuth/pitch are STYLE dimensions in §STYLE ANALYSIS J) / 主体姿态 (相机方位角/俯仰角属于风格维度，见 §STYLE ANALYSIS J)
  - D.1 **Action-chain lock** (mandatory for hands/props/furniture) / 动作链锁定
- E. **Subject clothing** (7-axis expansion) / 主体服装
- F. **Subject accessories** / 主体配饰
- G. **Subject makeup & styling** (always required when face visible) / 主体妆造
  - Dimensions: makeup style, foundation, eye makeup, lip, contour/highlight/blush, nail style / 维度：妆容风格、粉底、眼妆、唇妆、修容/高光/腮红、美甲
  - Styling coordination: color harmony, palette vs outfit, brow vs hair, liner vs occasion / 妆造协调性：色彩呼应、眼影与服装、眉色与发色、眼线与场合
  - G.1 **MAKEUP RETENTION** (CANONICAL) / 妆容保留 (规范)
- H. **Material surfaces** (required when materials present) / 材质表面
  - H.1 Direct-flash surface response → **ref §BOUND ANALYSIS** (bound feature, not re-stated here) / 直闪表面反应 → 引用 §BOUND ANALYSIS (桥接特征，此处不重复)
- I. **Spatial relationships** (always required unless studio backdrops) / 空间关系
- J. **Environment** (required unless pure studio backdrops) / 环境
- K. **Imperfections** (always required when imperfections contribute to content) / 不完美

<!-- ─────────────────────────────────────────────────────────────────────── -->

## 4.3 Bound Features Note / 绑定特征说明

# §BOUND ANALYSIS (analysis-phase rules for the style × content bridge)

# §BOUND ANALYSIS (风格 × 内容桥接的分析阶段规则)

- BOUND FEATURES / 绑定特征
  - Bridge module between STYLE and CONTENT / 风格与内容之间的桥接模块
  - Required in the full output, excluded from styleText / contentText views / 全量输出必填，分视图 (styleText / contentText) 排除
  - Empty state: 'none — no subject-bound style features observed in this image' / 空状态
  - Categories (not exhaustive) / 类别 (非穷举):
    - Light on subject: rim, specular, shadow, catchlight / 光在人物上
    - Subject-to-environment exposure relationship / 人物与环境曝光关系
    - Object-dependent reflections / 物体依赖的反射
    - Pose-environment dependencies / 姿势-环境依赖
    - Localized motion blur / 局部运动模糊
    - Skin-light interaction / 皮肤-光线交互
    - **Direct-flash surface response** (canonical — from §CONTENT ANALYSIS H.1) / 直闪表面反应 (规范)
    - Subject-to-adjacent-object color bleed / contamination / 人物与相邻物体的颜色溢出

<!-- ═══════════════════════════════════════════════════════════════════════ -->

# 5. Output Format Specification / 输出格式规范

<!-- ─────────────────────────────────────────────────────────────────────── -->

## 5.1 General Rules / 通用规则

# §OUTPUT FORMAT + §OUTPUT RULES

# §OUTPUT FORMAT + §OUTPUT RULES

- All output in English only / 全英文输出
- Each \[TAG] on its own line / 每个 \[TAG] 单独一行
- Be concrete and specific / 具体且精确
- Use negation to prevent errors / 用否定句预防错误
- Only skip CONDITIONAL / OPTIONAL tags when not applicable / 不适用时才跳过条件 / 可选 TAG
- Output is a single continuous text / 输出为单段连续文本

<!-- ─────────────────────────────────────────────────────────────────────── -->

## 5.2 Style Description Module / 风格描述模块

# §STYLE OUTPUT (output-phase specs for the 19 style-axis \[TAG]s)

# §STYLE OUTPUT (风格轴 19 个 \[TAG] 的输出阶段规范)

# Refs: §STYLE ANALYSIS

1. `[ARCHETYPE]` / 图像原型
2. `[STYLE FINGERPRINT]` (30-45 words, hard cap 50) / 风格指纹 — defines archetype, realism register, quality tier
3. `[AESTHETIC HOOK]` (ref: §STYLE OUTPUT 2) / 美学钩子 — 1-2 most distinctive visual hooks, NO repeat of realism/quality tier
4. `[VISUAL PRIORITY]` (refs §STYLE OUTPUT 2, §STYLE OUTPUT 3) / 视觉优先级 — first 5 items HARD BAN on content controls
5. `[LIGHTING]` (ref: §STYLE ANALYSIS C, C.4 color temperature lock, C.2 ambient-interior safeguard) / 光照
6. `[SHADOW GEOMETRY]` (ref: §STYLE ANALYSIS I + C) / 阴影几何
7. `[LOOK PIPELINE]` (ref: §STYLE ANALYSIS D, D.2 saturation analysis, E, E.4 AI contrast drift lock, E.5 contrast-saturation coupling, F, F.0 environment light spill, F.4 over-cleanup lock) / 视觉管线
8. `[TONAL DISTRIBUTION]` (ref: §STYLE ANALYSIS E, E.1 grey density, E.2 contrast quantification, E.4 AI contrast drift lock, E.5 contrast-saturation coupling, C.5 low-key/high-key tone lock) / 色调分布
9. `[OPTICAL DEPTH]` (ref: §STYLE ANALYSIS B) / 光学景深
10. `[STYLE & TEXTURE]` (ref: §STYLE ANALYSIS G, E.3 micro-contrast/clarity lock, E.1 grey density, F.2, F.3, F.4 over-cleanup lock, F.5 over-sharpening lock, H) / 风格与质感
11. `[SKIN RENDER]` (ref: §STYLE ANALYSIS G, §CONTENT OUTPUT 1 identity boundary) / 皮肤渲染
12. `[FRAME]` (ref: §STYLE ANALYSIS J, J.0 spatial structure lock, B, I) / 框架
13. `[COMPOSITION]` (ref: §STYLE ANALYSIS J.2, J.3, K) / 构图
14. `[ATMOSPHERE]` (CONDITIONAL — skip for product-on-white) / 氛围
15. `[SNAPSHOT FEEL]` (OPTIONAL — for imperfect framing) / 快照感
16. `[ERA SIGNALS]` (OPTIONAL — for clear period aesthetics) / 时代信号
17. `[PROMPT TAGS]` / 提示词标签
18. `[GENERATION CUES]` (ref: §STYLE ANALYSIS C, D, F.2, J) / 生成线索
19. `[NEGATIVE PROMPT]` / 否定提示词

<!-- ─────────────────────────────────────────────────────────────────────── -->

## 5.3 Content Description Module / 内容描述模块

# §CONTENT OUTPUT (output-phase specs for the 6 content-axis \[TAG]s)

# §CONTENT OUTPUT (内容轴 6 个 \[TAG] 的输出阶段规范)

# Refs: §CONTENT ANALYSIS

1. `[SUBJECT 1..N]` (ref: §CONTENT ANALYSIS A, A.0 skin tone, A.0b shift, B, C, D, E, F, G) / 主体
   - Skin tone mandatory: brightness tier + undertone + saturation per §CONTENT ANALYSIS A.0; F.2 whitening shift per A.0b / 肤色必填：亮度档+色温+饱和度
   - Body proportion and volume per §CONTENT ANALYSIS B; for female subjects, body fullness may lean slightly fuller / 身体比例与体积；女性身材饱满度可微偏饱满方向
2. `[MATERIAL RESPONSE]` (OPTIONAL — ref: §CONTENT ANALYSIS H) / 材质反应
3. `[SPATIAL LAYERS]` (CONDITIONAL — ref: §CONTENT ANALYSIS I; 5-10 anchors + frame coverage) / 空间层
4. `[ENVIRONMENT]` (CONDITIONAL — ref: §CONTENT ANALYSIS J) / 环境
5. `[IMPERFECTIONS & PHYSICS]` (ref: §CONTENT ANALYSIS K, §STYLE ANALYSIS I) / 不完美与物理
6. `[CONSTRAINTS]` (ref: §CONTENT ANALYSIS G.1, §CORE RULE 0, 8, 10, §STYLE ANALYSIS C, J) / 约束

<!-- ─────────────────────────────────────────────────────────────────────── -->

## 5.4 Bridge Module / 桥接模块

# §BOUND OUTPUT (output-phase spec for the 1 bridge \[TAG])

# §BOUND OUTPUT (1 个桥接 \[TAG] 的输出阶段规范)

# Refs: §BOUND ANALYSIS

1. `[BOUND FEATURES]` (ref: §BOUND ANALYSIS) / 绑定特征

<!-- ═══════════════════════════════════════════════════════════════════════ -->

# 6. Output Self-Check / 输出自检

# §OUTPUT QUALITY VALIDATION

# §OUTPUT QUALITY VALIDATION

- <br />
  1. **Completeness Check** / 完整性检查 — all required tags present, no empty required tags
- <br />
  1. **Consistency Check** / 一致性检查 — no contradictory claims
- <br />
  1. **Decoupling Check** / 解耦检查 — STYLE OUTPUT contains no identity specifics; CONTENT OUTPUT contains no rendering language
- <br />
  1. **Accuracy Check** / 准确性检查 — focal length, lighting direction, shadow direction, DOF match visible evidence
- <br />
  1. **Anti-Hallucination Check** / 反幻觉检查 — no invisible subjects, colors, or equipment
- <br />
  1. **Output Format Check** / 输出格式检查 — each tag on its own line with \[BRACKETS]
- <br />
  1. **MODULE OUTPUT ORDER** / 模块输出顺序

***

# Appendix: Layout Map / 附录：结构映射

# 附录：分析端 × 输出端，风格 × 内容 双轴分离

```
┌─────────────────────────────────────────────────────────────┐
│  §CANONICAL POINTERS                  (元规则：单一来源)      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────── 分析端 (Analysis) ─────────────────────┐
│ §STYLE  ANALYSIS  ─── §CONTENT ANALYSIS ── §BOUND ANALYSIS │  ← 风格/内容物理分轴
│ (分析阶段要看哪些      (分析阶段要看哪些      (桥接规则)     │     (4 块)
│  风格维度)              内容维度)                          │
└─────────────────────────┬────────────────────────────────────┘
                       ref 引用
                          ↓
┌─────────────────── 输出端 (Output) ───────────────────────┐
│ §STYLE  OUTPUT 19 TAG ── §CONTENT OUTPUT 6 TAG ─ §BOUND 1  │  ← 风格/内容物理分轴
│ (19 个 [TAG] 的          (6 个 [TAG] 的         (1 TAG)    │     (3 块)
│  输出格式规范)            输出格式规范)                    │
└─────────────────────────────────────────────────────────────┘
```

# Key Invariants / 关键不变量

- **Single source of truth** / 单一真实来源 — Each rule lives in EXACTLY ONE place (analysis OR output, style OR content). / 每条规则只在一个地方出现
- **Cross-references via** **`ref:`** / 跨块引用 — Every \[TAG] output spec references analysis rules via `(ref: §STYLE ANALYSIS X)` and does NOT re-state them. / 每个 \[TAG] 通过 ref 引用分析规则，不重复
- **Style-Content axis split** / 风格-内容轴分离 — STYLE 块 (§STYLE ANALYSIS + §STYLE OUTPUT) 在文件上半部，CONTENT 块 (§CONTENT ANALYSIS + §CONTENT OUTPUT) 在下半部。/ 物理分轴
- **Triple-lock protocol** / 三处锁定 — 5-axis azimuth + pitch values MUST appear identically in §STYLE OUTPUT \[FRAME], §CONTENT OUTPUT \[SUBJECT 1] pose, and §STYLE OUTPUT \[GENERATION CUES]. / 三处数值一致
- **Bridge-only crossover** / 桥接唯一切点 — The only allowed style×content crossover is §BOUND OUTPUT \[BOUND FEATURES]; all other axes stay pure. / 唯一交叉点在 BOUND

