# Mood-Mirror 项目开发日志

## 2024年开发日志

---

## 今日开发总结（最新）

### 日期：2024年（当前会话）

### 主要工作内容

#### 1. 优化周月总结生成逻辑
**文件**：`src/lib/generateSummary.ts`

**改动**：
- 调整了 AI 总结的生成顺序和结构
- **第一部分（情绪走向）**：先说明本周/本月的整体情绪走向，包括：
  - 最常出现的情绪
  - 情绪分布情况
  - 情绪强度趋势（上升/下降/稳定）
  - 工作日和周末的情绪差异
- **第二部分（关键词/典型句）**：再说出用户经常提到的关键词或典型句
  - 使用"本周/本月你经常提到..."的句式
  - 先列出关键词，然后提取1-2个典型句子或表达作为补充
- 优化了示例内容的提取逻辑（从3条增加到5条，支持更长的内容截取）

**技术细节**：
- 更新了 prompt 模板，明确要求按照"先情绪走向，后关键词"的顺序组织内容
- 示例内容提取从 `content.substring(0, 50)` 改为 `content.substring(0, 80)`，提供更多上下文

---

#### 2. 图表图例位置调整
**文件**：`src/app/summary/page.tsx`

**改动**：
- 将折线图的图例（Legend）位置从默认位置调整到右下角
- 使用 `verticalAlign="bottom"` 和 `align="right"` 属性
- 影响两个图表：
  - 当天视图（Detail View）的"情绪强度"图例
  - 周/月趋势的"平均强度"图例

---

#### 3. 历史记录页面优化
**文件**：`src/app/history/page.tsx`

**改动**：
- 删除了"我当时在想什么？"的标题和图标
- 只保留原始日记内容的显示
- 内容仍然显示在灰色背景的卡片中，保持原有样式

---

#### 4. README.md 文档更新
**文件**：`README.md`

**改动**：
- 添加了3个页面截图（screenshots 文件夹）
- 更新了项目简介，添加了快速名言功能说明
- 详细描述了两种记录方式（文字输入和心情图标）
- 完整列出了8种固定角色及其描述
- 添加了自定义角色功能说明
- 更新了12种情绪标签的完整列表（包含中英文对照）
- 更新了使用示例，分为两种使用方式详细说明
- 更新了项目结构，添加新增的文件

---

#### 5. 心情图标选择功能实现
**文件**：`src/app/page.tsx`, `src/lib/iconToEmotion.ts`, `src/lib/generateQuote.ts`, `src/app/api/quote/route.ts`

**改动**：
- **新增功能**：用户可以选择心情图标或输入文字两种方式记录情绪
- **图标模式逻辑**：
  - 选择心情图标表示"不想说话"
  - 点击记录后，直接生成一句名言/金句
  - 不需要选择角色
  - 使用 `/api/quote` API 生成名言
- **12种心情图标**：
  - 😊 开心、😢 难过、😡 愤怒、😰 焦虑、😴 疲惫、😌 平静
  - 🤔 思考、😎 满足、😔 失落、😍 兴奋、😤 挫败、😐 中性
- **图标到情绪映射**：
  - 创建了 `iconToEmotion.ts` 文件
  - 每个图标映射到对应的12种情绪标签之一
  - 同时提供关键词映射
- **名言生成**：
  - 创建了 `generateQuote.ts` 文件
  - 根据心情图标生成温暖的名言或金句
  - 可以是经典名言、诗句或原创话语
  - 支持注明出处（如"—— 鲁迅"）

**技术实现**：
- 首页添加了输入模式切换（文字/图标）
- 图标模式时隐藏角色选择区域
- 提交逻辑区分图标模式和文字模式
- 图标模式使用特殊标记 `role: 'quote'` 存储
- 反馈页支持显示名言模式（只显示大号图标和名言）

---

#### 6. 角色系统扩展
**文件**：`src/lib/analyzeMood.ts`, `src/app/page.tsx`, `src/lib/customRoles.ts`, `src/lib/roleUtils.ts`

**改动**：
- **从3个角色扩展到8个固定角色**：
  1. 暖心慈母 🤱：情感兜底，包容接纳
  2. 理性严师 👨‍🏫：客观分析，精准提效
  3. 损友搭子 😄：吐槽解压，轻松破防
  4. 学习伙伴 📚：适配学习场景，并肩同行
  5. 职场前辈 💼：聚焦工作/日程管理
  6. 树洞倾听者 🌳：纯倾听，无评判
  7. 成长教练 🌟：聚焦自我成长，激发内驱力
  8. 禅意居士 🧘：佛系开导，缓解内耗

- **自定义角色功能**：
  - 创建了 `customRoles.ts` 管理自定义角色
  - 支持创建、编辑、删除自定义角色
  - 自定义角色存储在 localStorage
  - 首页添加了自定义角色管理 UI（模态框）

- **角色工具函数**：
  - 创建了 `roleUtils.ts` 统一管理角色信息获取
  - 提供 `getRoleInfo()` 获取角色名称、emoji、描述
  - 提供 `getRoleColor()` 获取角色颜色（用于 UI 显示）
  - 支持固定角色和自定义角色

- **Prompt 规整**：
  - 统一了 prompt 结构
  - 明确角色设定要求
  - 支持心情图标输入分析

---

#### 7. 情绪标签优化
**文件**：`src/lib/analyzeMood.ts`, `src/lib/iconToEmotion.ts`, `src/app/page.tsx`, `src/app/summary/page.tsx`

**改动**：
- **图标情绪识别修复**：
  - 修复了图标模式记录时所有情绪都被识别为 `neutral` 的问题
  - 创建了图标到情绪标签的映射函数
  - 每个图标正确映射到对应的12种情绪之一

- **情绪标签显示统一**：
  - 创建了 `getEmotionDisplayName()` 函数
  - 统一图表中主导情绪的显示格式
  - 只显示第一个词（如"快乐"而不是"快乐、开心"）
  - 确保所有图表使用相同的显示格式

- **情绪标签定义调整**：
  - `satisfaction` 从"满足、认可"改为"满足、认可"（保持原样）
  - 图标 😎 的 UI 标签从"自信"改为"满足"
  - 更新了相关注释和关键词映射

---

#### 8. 时间记录格式优化
**文件**：`src/app/page.tsx`, `src/app/summary/page.tsx`, `src/app/history/page.tsx`

**改动**：
- **时间格式统一**：
  - 从 `toLocaleString('zh-CN')` 改为 `toISOString()`
  - ISO 格式包含秒，确保精确性
  - 解决了同一分钟内多条记录无法区分的问题

- **当天视图时间窗口**：
  - 从 `HH:MM` 改为 `HH:MM:SS`
  - 包含秒，避免同一分钟内的记录在图表上重叠
  - 每条记录可以正确显示自己的情绪标签

- **历史记录时间显示**：
  - 格式化显示时间，包含秒
  - 使用 `toLocaleString('zh-CN', { ... })` 格式化

---

#### 9. API 路由更新
**文件**：`src/app/api/analyze/route.ts`, `src/app/api/quote/route.ts`

**改动**：
- **analyze API**：
  - 支持新的角色系统（固定角色 + 自定义角色）
  - 支持 `customRoles` 参数传递
  - 移除了对旧角色（mother/teacher/friend）的硬编码验证

- **quote API（新增）**：
  - 创建了 `/api/quote` 路由
  - 接收 `moodIcon` 参数
  - 调用 `generateQuote()` 生成名言
  - 返回名言字符串

---

#### 10. 页面组件更新
**文件**：`src/app/feedback/page.tsx`, `src/app/history/page.tsx`, `src/app/summary/page.tsx`

**改动**：
- **反馈页**：
  - 支持显示名言模式（`role === 'quote'`）
  - 名言模式只显示大号心情图标和名言
  - 文字模式显示完整的分析结果
  - 使用 `roleUtils` 获取角色信息

- **历史记录页**：
  - 角色筛选改为下拉选择（支持所有角色类型）
  - 使用 `roleUtils` 获取角色信息
  - 时间显示格式化

- **总结页**：
  - 更新了角色类型定义（从固定3个改为字符串）
  - 使用统一的情绪显示函数
  - 图例位置调整到右下角

---

### 技术架构变更

#### 新增文件
1. `src/lib/iconToEmotion.ts` - 图标到情绪映射
2. `src/lib/generateQuote.ts` - 名言生成逻辑
3. `src/lib/customRoles.ts` - 自定义角色管理
4. `src/lib/roleUtils.ts` - 角色工具函数
5. `src/app/api/quote/route.ts` - 名言生成 API

#### 修改的核心文件
1. `src/lib/analyzeMood.ts` - 角色系统扩展、prompt 规整
2. `src/app/page.tsx` - 两种记录方式、8个角色 + 自定义角色
3. `src/app/feedback/page.tsx` - 支持名言模式显示
4. `src/app/history/page.tsx` - 角色筛选优化、时间显示
5. `src/app/summary/page.tsx` - 情绪显示统一、图例位置
6. `src/app/api/analyze/route.ts` - 支持新角色系统

---

### 数据存储结构

#### localStorage 键名
- `mood_history` - 情绪记录历史
- `mood_draft` - 文字草稿
- `mood_draft_icon` - 图标草稿
- `mood_draft_mode` - 输入模式（'text' | 'icon'）
- `mood_custom_roles` - 自定义角色列表

#### 记录数据结构
```typescript
type MoodRecord = {
  id: number;
  content: string; // 文字内容或图标 emoji
  role: string; // 角色ID（固定角色或自定义角色ID，或 'quote' 表示名言模式）
  feedback: {
    keyWords: string[];
    emotionTag: EmotionTag; // 12种情绪标签之一
    feedback: string; // 角色反馈（文字模式）或空字符串（图标模式）
    slogan: string; // 治愈系金句（文字模式）或名言（图标模式）
  };
  createTime: string; // ISO 格式时间字符串
};
```

---

### 12种情绪标签完整列表

#### 正向情绪（4种）
1. `joy` - 快乐、开心
2. `satisfaction` - 满足、认可
3. `calm` - 平静、放松
4. `hope` - 希望、期待

#### 负向情绪（6种）
5. `sadness` - 伤心、低落
6. `anger` - 愤怒、生气
7. `anxiety` - 焦虑、紧张
8. `fear` - 恐惧、不安
9. `frustration` - 挫败、无力
10. `tired` - 疲惫、累

#### 中性/特殊（2种）
11. `surprise` - 惊讶
12. `neutral` - 中性、平静无波

---

### 图标到情绪映射表

| 图标 | 情绪标签 | 中文显示 |
|------|---------|---------|
| 😊 | joy | 快乐 |
| 😢 | sadness | 伤心 |
| 😡 | anger | 愤怒 |
| 😰 | anxiety | 焦虑 |
| 😴 | tired | 疲惫 |
| 😌 | calm | 平静 |
| 🤔 | neutral | 中性 |
| 😎 | satisfaction | 满足 |
| 😔 | sadness | 伤心 |
| 😍 | joy | 快乐 |
| 😤 | frustration | 挫败 |
| 😐 | neutral | 中性 |

---

### 8种固定角色列表

| 角色ID | 名称 | Emoji | 描述 |
|--------|------|-------|------|
| warm_mother | 暖心慈母 | 🤱 | 情感兜底，包容接纳。温柔、共情、鼓励，像家人一样给予安全感 |
| rational_teacher | 理性严师 | 👨‍🏫 | 客观分析，精准提效。一针见血、逻辑清晰，指出问题并给可执行建议 |
| funny_friend | 损友搭子 | 😄 | 吐槽解压，轻松破防。口语化、接地气、带点小调侃，用玩笑化解负面情绪 |
| study_partner | 学习伙伴 | 📚 | 适配学习场景，并肩同行。懂学习痛点，反馈结合「学习方法 + 心态调整」 |
| work_mentor | 职场前辈 | 💼 | 聚焦工作/日程管理。经验型、务实派，从「任务拆解/时间分配」角度疏导情绪 |
| listener | 树洞倾听者 | 🌳 | 纯倾听，无评判。不输出建议，只温柔回应，让用户感受到「被听见」 |
| growth_coach | 成长教练 | 🌟 | 聚焦自我成长，激发内驱力。积极正向、聚焦长期，引导用户从情绪中提炼成长点 |
| zen_master | 禅意居士 | 🧘 | 佛系开导，缓解内耗。温和、佛系，强调「顺其自然」，帮用户放下执念 |

---

### 关键设计决策

1. **图标模式不使用角色**：
   - 图标模式表示"不想说话"，直接生成名言
   - 简化流程，提升用户体验

2. **时间格式使用 ISO**：
   - 确保跨时区一致性
   - 包含秒，支持精确排序和区分

3. **情绪显示统一格式**：
   - 图表中只显示第一个词，保持简洁
   - 使用统一的辅助函数，确保一致性

4. **角色系统可扩展**：
   - 固定角色 + 自定义角色设计
   - 使用工具函数统一管理，便于维护

5. **Prompt 工程优化**：
   - 明确的结构和顺序要求
   - 支持图标输入分析
   - 确保 AI 输出可控

---

### 待优化点（未来工作）

1. **数据迁移**：
   - 旧数据中的 `role` 可能是旧的格式（mother/teacher/friend）
   - 需要兼容处理或数据迁移脚本

2. **性能优化**：
   - 大量历史记录时的图表渲染性能
   - localStorage 大小限制考虑

3. **用户体验**：
   - 图标模式的反馈页面可以进一步优化
   - 自定义角色的编辑体验可以改进

4. **错误处理**：
   - API 调用失败时的重试机制
   - 网络错误的友好提示

---

### 测试建议

1. **功能测试**：
   - 测试两种记录方式（文字和图标）
   - 测试8个固定角色的反馈
   - 测试自定义角色的创建、编辑、删除
   - 测试图标模式的名言生成

2. **数据测试**：
   - 测试同一分钟内多条记录的显示
   - 测试图表中情绪标签的正确显示
   - 测试历史记录的筛选功能

3. **兼容性测试**：
   - 测试旧数据的兼容性
   - 测试不同浏览器的 localStorage

---

### 环境变量

```env
OPENAI_API_KEY=your_openai_api_key_here
```

---

### 依赖版本

- Next.js: 16.1.1
- React: 19.2.3
- TypeScript: ^5
- Tailwind CSS: ^4
- OpenAI SDK: ^6.15.0
- Recharts: ^3.6.0

---

## 项目当前状态

### 已完成功能
✅ 两种记录方式（文字输入 + 心情图标）  
✅ 8种固定角色 + 自定义角色系统  
✅ 图标模式名言生成  
✅ 12种情绪标签识别  
✅ 数据可视化（3种视图模式）  
✅ AI 智能总结（周/月）  
✅ 历史记录筛选和管理  
✅ 响应式设计（Web + 移动端）  
✅ 深色模式支持  

### 核心文件清单
- `src/lib/analyzeMood.ts` - 情绪分析核心逻辑
- `src/lib/generateQuote.ts` - 名言生成逻辑
- `src/lib/generateSummary.ts` - AI 总结生成逻辑
- `src/lib/iconToEmotion.ts` - 图标到情绪映射
- `src/lib/customRoles.ts` - 自定义角色管理
- `src/lib/roleUtils.ts` - 角色工具函数
- `src/app/page.tsx` - 首页（记录心情）
- `src/app/feedback/page.tsx` - 反馈页
- `src/app/history/page.tsx` - 历史记录页
- `src/app/summary/page.tsx` - 总结页
- `src/app/api/analyze/route.ts` - 情绪分析 API
- `src/app/api/quote/route.ts` - 名言生成 API
- `src/app/api/summary/route.ts` - AI 总结 API
- `src/components/MainLayout.tsx` - 主布局
- `src/components/Sidebar.tsx` - 侧边栏导航

---

**日志结束**

*此日志用于记录项目开发进程，便于后续切换项目时快速了解当前状态和已完成的工作。*

