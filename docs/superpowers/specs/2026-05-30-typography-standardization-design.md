# Sophia 全局文字统一规范 — 设计文档

**日期**: 2026-05-30
**状态**: 已确认
**版本**: 1.0

---

## 一、背景与目标

Sophia 项目现有设计系统（iOS 26 Liquid Glass）已有较完善的 CSS 变量体系，但在文字样式层面存在碎片化问题：标题字号/字重不统一、多处硬编码颜色值、Shadow DOM 侧样式与主样式系统部分隔离。

**目标**：建立全局统一的文字样式规范，涵盖颜色、字号、字重、布局四个维度，覆盖所有页面组件及交互元素。

---

## 二、色彩体系变更

### 2.1 主文字色

`--text-primary` 从 `#1A1A1E`（冷黑）变更为 `#2b2b2b`（暖深灰）。

### 2.2 变量完整对照表

| CSS 变量 | 当前值 (light) | 新值 (light) | 当前值 (dark) | 新值 (dark) |
|---------|---------------|-------------|---------------|-------------|
| `--text-primary` | `#1A1A1E` | `#2b2b2b` | `#F5F5F7` | 保持不变 |
| `--text-secondary` | `#636366` | `#5a5a5e` | `#A1A1A6` | 保持不变 |
| `--text-tertiary` | `#AEAEB2` | 保持不变 | `#636366` | 保持不变 |
| `--text-placeholder` | `#C7C7CC` | 保持不变 | `#48484A` | 保持不变 |
| `--text-on-dark` | `#F5F5F7` | 保持不变 | `#FFFFFF` | 保持不变 |

> **设计理由**：`#1A1A1E` 纯度过高，在白色底上对比过于强烈。`#2b2b2b` 带有暖色调，更符合 iOS 26 Liquid Glass 温润的视觉风格。`--text-secondary` 从 `#636366` 微调为 `#5a5a5e` 以匹配新主色的对比度关系（主色:辅助色 ≈ 3.3:1 → 3.5:1）。

### 2.3 涉及文件

- `src/styles/variables.css` — 第 58 行 `--text-primary`，第 59 行 `--text-secondary`
- `src/content/panel-styles.ts` — Shadow DOM 中通过 `variablesCss` 替换自动继承，无需额外修改

---

## 三、文字层级体系

### 3.1 标题体系（分层方案 A）

| 层级 | 语义 | 字号 | CSS 变量 | 字重 | CSS 类名 |
|------|------|------|---------|------|---------|
| H1 | 页面主标题 | 18px (1.125rem) | `var(--text-xl)` | `var(--font-normal)` 400 | `.section-title` |
| H2 | 模块/卡片标题 | 16px (1rem) | `var(--text-lg)` | `var(--font-normal)` 400 | `.module-title` |
| H3 | 分组小标题 | 14px (0.875rem) | `var(--text-base)` | `var(--font-normal)` 400 | `.group-title` |

### 3.2 内容文案体系

| 层级 | 语义 | 字号 | CSS 变量 | 字重 | 颜色 | 适用场景 |
|------|------|------|---------|------|------|---------|
| body | 正文内容 | 14px (0.875rem) | `var(--text-base)` | `var(--font-normal)` 400 | `var(--text-primary)` | 描述文本、正文段落 |
| caption | 辅助说明 | 12px (0.75rem) | `var(--text-xs)` | `var(--font-medium)` 500 | `var(--text-secondary)` | 提示文字、元信息、脚注 |
| label | 标签/徽章 | 11px (0.6875rem) | `var(--text-xxs)` | `var(--font-medium)` 500 | `var(--text-tertiary)` | 分类标签、状态标签 |

### 3.3 全局标题 CSS 类（新增至 `shared.css`）

```css
/* 页面主标题 — 18px / 400 */
.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.3;
  margin: 0;
}

/* 模块/卡片标题 — 16px / 400 */
.module-title {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  letter-spacing: -0.015em;
  line-height: 1.35;
  margin: 0;
}

/* 分组小标题 — 14px / 400 */
.group-title {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  letter-spacing: -0.015em;
  line-height: 1.35;
  margin: 0;
}
```

### 3.4 现有文字类更新

| 现有类 | 变更 | 说明 |
|-------|------|------|
| `.text-heading` | `font-weight: var(--font-semibold)` → `var(--font-normal)` | 字重从 600 → 400 |
| `.text-subheading` | `font-weight: var(--font-semibold)` → `var(--font-normal)` | 字重从 600 → 400 |
| `.card-title` | `font-weight: var(--font-semibold)` → `var(--font-normal)` | 字重从 600 → 400 |
| `.text-body` | 保持不变 | 已经是 `--font-normal` |
| `.text-caption` | 保持不变 | 已经是 `--font-medium` |
| `.text-label` | 保持不变 | 无变更 |
| `.text-hint` | 保持不变 | 无变更 |

### 3.5 各组件标题迁移表

| 组件位置 | 当前选择器 | 当前样式 | 迁移目标 |
|---------|----------|---------|---------|
| Sidepanel 子视图标题 | `.subview-title` | `--text-lg` + `--font-semibold`(600) | `.section-title` (18px/400) |
| 设置页模型标题 | `.settings-hero-title` | `--text-base` + `--font-semibold`(600) | `.module-title` (16px/400) |
| 设置页隐私标题 | `.settings-privacy-title` | `--text-sm` + `--font-semibold`(600) | `.group-title` (14px/400) |
| 模型卡片名称 | `.model-card-name` | `--text-base` + `--font-semibold`(600) | `.module-title` (16px/400) |
| 编辑表单标题 | `.model-edit-title` | `--text-sm` + `--font-semibold`(600) | `.group-title` (14px/400) |
| 帧采样标题 | `.frame-sampling-title` | `--text-base` + `--font-semibold`(600) | `.module-title` (16px/400) |
| 结果卡片标题 | `.result-card-title` | `--text-sm` + `--font-semibold`(600) | `.group-title` (14px/400) |
| 结果模块标题 | `.result-module-title` | `--text-sm` + `--font-semibold`(600) | `.group-title` (14px/400) |
| 上传卡片标题 | `.upload-title` | `--text-base` + `--font-semibold`(600) | `.module-title` (16px/400) |
| 最小卡片标题 | `.settings-mini-title` | `--text-sm` + `--font-semibold`(600) | `.group-title` (14px/400) |
| 浮动面板标题栏 | `._titlebar-center h3` | 硬编码 13px + 600 | `.section-title` (18px/400) |
| Options 页卡片标题 | `.card-title` | `--text-base` + `--font-semibold`(600) | `.module-title` (16px/400) |
| 模态框标题 | `.modal-title` | `--text-lg` + `--font-semibold`(600) | `.module-title` (16px/400) |

---

## 四、标题位置规范

### 4.1 布局参数

```
┌─────────────────────────────────────────────┐
│ ← 20px ↑ 20px                               │
│ 模块标题（左对齐，16px/400）                   │
│ ← 16px ↓ 16px (标题与内容间距)                │
│ ← 16px → 内容区域开始 ←────────── 16px →     │
│                                             │
└─────────────────────────────────────────────┘
```

| 参数 | 值 | CSS 变量 |
|------|-----|---------|
| 标题距容器顶部 | 20px | `var(--space-5)` |
| 标题距容器左侧 | 16px | `var(--space-4)` |
| 标题距容器右侧 | 16px | `var(--space-4)` |
| 标题与内容区垂直间距 | 16px | `var(--space-4)` |
| 对齐方式 | 左对齐 | `text-align: left` |

### 4.2 标准模块头部 CSS 类（新增至 `shared.css`）

```css
/* 标准模块头部（标题 + 可选操作区） */
.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-4) 0 var(--space-4);
  margin-bottom: var(--space-4);
}

/* 纯标题模式（标题后直接接内容，无操作区） */
.module-header--simple {
  padding: var(--space-5) var(--space-4) 0 var(--space-4);
  margin-bottom: var(--space-4);
}
```

---

## 五、易遗漏交互元素覆盖清单

| 元素 | 位置 | 当前状态 | 处理方式 |
|------|------|---------|---------|
| Toast 提示 | `.toast-modern` (shared.css:358) | `color: var(--text-primary)` ✅ | 自动继承新值 |
| 模态框 | `.modal-card` (shared.css:438) | `color: var(--text-primary)` ✅ | 自动继承新值 |
| 下拉菜单 | `.add-model-menu` (shared.css:594) | `color: var(--text-primary)` ✅ | 自动继承新值 |
| 帧采样下拉菜单 | `.frame-sampling-menu` (sidepanel.css:150) | `color: var(--text-primary)` ✅ | 自动继承新值 |
| 下拉菜单项描述 | `.add-model-menu-item-desc` (shared.css:655) | `color: var(--text-secondary)` ✅ | 自动继承新值 |
| Shadow DOM 面板 | `._panel` (panel-styles.ts:14) | `color: var(--text-primary)` ✅ | 自动继承新值 |
| Shadow DOM 标题栏 | `._titlebar-center h3` (panel-styles.ts:102) | 硬编码 `font-size:13px; font-weight:600` ❌ | 需更新 |
| Shadow DOM 加载文字 | `._loading` (panel-styles.ts:222) | `color: var(--text-secondary)` ✅ | 自动继承新值 |
| Error 渲染 | app.tsx:28 | 硬编码 `font-size:13px` ❌ | 需更新 |
| 空状态 | `.history-empty-state` | `color: var(--text-secondary)` ✅ | 自动继承新值 |
| 错误状态 | `.result-error-state` | `color: var(--danger)` ✅ | 保持不变（语义色） |
| 设置保存芯片 | `.settings-saved-chip` | `color: var(--success)` ✅ | 保持不变（语义色） |
| 面板模式选项 | `.panel-mode-label/desc` | `color: var(--text-primary/secondary)` ✅ | 自动继承新值 |

---

## 六、实施策略

### 6.1 分阶段实施

**阶段 1：变量层（variables.css）**
- 更新 `--text-primary` 为 `#2b2b2b`
- 更新 `--text-secondary` 为 `#5a5a5e`
- 确保暗色模式值正确

**阶段 2：基础类层（shared.css）**
- 新增 `.section-title`、`.module-title`、`.group-title`
- 新增 `.module-header`、`.module-header--simple`
- 更新 `.text-heading`、`.text-subheading`、`.card-title` 字重

**阶段 3：组件迁移（sidepanel.css）**
- 将所有标题选择器替换为新的标题类
- 统一模块标题使用 `.module-title`
- 统一内容文案使用标准字号

**阶段 4：Shadow DOM 同步（panel-styles.ts）**
- 更新 `._titlebar-center h3` 硬编码样式
- 确保所有 Shadow DOM 文本元素使用变量

**阶段 5：交叉验证**
- 检查所有页面（ImageVideo/Enhancer/History/Settings）
- 检查交互元素（Toast/Modal/Dropdown）
- 验证暗色模式
- 验证不同窗口尺寸

### 6.2 回退策略

所有颜色/字号变更均通过 CSS 变量实现，如需回退只需恢复 `variables.css` 中的变量值即可。旧 CSS 类（`.text-heading` 等）保留兼容。

---

## 七、验证标准

1. 所有模块标题使用统一的 `.module-title`（16px/400）或 `.section-title`（18px/400）
2. 所有正文内容颜色为 `#2b2b2b`，无硬编码颜色值
3. 无遗漏的 `font-weight: 600` 标题（语义色如 danger/success 除外）
4. 暗色模式下文字颜色正常显示
5. Toast、Modal、Dropdown 等交互元素文字颜色正确
6. Shadow DOM 内的标题与主应用视觉一致
