---
title: "refactor: Small Screen UI Redesign — Components Stop Competing for Space"
type: refactor
status: completed
date: 2026-04-07
---

# refactor: Small Screen UI Redesign — Components Stop Competing for Space

## Overview

当前在小屏幕（< 768px）下，SessionScreen 将 ReadingZone 和 BuildingZone 上下各占一半屏幕高度。这导致两个区域都严重空间不足：ReadingZone 的大字单词 + 工具栏 + 三个按钮挤在半屏内，BuildingZone 的工具栏 + 构建区 + 可选控制栏 + 可选舞蹈/拍照按钮 + 结束按钮同样挤在半屏内。本计划将两个区域改为**全屏标签页模式**，并对各组件内部做针对性的小屏优化，彻底消除挤占问题。

## Problem Frame

小屏竖屏布局存在以下具体问题：

1. **SessionScreen 50/50 分屏**：每个 zone 只有约 `50vh`，但两个 zone 各自的内部元素本来是为 `100vh` 设计的
2. **BuildingZone 按钮堆叠**：Utility bar + 构建区 + PartControlBar（可选）+ Dance/Photo 按钮（可选）+ End session 按钮，最多有 5 层内容叠在 `50vh` 内，构建画布极小
3. **ReadingAidsToolbar 竖向占位**：工具栏固定 `4rem` 宽，以竖列排布 5 个按钮，在 `50vh` 高度下垂直空间不够
4. **WordDisplay 顶角绝对定位元素**：Pattern badge + TeachingTipBadge 在右上角，半屏模式下会与居中的单词内容产生视觉拥挤
5. **StoryScreen 标题头部**：emoji + 标题 + 说明占用了宝贵的小屏垂直空间

## Requirements Trace

- R1. 小屏下 ReadingZone 和 BuildingZone 都能获得近乎全屏的可用空间
- R2. BuildingZone 内的构建画布面积在小屏下至少保留 `60%` 可用高度
- R3. 所有交互按钮满足 44px 最小触摸目标
- R4. 工具切换按钮（Ruler/Lightbox/Marks/Theme/Settings）在小屏下依然可访问
- R5. 标签页切换操作直觉明确，零学习成本
- R6. 大屏（≥ 768px）布局完全不变，保持现有 55%:45% 横向并排

## Scope Boundaries

- 不改变任何业务逻辑、状态管理、Hook
- 不改变大屏（`≥ md`）的任何视觉效果
- 不引入动画框架或第三方 UI 库
- 不改变字体、颜色系统、品牌元素
- 不重写 ProfileSetup、WhoIsPlaying、ParentMode 等非 Session 屏幕（这些已有独立布局，小屏问题较轻）
- 不改变 `ThemeSelection`（已通过之前 fix 处理）

## Context & Research

### Relevant Code and Patterns

- `robot-reading/src/components/SessionScreen.tsx:317` — 主布局 `h-screen flex flex-col md:flex-row`，小屏 `flex-col` 的 `flex-1` 均分是问题根源
- `robot-reading/src/components/BuildingZone/BuildingZone.tsx:209` — `h-full flex flex-col p-2 md:p-4`，5 层内容堆叠
- `robot-reading/src/components/ReadingZone/ReadingAidsToolbar.tsx:56` — 使用纯 CSS class `.reading-aids-toolbar`（`flex-direction: column`，固定 `width: 4rem`）
- `robot-reading/src/components/ReadingZone/storyScreen.css:122-171` — `.reading-aids-toolbar` 和 `.toolbar-btn` 的 CSS 定义
- `robot-reading/src/components/ReadingZone/WordDisplay.tsx:48` — `absolute top-4 right-4` 顶角徽章
- `robot-reading/src/components/ReadingZone/StoryScreen.tsx:84` — 故事屏标题区块
- `robot-reading/src/components/ui/ActionButton.tsx` — 已内置响应式（勿在外部叠加尺寸类）
- CLAUDE.md 规则 2：`SessionScreen` 使用 `flex-1 min-h-0`，不用 `h-1/2`
- CLAUDE.md 规则 5：不在 zone wrapper 加 `overflow-hidden`，用 `min-h-0` 代替

### Institutional Learnings

- 上一轮 fix（`2026-04-07-003`）解决了内容溢出问题，本次在此基础上做系统性小屏重设计
- `overflow-hidden` 会裁剪绝对定位弹窗（已记录在 CLAUDE.md 规则 5）
- `flex-1 min-h-0` 是控制 flex 子元素高度的正确方式

## Key Technical Decisions

- **标签页模式而非滑动切换**：使用底部固定 Tab Bar 切换两个 zone，而非滑动手势。理由：手势与拖拽零件的交互会冲突；Tab Bar 状态可见，儿童用户直觉更强。
- **Tab Bar 仅在小屏出现**：使用 `md:hidden` 隐藏 Tab Bar，`hidden md:flex` 保持大屏原有布局。
- **ReadingAidsToolbar 在小屏改为水平顶部栏**：通过在 `.reading-aids-toolbar` CSS 增加响应式规则，小屏改为 `flex-direction: row`，高度从占垂直变为占水平，并收窄每个按钮。
- **BuildingZone 小屏精简 Utility Bar**：图标-only 按钮（去掉文字标签），减少 Utility Bar 高度从约 `44px` 降到更紧凑。Dance/Photo/PartControlBar 的 `mt-1` 不变，但 Utility Bar 本身更紧。
- **StoryScreen 小屏隐藏标题段落**：`<p className="text-gray-500 text-sm">Listen to the story</p>` 在小屏用 `hidden md:block` 隐藏；emoji + 标题用 `mb-1 md:mb-4` 缩减间距。
- **WordDisplay 顶角徽章在小屏相对排列**：将 `absolute top-4 right-4` 改为在大屏绝对定位、小屏内联流式排列（`static md:absolute`），避免覆盖内容。

## Open Questions

### Resolved During Planning

- **Q: Tab 切换时两个 zone 是否保持挂载？** A: 是。用 CSS `hidden/block` 切换可见性（不卸载组件），保持拖拽状态、动画状态等所有内部状态不丢失。这与 `SessionScreen` 中 `keepSessionMounted` 的现有理念一致。
- **Q: Tab Bar 应放顶部还是底部？** A: 底部。拇指可及区域，且不遮挡内容阅读区。
- **Q: 如何确保 Tab Bar 不占用 zone 的可用高度？** A: Tab Bar 固定 `h-14`，zone 容器用 `h-[calc(100vh-3.5rem)]` 或改为整体 flex 布局（外层 `flex-col`，Tab Bar `flex-shrink-0`，zone 区 `flex-1 min-h-0`）。

### Deferred to Implementation

- Tab Bar 图标/文字的具体视觉设计（颜色、选中状态样式）由实现时决定，保持与现有色彩系统一致
- `ReadingAidsToolbar` 水平模式的具体 overflow 处理（若按钮过多是否需要滚动）由实现时验证

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### 小屏布局变化示意（SessionScreen）

```
当前小屏（< 768px）：                  重设计后小屏（< 768px）：
┌─────────────────────┐               ┌─────────────────────┐
│                     │               │                     │
│    ReadingZone      │               │                     │
│    (flex-1 ~50vh)   │               │    ReadingZone      │
│    ← 太挤           │               │    (flex-1 ~calc(   │
│                     │               │     100vh - 3.5rem))│
├─────────────────────┤               │    ← 几乎全屏       │
│    Divider (1px)    │               │                     │
├─────────────────────┤               │                     │
│                     │               │                     │
│    BuildingZone     │               ├─────────────────────┤
│    (flex-1 ~50vh)   │               │  📖 Reading │ 🔧 Build │ ← Tab Bar (h-14)
│    ← 太挤           │               └─────────────────────┘
│                     │
└─────────────────────┘
```

### ReadingAidsToolbar 方向切换

```
当前（小屏/大屏相同，竖向）：    重设计后小屏（水平）：
┌──┐                            ┌────────────────────┐
│📏│                            │ 📏 💡 Aa  [Theme] ⚙ │
│💡│                            └────────────────────┘
│Aa│
│  │ (flex-1)
│🎨│
│⚙ │
└──┘
```

### BuildingZone 小屏 Utility Bar 精简

```
当前：                                  重设计后小屏：
┌─────────────────────────────────┐    ┌──────────────────────────┐
│ [Sound on]         [Start again]│    │ 🔊  🔄                   │
│ (文字标签，约 44px 高)            │    │ (图标 only，约 36px 高)    │
└─────────────────────────────────┘    └──────────────────────────┘
```

## Implementation Units

- [ ] **Unit 1: SessionScreen — 小屏标签页布局**

**Goal:** 在小屏下将 ReadingZone 和 BuildingZone 改为标签页切换，每个 zone 获得全屏高度；大屏保持不变。

**Requirements:** R1, R6

**Dependencies:** 无

**Files:**
- Modify: `robot-reading/src/components/SessionScreen.tsx`

**Approach:**
- 在 `SessionScreen` 增加一个 `activeTab: 'reading' | 'building'` 的 `useState`，默认值 `'reading'`
- 小屏布局：外层改为 `h-screen flex flex-col`（原来已是），去掉 `md:flex-row` 不变
- 在 `md:hidden` 区域渲染底部 Tab Bar（`h-14 flex-shrink-0`），两个 tab 按钮各占一半
- Zone 容器改为：小屏时用 `activeTab === 'reading' ? 'flex-1 min-h-0' : 'hidden'` 切换可见性（保持挂载，仅 CSS 隐藏）；大屏恢复 `flex-1 md:flex-none md:h-full md:w-[55%] min-h-0`
- 分隔线 Divider 在小屏用 `hidden md:block` 隐藏
- Tab Bar 仅在 `md:hidden` 内渲染，大屏完全不出现

**Patterns to follow:**
- `robot-reading/src/components/SessionScreen.tsx:317-373`（现有布局结构）
- CLAUDE.md 规则 2（`flex-1 min-h-0` 分栏）

**Test scenarios:**
- Happy path: 小屏下点击 "Build" tab，BuildingZone 变为可见且占满可用高度，ReadingZone 被隐藏（但未卸载）
- Happy path: 小屏下在 BuildingZone 拖入一个零件后切换到 Reading tab，再切回 Building tab，零件仍在原位
- Happy path: 大屏（≥ 768px）下 Tab Bar 不可见，两个 zone 横向并排，布局与改动前完全一致
- Edge case: 小屏横屏（landscape）切换为大屏断点时，Tab Bar 消失，恢复双栏布局
- Edge case: 在小屏 Reading tab 下触发 BonusTransition 动画，动画期间 tab 仍可切换

**Verification:**
- 小屏下每个 zone 可用高度 ≈ `100vh - 56px`（Tab Bar 高度）
- 大屏下布局、尺寸、功能与改动前无差异（目视 + 无 JS 错误）

---

- [ ] **Unit 2: ReadingAidsToolbar — 小屏水平顶部栏**

**Goal:** 在小屏下将竖向侧边工具栏变为水平顶部栏，从占用 ReadingZone 水平空间改为占用垂直空间，释放内容宽度。

**Requirements:** R4

**Dependencies:** Unit 1（确保 ReadingZone 获得全屏后再调整工具栏方向）

**Files:**
- Modify: `robot-reading/src/components/ReadingZone/storyScreen.css`
- Modify: `robot-reading/src/components/ReadingZone/ReadingZone.tsx`

**Approach:**
- 在 `storyScreen.css` 中为 `.reading-aids-toolbar` 增加媒体查询（`@media (max-width: 767px)`）：
  - `flex-direction: row`
  - `border-right: none; border-bottom: 1px solid #E5E7EB`
  - `padding: 0.375rem 0.5rem`（上下压缩）
  - `gap: 0.25rem`
- 为 `.toolbar-btn` 在小屏下的媒体查询：
  - `width: auto; min-width: 2.5rem`（不固定 4rem）
  - `flex-direction: row`（图标 + 文字横排或仅图标）
  - `padding: 0.375rem 0.5rem`
- 工具栏中的 `.flex-1` spacer 在小屏下改为 `flex-1`（水平方向推开 theme/settings）——此逻辑已有，无需改代码
- `ReadingZone.tsx` 中 toolbar 与内容的排列：
  - 当前 `h-full flex`（水平排列，toolbar 在左）
  - 小屏改为 `flex-col`（toolbar 在顶部），大屏保持 `flex-row`（toolbar 在左）
  - 即：`h-full flex flex-col md:flex-row`

**Patterns to follow:**
- CLAUDE.md 规则 6（`@media` 或 `md:` 断点）
- `storyScreen.css` 现有 `.reading-aids-toolbar` 定义（`robot-reading/src/components/ReadingZone/storyScreen.css:122`）

**Test scenarios:**
- Happy path: 小屏下工具栏水平排列在 ReadingZone 顶部，5 个按钮水平可见
- Happy path: 小屏下 Ruler/Lightbox/Marks 开关状态正确，active 样式与当前相同
- Happy path: 小屏下 Theme picker 点击展开弹窗，弹窗方向向下（`top-full`）且在屏幕内
- Happy path: 大屏下工具栏仍为竖向左侧边栏，与现在完全一致
- Edge case: 小屏横屏时 5 个按钮不溢出（最小宽度足够容纳）

**Verification:**
- 小屏下 ReadingZone 内容宽度 = 100%（工具栏不再占横向空间）
- 工具栏高度 ≈ `40-44px`（压缩后）

---

- [ ] **Unit 3: BuildingZone — 小屏 Utility Bar 精简**

**Goal:** 将小屏下 BuildingZone 顶部 Utility Bar 的两个按钮改为图标-only，降低其高度，为构建画布腾出更多空间。

**Requirements:** R2, R3

**Dependencies:** Unit 1

**Files:**
- Modify: `robot-reading/src/components/BuildingZone/BuildingZone.tsx`

**Approach:**
- Sound on/off 按钮：小屏显示 `🔊` / `🔇` 图标，大屏保留文字。使用 `<span className="md:hidden">🔊</span><span className="hidden md:inline">Sound on</span>` 模式
- Start again 按钮：小屏显示 `🔄`，大屏保留文字。同上
- 按钮 `className` 中的 `px-3 py-2` 改为 `px-2 py-1.5 md:px-3 md:py-2`，在小屏压缩 padding
- `text-sm` 字号不变（足够清晰）
- 整体 Utility Bar 的 `mb-2` 改为 `mb-1 md:mb-2`

**Patterns to follow:**
- CLAUDE.md 规则 7（响应式按钮尺寸缩减模板）
- `BuildingZone.tsx:211-229`（当前 Utility Bar 实现）

**Test scenarios:**
- Happy path: 小屏下 Utility Bar 仅显示图标，高度约 36px；点击图标功能正常
- Happy path: 大屏下 Utility Bar 显示完整文字，外观与现在一致
- Edge case: Sound muted 状态下图标正确切换（🔊 ↔ 🔇）

**Verification:**
- 小屏下构建画布垂直空间比改动前至少多出 10px

---

- [ ] **Unit 4: WordDisplay — 顶角徽章小屏内联排列**

**Goal:** 在小屏下，将 Pattern/Bonus 徽章和 TeachingTipBadge 从绝对定位顶角改为文档流内联排列，避免覆盖单词内容区。

**Requirements:** R1

**Dependencies:** Unit 1（确保全屏后再调整）

**Files:**
- Modify: `robot-reading/src/components/ReadingZone/WordDisplay.tsx`

**Approach:**
- 当前顶角容器：`absolute top-4 right-4 flex flex-col items-end gap-2 z-10`
- 重构为：小屏 `static flex flex-row justify-end gap-2 mb-2`，大屏 `md:absolute md:top-4 md:right-4 md:flex-col md:items-end`
- 调整 `WordDisplay` 的外层容器：当前 `relative flex flex-col h-full p-4 md:p-8`，保持不变（`relative` 仍需要给大屏绝对定位用）
- 徽章容器在小屏流式布局中位于 flex-col 顶部，不再叠加在单词上方

**Patterns to follow:**
- CLAUDE.md 规则 4（内边距响应式缩减）
- `WordDisplay.tsx:46-65`（当前顶角实现）

**Test scenarios:**
- Happy path: 小屏下 Pattern 徽章出现在单词上方（内联），不覆盖单词
- Happy path: 小屏下 Bonus 徽章出现在单词上方，TeachingTipBadge 在其旁边
- Happy path: 大屏下徽章仍在右上角绝对定位，与现在一致
- Edge case: 两个徽章同时出现时（不可能，互斥）——但若 tip 与 pattern 同时出现，小屏换行无溢出

**Verification:**
- 小屏下单词中央显示区无徽章覆盖

---

- [ ] **Unit 5: StoryScreen — 小屏紧凑标题**

**Goal:** 在小屏下缩减 StoryScreen 标题区域高度，为故事文本内容腾出更多空间。

**Requirements:** R1

**Dependencies:** Unit 1

**Files:**
- Modify: `robot-reading/src/components/ReadingZone/StoryScreen.tsx`

**Approach:**
- Emoji `text-3xl md:text-4xl` 改为 `text-2xl md:text-4xl`（小屏缩小）
- `mb-1 md:mb-2` 缩减 emoji 下方间距
- 标题 `<h2>` 的 `text-xl md:text-2xl` 改为 `text-lg md:text-2xl`
- 说明段落 `<p className="text-gray-500 text-sm">Listen to the story</p>` 添加 `hidden md:block`（小屏隐藏）
- Header 整体 `mb-2 md:mb-4` 不变

**Patterns to follow:**
- CLAUDE.md 规则 3（字号响应式缩减）
- `StoryScreen.tsx:89-94`（当前标题实现）

**Test scenarios:**
- Happy path: 小屏下 StoryScreen 标题仅显示 emoji + 标题行，无说明段落
- Happy path: 大屏下完整标题、说明、间距与现在一致
- Edge case: 小屏横屏下标题不换行、故事文本可见

**Verification:**
- 小屏下标题区高度比改动前减少约 `1.5rem`，故事文本区获得对应空间

---

## System-Wide Impact

- **Interaction graph:** Tab Bar 是新增的交互入口，仅影响 `SessionScreen`。两个 zone 保持挂载，hook（`useSession`、`usePartSystem`）状态完全不受切换影响。
- **Error propagation:** 无新的错误路径，tab 状态是纯 UI 状态。
- **State lifecycle risks:** 需确认 `BonusTransition` 在 zone 隐藏期间不会中断——因为组件保持挂载，`useEffect` 定时器继续运行，过渡完成后 zone 内容正常更新。
- **API surface parity:** 无 API 变动。
- **Integration coverage:** 拖拽系统（`DraggableObject`、`PartsTray`）依赖 `containerRef` / `trayRef`，zone 隐藏（`hidden` class）不影响 ref 绑定和 DOM 节点存在。
- **Unchanged invariants:** 大屏（≥ md）所有布局、功能、视觉效果保持不变。

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `hidden` class 下拖拽事件的 `getBoundingClientRect()` 返回 0 | 隐藏的 zone 不接收拖拽事件（用户不可见），无实际风险 |
| ReadingAidsToolbar 水平模式在小屏横屏溢出 | 5 个按钮 × `min-width: 2.5rem` = 12.5rem，最小屏幕 375px 足够容纳 |
| `static md:absolute` 徽章切换导致大屏布局回归错误 | 需在大屏和小屏各自视觉验证 |
| Tab Bar 高度变化影响 `h-[calc(100vh-3.5rem)]` 精度 | 使用 flex 布局（`flex-col + flex-shrink-0 + flex-1 min-h-0`）替代 calc，更健壮 |

## Sources & References

- 相关已有计划: `docs/plans/2026-04-07-003-fix-small-screen-content-overflow-plan.md`
- SessionScreen 核心布局: `robot-reading/src/components/SessionScreen.tsx:317`
- CLAUDE.md 响应式规范: `robot-reading/CLAUDE.md`
