# 图片提示词结构重构计划

> 日期：2026-06-02
> 状态：进行中
> 范围：`src/lib/prompts/portrait.ts` + `src/lib/parsers/imageResponse.ts` + `docs/Prompt Structure.md`

---

## 1. 背景与问题

### 1.1 原始痛点

用户提供原图（`docs/1.jpg`）和基于该图提取的提示词生成的图（`docs/2.png`），发现：

- **人物姿势与原图差异大**（侧脸变正脸、坐姿变站姿、扭转变挺直）
- **画面整体呈现失真**（景别、视角、人物占比变化大）
- 提示词结构混乱，规则和字段说明交叉分散

### 1.2 现有规则分析（基于 `image.ts`）

| 维度 | 评估 |
|---|---|
| 姿势反归一化 | ❌ 缺失，LLM 自由发挥导致侧脸/扭转/坐姿等被标准化为正面站姿 |
| 风格/内容解耦 | ⚠️ 原则层有（CORE RULES 3/5/10），但执行层因"绑定内容"无独立模块而出现污染 |
| 风格识别规则 | ✅ 完整：STYLE FIELD ENUMERATION（A-K 11 类）+ VOCABULARY CATALOG（6 类） |
| 内容识别规则 | ❌ 不对称：内容字段说明散落在 [SUBJECT 1]、[ENVIRONMENT] 等模块内，无独立 checklist |
| 词汇参考库 | ⚠️ 效果存疑：6 类采样词典对 LLM 提升有限，占用大量 tokens |
| 绑定内容处理 | ⚠️ 用"两边各写一句"的规则，无独立模块，LLM 容易漏写或重复 |
| 提示词结构 | ⚠️ section header 命名/层级混乱，曾尝试中文化后回滚 |

---

## 2. 改造目标

1. **解决姿势失真**：通过反归一化规则 + 具体数值化描述，让 LLM 输出可重建的姿势指令
2. **建立风格/内容对称结构**：内容侧补齐 CONTENT FIELD ENUMERATION（A-K 11 类）
3. **抽出绑定内容独立模块**：避免 STYLE/CONTENT 相互污染
4. **精简指令长度**：砍掉效果存疑的 VOCABULARY CATALOG，替换为反泛词约束
5. **规范文档结构**：`Prompt Structure.md` 与 `image.ts` 标题字段保持同步

---

## 3. 已完成

### 3.1 姿势与画面呈现优化（已合并到 `image.ts`）

| 改动点 | 说明 |
|---|---|
| CORE RULES 11-14 | 新增 4 条规则：姿势/构图为 STYLE 级控制、姿势反归一化、主体尺度锁定、视角保留 |
| PORTRAIT REPRODUCTION PRIORITY 0 号升级 | 提升"相机视角与姿势几何"为最高优先级，明确反归一化约束 |
| [POSE AND POSTURE] 重写 | 强制 10 项具体数值：站姿、相机方位、头部转角、身体扭转、脊柱、肩高、四肢、手位、重心 |
| [NEGATIVE PROMPT] 姿势反归一化 | 新增"姿势反归一化"分类，明确禁止把背面/侧面/斜角标准化为正面 |
| STYLE FIELD ENUMERATION E+H 合并 | "色调对比"和"真实感寄存器"合并为单一枚举项（消除重复字段） |
| STYLE VOCABULARY CATALOG 13→6 | 风格词汇库从 13 类压缩到 6 类 |
| 【风格特征摘要】字数调整 | 总字数、布光、调色、物料配色等字数限制放宽 |

### 3.2 Prompt Structure.md 更新（本次）

- ✅ 填充所有 section header 标题
- ✅ 新增 CONTENT FIELD ENUMERATION（A-K 11 类）
- ✅ 砍掉 STYLE VOCABULARY CATALOG，替换为 ANTI-GENERIC CONSTRAINT
- ✅ 新增 [BOUND FEATURES] 模块（位置：STYLE MODULE 末尾，[NEGATIVE PROMPT] 之后）

---

## 4. 待完成

### 4.1 `image.ts` 改造（高优先级）

- [ ] 新增 `CONTENT FIELD ENUMERATION` 模块（A-K 11 类，对称风格侧）
- [ ] 把现有"// ── Bound features reminder ─────"从规则说明升级为 `BOUND FEATURES` 输出模块定义
- [ ] 在 STYLE MODULE 输出顺序中追加 [BOUND FEATURES]
- [ ] 在 MODULE OUTPUT ORDER 中明确 [BOUND FEATURES] 位置
- [ ] 砍掉 `STYLE VOCABULARY CATALOG`（6 类），替换为 `ANTI-GENERIC CONSTRAINT`（精简版反泛词约束）
- [ ] OUTPUT QUALITY VALIDATION 中加入 [BOUND FEATURES] 完整性检查

### 4.2 `imageResponse.ts` 改造（中优先级）

- [ ] `STYLE_TAGS` 集合中新增 `"BOUND FEATURES"`
- [ ] `REQUIRED_TAGS` 中新增 `"BOUND FEATURES"`，加入 `MIN_CONTENT_LENGTH` 校验
- [ ] 验证：UI 单选"风格描述"时默认包含 BOUND FEATURES（因其归入 STYLE）
- [ ] 验证：UI 单选"内容描述"时不包含 BOUND FEATURES
- [ ] 验证：UI"全部"视图时 BOUND FEATURES 完整呈现

### 4.3 文档同步

- [x] `Prompt Structure.md` 标题树对齐 `image.ts`
- [x] 砍掉 VOCABULARY CATALOG（替换为 ANTI-GENERIC CONSTRAINT）
- [x] 新增 CONTENT FIELD ENUMERATION（英文 A-K 11 类）
- [x] 新增 BOUND FEATURES 模块位置
- [ ] 改造完成后，更新 `imageProduct.ts`（如果使用相同结构）

### 4.4 验证

- [ ] 运行 `npm run lint`
- [ ] 运行 `npm run typecheck`
- [ ] 用 1-2 张真实图片测试生图效果，对比改造前后姿势与画面还原度

---

## 5. 关键设计决策

### 5.1 [BOUND FEATURES] 位置

**决策**：放在 [NEGATIVE PROMPT] 之后、CONTENT MODULE 之前（STYLE MODULE 末尾）

**理由**：
- [GENERATION CUES] 已经是 STYLE → 翻译层
- [NEGATIVE PROMPT] 是约束
- BOUND FEATURES 是"STYLE 作用在 CONTENT 上的效果清单"——它本质是"风格对物体的作用"，放 STYLE MODULE 末尾比 CONTENT MODULE 更合理
- 相当于"风格模块的尾注"，承接"风格 → 内容"的桥梁角色

### 5.2 视图展示规则

| 视图 | 包含 [BOUND FEATURES] | 用途 |
|---|---|---|
| 全部 | ✅ 完整 | 喂给 AI 生图 |
| 风格描述 | ✅ 默认包含 | 用户聚焦"怎么拍" + 跨模块桥梁 |
| 内容描述 | ❌ 不展示 | 用户聚焦"拍了什么" |

### 5.3 不为内容侧建立 VOCABULARY CATALOG

**决策**：内容侧不加词汇库

**理由**：
- 内容描述 LLM 本来就擅长（写"短发女生穿白裙"无需词典）
- 内容词汇多样性大（姿势词汇几乎无穷）
- 加了反而让 LLM 输出刻板
- 风格侧 VOCABULARY CATALOG 也一并砍掉，替换为 ANTI-GENERIC CONSTRAINT

### 5.4 ANTI-GENERIC CONSTRAINT（替代 VOCABULARY CATALOG）

```
- 禁用泛词：beautiful, stunning, professional, high quality, perfect, amazing
- 必用具体风格术语（设备/光型/色彩/材质/年代等具体名词）
- 密度要求：每 15-20 词至少 1 个具体风格术语
```

**优势**：
- 30 词 vs 旧 250 词，节省 ~88% tokens
- 反泛词效果等价或更优
- 不限制 LLM 选择，只禁止"偷懒泛词"

---

## 6. 风险与回滚

### 6.1 风险点

| 风险 | 缓解 |
|---|---|
| 姿势反归一化规则太严，导致"明明是正脸也强制写背面" | 规则措辞改为"匹配源图"，不要无脑套用 |
| [BOUND FEATURES] 在 UI 切换时展示混乱 | 在 `imageResponse.ts` 中明确归类逻辑（STYLE_TAGS 集合） |
| CONTENT FIELD ENUMERATION 与现有 [SUBJECT 1] 内部字段说明重复 | 优先级：ENUMERATION 是顶层 checklist，[SUBJECT 1] 内部是详细说明，两者不冲突 |
| 砍 VOCABULARY CATALOG 后 LLM 用泛词 | ANTI-GENERIC CONSTRAINT 直接禁止，密度要求保底 |

### 6.2 回滚点

- 改造前先 git commit 当前 `image.ts` 与 `imageResponse.ts` 状态
- 改造后用 `1.jpg` vs `2.png` 对比图作为视觉验收基线
- 若姿势/画面失真更严重，git revert 即可

---

## 7. 待用户决策项

- [x] 方案 A（CONTENT FIELD ENUMERATION 11 类镜像风格侧）—— 已选
- [x] 砍掉 VOCABULARY CATALOG，替换为 ANTI-GENERIC CONSTRAINT —— 已选
- [x] [BOUND FEATURES] 作为独立模块，放在 STYLE MODULE 末尾 —— 已确认
- [ ] UI 视图切换逻辑是否需要后端配合？（当前默认 [BOUND FEATURES] 归入 styleText）

---

## 8. 后续可能扩展

- 为 CONTENT MODULE 内部各 tag 也加"必填字段清单"（方案 B 思路）
- 把 ANTI-GENERIC CONSTRAINT 拆分为"风格反泛词"和"内容反泛词"两个独立约束
- 设计一个"无绑定内容"占位规则（如产品图、白底图场景）
- 用 1-2 张图做 A/B 测试，量化改造前后的还原度提升
