# CLAUDE.md — Robot Delysia App 开发规范

> 本文件记录项目约定、经验教训和代码规范。
> 每次处理 UI 开发任务前必须先读取本文件，并严格遵循以下规则。

---

## 项目概况

- **技术栈**：React 19 + TypeScript + Vite + Tailwind CSS v4 beta
- **主要屏幕**：PrivacyNotice → ProfileSetup → WhoIsPlaying → ThemeSelection → SessionScreen（ReadingZone + BuildingZone）→ ParentMode / EditProfile
- **目标用户设备**：家庭设备（手机 375px+ / 平板 768px+ / 桌面 1024px+）
- **主响应式断点**：`md`（768px）— 小屏竖向堆叠，大屏横向并排
- **已记录的解决方案**：`docs/solutions/` — 历史 bug 修复与最佳实践，按类别组织，YAML frontmatter 含 `module`、`tags`、`problem_type`（当前：`ui-bugs/`）

---

## 响应式布局规范

### 规则 1：以 `md` 作为唯一主断点

本项目所有响应式布局均以 Tailwind `md`（768px）为分界线：
- `< md`：手机 / 小平板竖屏，采用竖向堆叠布局
- `≥ md`：大平板 / 桌面，采用横向并排布局

**不要**引入额外的自定义断点（`sm` 仅用于微调，不用于主结构切换）。

---

### 规则 2：SessionScreen 双栏布局的正确写法

SessionScreen 是最复杂的布局，采用"小屏堆叠 / 大屏并排"模式。

**正确写法（已验证）：**

```tsx
// 外层容器
<div className="h-screen flex flex-col md:flex-row">

  {/* ReadingZone：小屏占一半高度，大屏占 55% 宽度 */}
  <div className="flex-1 md:flex-none md:h-full md:w-[55%] min-h-0">
    ...
  </div>

  {/* 分隔线：小屏水平线，大屏垂直线 */}
  <div className="w-full h-px md:w-px md:h-auto bg-gray-300 flex-shrink-0" />

  {/* BuildingZone：小屏占一半高度，大屏占 45% 宽度 */}
  <div className="flex-1 md:flex-none md:h-full md:w-[45%] min-h-0">
    ...
  </div>
</div>
```

**关键点：**
- 用 `flex-1` 均分高度（而非 `h-1/2`），避免 `h-1/2 + h-1/2 + divider(1px) > 100vh` 的溢出。
- 必须加 `min-h-0`，防止 flex 子元素忽视父容器高度约束而溢出。
- **绝对不要**在这两个 zone wrapper 上加 `overflow-hidden`，否则会裁剪内部绝对定位弹窗（见规则 5）。

---

### 规则 3：ThemeSelection 卡片响应式模板

多卡片横排 → 小屏竖排的标准写法：

```tsx
{/* 容器：小屏撑满，大屏固定宽 */}
<div className="w-full max-w-[95vw] md:w-[1011px] px-6 py-8 md:px-16 md:py-14">

  {/* 标题字体缩放 */}
  <h1 className="text-3xl md:text-[50px]">...</h1>

  {/* 卡片列表：小屏竖排，大屏横排 */}
  <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
    {items.map(item => (
      {/* 卡片：小屏全宽限高，大屏固定尺寸 */}
      <div className="w-full max-w-[280px] md:w-[192px]
                      h-[160px] md:h-[250px]">
        <img className="w-[90px] h-[90px] md:w-[150px] md:h-[150px]" />
      </div>
    ))}
  </div>
</div>
```

---

### 规则 4：内边距的响应式缩减模板

所有使用大 padding 的阅读/展示区域，统一使用阶梯式缩减：

```tsx
// 标准模板（全尺寸 → 小屏缩减）
className="p-4 md:p-8"          // 通用内容容器
className="px-6 py-8 md:px-16 md:py-14"  // 卡片/面板容器
```

**不要**在展示组件中使用裸 `p-8`，必须附带小屏的 `p-4`。

---

### 规则 5：绝对定位弹窗不能被 overflow-hidden 祖先裁剪

**教训（来自 Review 阶段发现的 P1 Bug）：**

为使 flex 子元素高度受控，很容易误用 `overflow-hidden`，但这会导致其内部所有绝对定位子元素（弹窗、Tooltip、下拉菜单）被裁剪消失。

**正确做法：**
- 使用 `min-h-0` 控制 flex 子元素高度，不用 `overflow-hidden`
- 如果内容本身需要滚动，在**最内层**的内容容器上加 `overflow-y-auto`，而非外层 wrapper

```tsx
// ❌ 错误：会裁剪内部弹窗
<div className="flex-1 min-h-0 overflow-hidden">
  <ComponentWithPopup /> {/* 弹窗会被裁剪 */}
</div>

// ✅ 正确：min-h-0 约束高度，不裁剪弹窗
<div className="flex-1 min-h-0">
  <ComponentWithPopup /> {/* 弹窗正常显示 */}
</div>
```

---

### 规则 6：绝对定位弹窗的响应式定位

弹窗在小屏可能溢出屏幕边缘，必须根据屏幕宽度切换展开方向：

```tsx
{/* 小屏向下展开，大屏向右展开 */}
<div className="
  absolute left-0 top-full mt-2
  md:left-full md:top-0 md:mt-0 md:ml-2
  bg-white rounded-xl shadow-lg z-50
">
```

**规律**：
- 工具栏位于左侧 → 弹窗小屏向下（`top-full`），大屏向右（`left-full`）
- 工具栏位于顶部 → 弹窗小屏向下（`top-full`）永远正确

---

### 规则 7：响应式按钮尺寸缩减模板

操作按钮在小屏需要缩减 padding 和字号，但不能小到无法点击（最小 touch target 44px）：

```tsx
// 标准模板
className="py-2 px-3 md:py-3 md:px-4 text-base md:text-lg rounded-xl font-bold"

// spacing 间距
className="mt-1 md:mt-2"  // 小间距
className="mt-1 md:mt-3"  // 大间距（如底部主按钮）
```

---

## 布局层次结构规范

本项目的 UI 层次和各层职责：

```
App.tsx               — 路由/状态控制，无布局样式
  ↓
Screen 组件           — 占满全屏 (min-h-screen 或 h-screen)
  ↓
Zone/Panel 组件       — 占分配空间 (h-full)，内部用 flex-col 垂直分区
  ↓
Content 组件          — flex-1 占剩余空间，p-4 md:p-8 内边距
  ↓
UI 原子组件            — 固定尺寸或 w-full
```

**规则：每层只管自己的 flex 布局，不要跨层设定尺寸。**

---

## 曾踩过的坑（避坑指南）

### 坑 1：`h-1/2 + h-1/2 + divider` 会溢出 1px

```tsx
// ❌ 会导致 100vh + 1px，产生多余滚动条
<div className="h-1/2">Zone A</div>
<div className="h-px">Divider</div>
<div className="h-1/2">Zone B</div>

// ✅ flex-1 自动均分，divider 的 1px 由 flex 容器吸收
<div className="flex-1 min-h-0">Zone A</div>
<div className="h-px flex-shrink-0">Divider</div>
<div className="flex-1 min-h-0">Zone B</div>
```

### 坑 2：硬编码 inline style 的宽度无法响应式

```tsx
// ❌ 无法用 Tailwind 断点覆盖
<div style={{ width: CONSTANTS.layout.readingZoneWidth }}>

// ✅ 用 Tailwind 响应式类
<div className="flex-1 md:flex-none md:w-[55%]">
```

### 坑 3：大字号不随屏幕缩小

```tsx
// ❌ 在小屏会溢出或破坏布局
<h1 className="text-[50px]">

// ✅ 小屏用较小字号，大屏恢复设计稿尺寸
<h1 className="text-3xl md:text-[50px]">
```

### 坑 4：三列卡片在小屏水平溢出

```tsx
// ❌ 三张 192px 卡片 = 576px+，手机上水平溢出
<div className="flex gap-8">
  {themes.map(t => <div className="w-[192px]">...)}
</div>

// ✅ 小屏改为竖排，卡片改为全宽
<div className="flex flex-col md:flex-row gap-6 md:gap-8">
  {themes.map(t => <div className="w-full max-w-[280px] md:w-[192px]">...)}
</div>
```

---

## 代码审查检查项（响应式布局）

提交 UI 代码前，必须逐条检查：

- [ ] 所有 `flex` 容器在小屏是否需要 `flex-col` 方向？
- [ ] 所有固定像素宽高是否有 `md:` 变体或 `max-w-[Xvw]` 约束？
- [ ] 所有 `p-8`/`px-16` 是否替换为 `p-4 md:p-8`/`px-6 md:px-16`？
- [ ] 所有绝对定位弹窗的父链中是否存在 `overflow-hidden`？（如有，考虑改用 `min-h-0`）
- [ ] 分栏布局是否使用 `flex-1 min-h-0` 而非 `h-1/2`？
- [ ] 字号是否有响应式缩放（`text-xl md:text-[50px]`）？

---

---

## 响应式原子组件（已内置响应式，调用时无需再加断点类）

以下组件已在内部处理响应式，**调用时直接使用，不要在使用处再叠加 `md:` 覆盖尺寸**：

| 组件 | 小屏（< md） | 大屏（≥ md） |
|------|------------|-------------|
| `ActionButton` | `py-2 px-6`, `min-h-[44px]`, `text-lg` | `py-4 px-8`, `min-h-[60px]`, `text-2xl` |
| `StyledText size="word"` | `text-5xl`（48px） | `text-7xl`（72px） |
| `StyledText size="story"` | `text-3xl`（30px） | `text-4xl`（36px） |

**坑 5：在 `ActionButton` 调用处再加 `py-4` 会破坏响应式**

```tsx
// ❌ 错误：覆盖了内部响应式设置
<ActionButton className="py-4 text-2xl">...</ActionButton>

// ✅ 正确：直接使用，内部已处理
<ActionButton color="primary">...</ActionButton>
```

---

*最后更新：2026-04-07（小屏内容溢出修复完成后更新）*
