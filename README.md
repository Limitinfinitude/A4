# Mood-Mirror 🌙

一个基于 AI 的个性化情绪日记应用，帮助你记录心情、获得温暖反馈，并通过数据可视化深入了解自己的情绪模式。

## ✨ 项目简介

Mood-Mirror（情绪镜像）是一个现代化的情绪日记应用，结合了 AI 分析和数据可视化技术。通过不同认知角色的 AI 反馈，帮助你从多个维度理解自己的情绪状态。

### 核心理念

- 🎭 **认知差异，非风格差异**：8 种角色代表 8 种看问题的角度，而非仅仅是语气差异
- 🔒 **隐私第一**：所有数据存储在本地（localStorage），零服务器存储
- 🤖 **AI 洞察，非诊断**：AI 提供观察和陪伴，遵守伦理边界，不做诊断和指导
- 📊 **数据可视化**：通过图表直观了解情绪趋势和模式

---

## 📸 界面预览

<div align="center">
  <img src="./screenshots/1.png" alt="首页 - 记录心情" width="800" />
  <p><em>首页 - 文字记录心情</em></p>
</div>

<div align="center">
  <img src="./screenshots/2.png" alt="首页 - 心情图标" width="800" />
  <p><em>首页 - 图标记录心情</em></p>
</div>

<div align="center">
  <img src="./screenshots/3.png" alt="历史记录与数据可视化" width="800" />
  <p><em>历史记录与数据可视化</em></p>
</div>

<div align="center">
  <img src="./screenshots/4.png" alt="AI 总结与趋势分析" width="800" />
  <p><em>AI 洞察与趋势分析</em></p>
</div>

---

## 🎯 核心功能

### 1. 📝 记录心情（首页）

#### 两种记录方式

**文字输入模式**
- 日记输入框，支持实时保存草稿
- 选择角色获得个性化 AI 反馈
- AI 自动生成情绪标签（2-3 个，自由表达）
- 获得角色的深度反馈（60-100 字）
- 收到一句温暖的"一记一句"

**心情图标模式**
- 12 种心情图标快速选择（开心、难过、愤怒、焦虑等）
- 无需输入文字，适合不想说话的时候
- 直接获取一句温暖的"一记一句"

#### 🎭 角色系统（8 种固定角色 + 自定义）

每个角色代表一种**认知维度**和**看问题的角度**，并匹配原神角色的语气和风格：

| 角色 ID | 角色名称 | 认知维度 | 核心问题 | 原神角色 | 头像 |
|---------|---------|----------|---------|---------|------|
| `warm_companion` | 温暖陪伴者 | 情感支持 | "你感受到了什么？" | 派蒙 | 🎈 |
| `rational_analyst` | 理性分析者 | 逻辑思考 | "事情的本质是什么？" | 艾尔海森 | 📖 |
| `encouraging_supporter` | 鼓励支持者 | 行动力 | "你需要什么支持？" | 琴 | ⚔️ |
| `practical_advisor` | 实用建议者 | 具体方法 | "具体怎么做？" | 胡桃 | 🦋 |
| `accepting_listener` | 接纳倾听者 | 无评判倾听 | "你想被听见什么？" | 芭芭拉 | 🎵 |
| `perspective_shifter` | 视角转换者 | 换位思考 | "换个角度会怎样？" | 温迪 | 🍃 |
| `problem_solver` | 问题解决者 | 目标达成 | "障碍在哪里？" | 魈 | ⚡ |
| `growth_guide` | 成长引导者 | 长期发展 | "这对你意味着什么？" | 钟离 | 🪨 |

**自定义角色**
- 支持创建、编辑、删除自定义角色
- 可自定义角色名称、描述和头像（base64 上传）
- 完全个性化你的情绪反馈体验

### 2. 💬 反馈页面

**分析结果**
- **情绪标签**：AI 判断的 2-3 个情绪标签，不局限于固定词汇
  - 例如：「疲惫」「焦虑」「期待」「失落」「释然」「矛盾」
- **内部标准标签**：12 种标准情绪标签（仅用于内部统计，不对用户显示）

**角色反馈**
- 根据选择的角色，从其认知维度给出反馈
- 使用角色的语气和风格（原神角色设定）
- 60-100 字，分 2-3 个层次展开

**一记一句**
- 一句温暖、治愈的话语
- 与当前情绪状态相关，给予力量或安慰

### 3. 📚 历史记录页

- 查看所有历史记录（文字和图标记录）
- **时间筛选**：近 3 天 / 本周 / 本月
- **角色筛选**：按角色过滤记录
- **记录编辑**：支持编辑记录内容和情绪标签
- **删除记录**：支持删除单条记录或清空所有记录
- **角色快照**：即使角色被删除，历史记录仍能正确显示

### 4. 📊 AI 洞察页（总结页）

#### 数据可视化

1. **当天视图**
   - 折线图展示单日情绪强度变化
   - X 轴：时间窗口，Y 轴：情绪强度

2. **单日概览**
   - 饼图展示单日情绪分布占比

3. **周/月趋势**
   - 折线图展示多日情绪趋势
   - 线条颜色表示每日主导情绪

#### AI 洞察总结

- **三个时间段**：近 3 天 / 本周 / 本月
- **洞察内容**：
  - 情绪走向（最常出现的情绪、分布、强度趋势）
  - 时间模式（工作日 vs 周末差异）
  - 角色使用偏好
  - 情绪修正闭环（用户是否修正了 AI 的情绪判断）
- **伦理边界**：只提供观察，不做诊断和建议

### 5. ⚙️ 设置页面

- **数据管理**
  - 查看数据统计（总记录数、自定义角色数、存储大小）
  - 导出数据（JSON / Markdown 格式）
  - 导入数据（恢复备份）
  - 清空所有数据

- **AI 模型配置**
  - 查看当前使用的模型名称
  - 修改模型名称（支持第三方 API）
  - 重置为默认模型

- **自定义角色管理**
  - 查看、编辑、删除自定义角色
  - 创建新角色

### 6. 🔧 调试页面（隐藏）

- **访问方式**：
  - URL: `/debug`
  - 或双击侧边栏底部的 "Made with ❤️"
- **密码保护**：默认密码 `12345678`
- **功能**：
  - 修改 API URL（支持第三方兼容 API）
  - 修改 API Key
  - 修改模型名称（快速选择 + 自定义输入）

### 7. 🔒 隐私说明页

- 说明数据存储方式
- 隐私保护措施
- 数据安全边界

---

## 🛠️ 技术栈

- **框架**: [Next.js 16.1.1](https://nextjs.org/) (App Router + Turbopack)
- **语言**: TypeScript 5
- **UI 框架**: React 19.2
- **样式**: Tailwind CSS 4
- **AI 模型**: OpenAI API（GPT-4o-mini / 自定义模型）
- **数据可视化**: Recharts 3.6
- **数据存储**: localStorage（客户端存储）
- **部署**: Docker / Vercel（推荐）

---

## 📁 项目结构

### 目录树

```
mood-mirror/
├── src/
│   ├── app/                          # Next.js App Router 页面
│   │   ├── api/                      # API 路由
│   │   │   ├── analyze/route.ts      # 情绪分析 API
│   │   │   ├── quote/route.ts        # 一记一句生成 API
│   │   │   └── summary/route.ts      # AI 洞察总结 API
│   │   ├── debug/page.tsx            # 调试页面（隐藏）
│   │   ├── feedback/page.tsx         # 反馈页面
│   │   ├── history/page.tsx          # 历史记录页面
│   │   ├── privacy/page.tsx          # 隐私说明页面
│   │   ├── settings/page.tsx         # 设置页面
│   │   ├── summary/page.tsx          # AI 洞察页面
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 首页（记录心情）
│   │   └── globals.css               # 全局样式
│   │
│   ├── components/                   # React 组件
│   │   ├── MainLayout.tsx            # 主布局组件（内容区域）
│   │   └── Sidebar.tsx               # 侧边栏导航组件
│   │
│   └── lib/                          # 核心业务逻辑库
│       ├── analyzeMood.ts            # 情绪分析核心逻辑
│       ├── config.ts                 # 应用配置（模型名称等）
│       ├── customRoles.ts            # 自定义角色管理
│       ├── emotionColors.ts          # 情绪颜色映射
│       ├── generateQuote.ts          # 一记一句生成逻辑
│       ├── generateSummary.ts        # AI 洞察总结生成逻辑
│       ├── iconToEmotion.ts          # 图标到情绪映射
│       └── roleUtils.ts              # 角色工具函数
│
├── public/                           # 静态资源
│   ├── avatars/                      # 角色头像
│   │   ├── warm_companion.png        # 派蒙
│   │   ├── rational_analyst.png      # 艾尔海森
│   │   ├── encouraging_supporter.png # 琴
│   │   ├── practical_advisor.png     # 胡桃
│   │   ├── accepting_listener.png    # 芭芭拉
│   │   ├── perspective_shifter.png   # 温迪
│   │   ├── problem_solver.png        # 魈
│   │   ├── growth_guide.png          # 钟离
│   │   └── default.png               # 默认头像
│   └── screenshots/                  # 截图
│
├── .env.local                        # 环境变量（需自行创建）
├── docker-compose.yml                # Docker Compose 配置
├── Dockerfile                        # Docker 镜像配置
├── package.json                      # 项目依赖
├── tsconfig.json                     # TypeScript 配置
├── next.config.ts                    # Next.js 配置
├── tailwind.config.ts                # Tailwind CSS 配置
└── README.md                         # 项目文档
```

### 模块说明

#### 📄 页面模块（`src/app/`）

| 文件 | 功能 | 主要特性 |
|------|------|---------|
| `page.tsx` | 首页 - 记录心情 | 文字/图标双模式、角色选择、草稿保存 |
| `feedback/page.tsx` | 反馈页面 | 显示 AI 分析结果和角色反馈 |
| `history/page.tsx` | 历史记录页面 | 时间/角色筛选、编辑、删除、角色快照 |
| `summary/page.tsx` | AI 洞察页面 | 数据可视化、AI 总结生成 |
| `settings/page.tsx` | 设置页面 | 数据备份/恢复、模型配置、角色管理 |
| `debug/page.tsx` | 调试页面 | API 配置、模型配置（密码保护） |
| `privacy/page.tsx` | 隐私说明页面 | 隐私政策、数据安全说明 |

#### 🔌 API 模块（`src/app/api/`）

| API | 功能 | 请求方法 | 请求参数 |
|-----|------|---------|---------|
| `/api/analyze` | 情绪分析 | POST | `content`, `role`, `stream` |
| `/api/quote` | 一记一句生成 | POST | `moodIcon` |
| `/api/summary` | AI 洞察总结 | POST | `period`, `data` |

#### 🧩 组件模块（`src/components/`）

| 组件 | 功能 |
|------|------|
| `MainLayout.tsx` | 主布局组件，包含侧边栏和内容区域 |
| `Sidebar.tsx` | 侧边栏导航，支持路由切换和调试页面入口 |

#### 📚 核心库模块（`src/lib/`）

| 文件 | 功能 | 主要导出 |
|------|------|---------|
| `analyzeMood.ts` | 情绪分析核心逻辑 | `analyzeMood()`, `analyzeMoodStream()`, `FIXED_ROLES`, `EMOTION_TAGS` |
| `config.ts` | 应用配置管理 | `getModelName()`, `setModelName()`, `resetModelName()` |
| `customRoles.ts` | 自定义角色管理 | `getCustomRoles()`, `saveCustomRole()`, `deleteCustomRole()` |
| `emotionColors.ts` | 情绪颜色映射 | `getEmotionColor()`, `EMOTION_COLORS` |
| `generateQuote.ts` | 一记一句生成 | `generateQuote()` |
| `generateSummary.ts` | AI 洞察总结 | `generateSummary()` |
| `iconToEmotion.ts` | 图标到情绪映射 | `iconToEmotionTag()`, `iconToKeywords()` |
| `roleUtils.ts` | 角色工具函数 | `getRoleInfo()`, `getRoleColor()` |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装步骤

#### 方式一：本地开发

1. **克隆项目**

```bash
git clone <your-repo-url>
cd mood-mirror
```

2. **安装依赖**

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **配置环境变量**

在项目根目录创建 `.env.local` 文件：

```env
# OpenAI API Key（必需）
OPENAI_API_KEY=your_openai_api_key_here

# 可选：自定义模型名称（默认 gpt-4o-mini）
OPENAI_MODEL=gpt-4o-mini

# 可选：自定义 API Base URL（支持第三方兼容 API）
# OPENAI_BASE_URL=https://api.openai.com/v1
```

> 💡 **获取 OpenAI API Key**：
> 1. 访问 [OpenAI Platform](https://platform.openai.com/)
> 2. 注册/登录账号
> 3. 进入 API Keys 页面创建新密钥
> 4. 将密钥复制到 `.env.local` 文件中

4. **启动开发服务器**

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

5. **打开浏览器**

访问 [http://localhost:3000](http://localhost:3000) 即可使用应用。

#### 方式二：Docker 部署

1. **构建镜像**

```bash
docker-compose build
```

2. **启动容器**

```bash
docker-compose up -d
```

3. **访问应用**

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 是否必需 |
|--------|------|--------|---------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | - | ✅ 是 |
| `OPENAI_MODEL` | AI 模型名称 | `gpt-4o-mini` | ❌ 否 |
| `OPENAI_BASE_URL` | API Base URL | `https://api.openai.com/v1` | ❌ 否 |

### 模型配置

#### 支持的模型

- **OpenAI 官方模型**：`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **第三方兼容模型**：任何兼容 OpenAI API 格式的模型

#### 配置方式

1. **环境变量**（服务器端优先）
   ```env
   OPENAI_MODEL=gpt-4o-mini
   ```

2. **设置页面**（客户端）
   - 访问设置页面 → AI 模型配置 → 修改模型名称

3. **调试页面**（临时）
   - 访问 `/debug` → 修改模型名称

**优先级**：环境变量 > localStorage > 默认值

### 第三方 API 配置

如果使用第三方 API（如 Cloudflare AI、Azure OpenAI 等）：

1. 在调试页面修改 API URL 和 API Key
2. 设置兼容的模型名称
3. 确保 API 兼容 OpenAI 格式

> ⚠️ **注意**：某些第三方 API 可能不支持 `max_completion_tokens` 参数，已自动移除以确保兼容性。

---

## 📊 数据结构

### MoodRecord（情绪记录）

```typescript
type MoodRecord = {
  id: number;                    // 记录 ID（时间戳）
  content: string;               // 记录内容（文字或图标）
  role: string;                  // 角色 ID
  roleSnapshot?: RoleSnapshot;   // 角色快照（防止删除后丢失）
  feedback: MoodAnalysisResult;  // AI 分析结果
  createTime: string;            // 创建时间（ISO 8601）
  originalEmotionTag?: string;   // 原始情绪标签（用于闭环洞察）
};
```

### MoodAnalysisResult（分析结果）

```typescript
type MoodAnalysisResult = {
  emotionLabels?: string[];      // AI 生成的情绪标签（2-3 个）
  keyWords?: string[];           // 旧版本兼容字段
  emotionTag: string;            // 内部标准情绪标签（12 种之一）
  feedback: string;              // 角色反馈内容
  slogan: string;                // 一记一句
};
```

### CustomRole（自定义角色）

```typescript
type CustomRole = {
  id: string;                    // 角色 ID（UUID）
  name: string;                  // 角色名称
  emoji: string;                 // 角色 Emoji
  avatar?: string;               // 角色头像（base64）
  description: string;           // 角色描述
};
```

### RoleSnapshot（角色快照）

```typescript
type RoleSnapshot = {
  name: string;                  // 角色名称
  emoji: string;                 // 角色 Emoji
  avatar?: string;               // 角色头像
  description?: string;          // 角色描述
};
```

### 内置情绪标签（12 种）

```typescript
const EMOTION_TAGS = {
  // 正向情绪（4 种）
  joy: { en: 'joy', zh: '快乐' },
  satisfaction: { en: 'satisfaction', zh: '满足' },
  calm: { en: 'calm', zh: '平静' },
  hope: { en: 'hope', zh: '希望' },
  
  // 负向情绪（6 种）
  sadness: { en: 'sadness', zh: '伤心' },
  anger: { en: 'anger', zh: '愤怒' },
  anxiety: { en: 'anxiety', zh: '焦虑' },
  fear: { en: 'fear', zh: '恐惧' },
  frustration: { en: 'frustration', zh: '挫败' },
  tired: { en: 'tired', zh: '疲惫' },
  
  // 中性/特殊（2 种）
  surprise: { en: 'surprise', zh: '惊讶' },
  neutral: { en: 'neutral', zh: '中性' },
};
```

---

## 🎨 功能特性详解

### 1. 角色系统的认知维度设计

每个角色不仅有独特的语气和风格，更重要的是代表一种**看问题的角度**：

| 认知维度 | 核心问题 | 适用场景 |
|---------|---------|---------|
| 情感支持 | "你感受到了什么？" | 需要情感共鸣和陪伴 |
| 逻辑思考 | "事情的本质是什么？" | 需要理性分析和拆解 |
| 行动力 | "你需要什么支持？" | 需要鼓励和行动动力 |
| 具体方法 | "具体怎么做？" | 需要实用的解决方案 |
| 无评判倾听 | "你想被听见什么？" | 只想倾诉，不想被评价 |
| 换位思考 | "换个角度会怎样？" | 需要打破固有思维 |
| 目标达成 | "障碍在哪里？" | 需要解决具体问题 |
| 长期发展 | "这对你意味着什么？" | 需要长远视角和成长引导 |

### 2. AI 提示词工程

为确保 AI 输出可控、有用、符合伦理，项目使用了精心设计的 Prompt 工程：

**核心原则**：
- 🎯 **输出格式化**：强制 JSON 输出，确保结构化解析
- 🔒 **伦理边界**：明确禁止诊断、指导、说教
- 🎭 **角色一致性**：通过 `characterPrompt` 确保角色设定不 OOC
- 📏 **长度控制**：反馈 60-100 字，分 2-3 个层次展开
- 💡 **洞察 > 总结**：AI 洞察关注模式和深层观察，而非简单总结

### 3. 数据隐私和安全

- **本地存储**：所有数据存储在浏览器 `localStorage`，不经过服务器
- **无后端数据库**：零服务器存储成本，零数据泄露风险
- **API Key 安全**：API Key 仅在服务器端使用，客户端不可见
- **数据备份**：支持导出 JSON / Markdown，用户完全掌控数据
- **可删除性**：支持清空所有数据，一键删除

### 4. 响应式设计

- 完美适配桌面端（1920px+）、平板端（768px-1024px）、手机端（375px-768px）
- 使用 Tailwind CSS 的响应式工具类
- 支持深色模式（自动跟随系统）

### 5. 第三方 API 兼容性

- 移除了 `max_completion_tokens` 参数，确保兼容性
- 支持自定义 API Base URL
- 支持自定义模型名称
- 详细的错误日志，方便调试

---

## 📝 使用示例

### 场景一：工作压力记录

1. **记录心情**
   - 输入："今天工作太多了，感觉快要崩溃了..."
   - 选择角色：**实用建议者（胡桃）**
   - 点击"记录心情"

2. **查看反馈**
   - **情绪标签**：「压力」「疲惫」「焦虑」
   - **角色反馈**：
     > "嘿，工作多是一回事，但咱们得分个轻重缓急！先把今天必须做的列出来，其他的明天再说。累了就休息，别硬撑，毕竟你又不是铁打的！"
   - **一记一句**：
     > "慢慢来，比较快。—— 台湾谚语"

3. **查看趋势**
   - 在 AI 洞察页查看本周情绪趋势
   - 发现"疲惫"情绪在周三和周五较高
   - AI 洞察提示："你似乎在工作日中段和末尾感到更疲惫，可能需要调整工作节奏"

### 场景二：快速记录心情

1. **选择图标模式**
   - 不想打字，直接选择 😔（失落）
   - 点击"记录心情"

2. **查看一记一句**
   - "低谷是成长的起点，抬头就能看见星光。"

### 场景三：数据备份

1. **导出数据**
   - 进入设置页面
   - 点击"导出为 JSON"或"导出为 Markdown"
   - 下载到本地保存

2. **导入数据**
   - 更换设备后，进入设置页面
   - 点击"导入数据"
   - 选择之前导出的 JSON 文件
   - 确认导入，数据恢复完成

---

## 🚢 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在项目设置中添加环境变量：
   - `OPENAI_API_KEY`: 你的 OpenAI API Key
   - `OPENAI_MODEL`: (可选) 模型名称
4. 部署完成！

### Docker 部署

1. **克隆项目**

```bash
git clone <your-repo-url>
cd mood-mirror
```

2. **配置环境变量**

编辑 `docker-compose.yml`，添加环境变量：

```yaml
environment:
  - OPENAI_API_KEY=your_openai_api_key_here
  - OPENAI_MODEL=gpt-4o-mini
```

3. **构建并启动**

```bash
docker-compose up -d
```

4. **访问应用**

访问 [http://localhost:3000](http://localhost:3000)

### 其他平台

项目可以部署到任何支持 Next.js 的平台：
- Netlify
- Railway
- Cloudflare Pages
- 自建服务器

---

## 🔧 开发指南

### 技术亮点

1. **Prompt 工程**
   - 精心设计的提示词确保 AI 输出可控
   - 避免"胡说八道"和"说教"
   - 遵守伦理边界

2. **延迟初始化**
   - OpenAI 客户端延迟初始化，避免模块加载时的环境变量错误
   - 在函数调用时才创建客户端实例

3. **类型安全**
   - 完整的 TypeScript 类型定义
   - 所有 API 响应都有类型校验

4. **性能优化**
   - 使用 `useMemo` 优化计算密集型操作
   - 使用 `useCallback` 避免不必要的重渲染
   - 草稿自动保存，防止数据丢失

5. **错误处理**
   - 完善的错误捕获和提示
   - API 错误的详细日志
   - 用户友好的错误信息

### 自定义配置

#### 修改 AI 模型

在 `src/lib/config.ts` 中修改默认模型：

```typescript
const DEFAULT_MODEL = 'gpt-4o-mini';
```

#### 调整情绪标签

在 `src/lib/analyzeMood.ts` 中修改 `EMOTION_TAGS`：

```typescript
export const EMOTION_TAGS = {
  // 添加新的情绪标签
  excited: { en: 'excited', zh: '兴奋' },
  // ...
};
```

#### 修改总结 Prompt

在 `src/lib/generateSummary.ts` 中调整 `prompt` 模板。

#### 添加新角色

在 `src/lib/analyzeMood.ts` 的 `FIXED_ROLES` 中添加新角色：

```typescript
export const FIXED_ROLES: Record<FixedRole, { ... }> = {
  // ...
  new_role: {
    name: '新角色',
    emoji: '🌟',
    avatar: '/avatars/new_role.png',
    description: '简短描述',
    promptDescription: '详细的 AI 提示词描述',
    focusDimension: '认知维度',
    coreQuestion: '核心问题',
    responseStyle: '回应风格',
    characterPrompt: '角色设定和语气风格...',
  },
};
```

### 代码规范

- **文件命名**：使用 camelCase（`analyzeMood.ts`）
- **组件命名**：使用 PascalCase（`MainLayout.tsx`）
- **函数命名**：使用 camelCase（`getRoleInfo()`）
- **类型命名**：使用 PascalCase（`MoodRecord`）
- **常量命名**：使用 UPPER_SNAKE_CASE（`EMOTION_TAGS`）

### 提交规范

使用 Conventional Commits 规范：

- `feat: 添加新功能`
- `fix: 修复 bug`
- `docs: 更新文档`
- `style: 代码格式调整`
- `refactor: 重构代码`
- `perf: 性能优化`
- `test: 添加测试`
- `chore: 构建/工具链调整`

---

## 🐛 已知问题

1. **第三方 API 兼容性**
   - 某些第三方 API 可能不支持 `response_format: { type: 'json_object' }`
   - 已移除 `max_completion_tokens` 参数以提高兼容性

2. **localStorage 限制**
   - 浏览器 localStorage 通常有 5-10MB 限制
   - 大量记录可能导致存储不足
   - 建议定期导出备份并清理旧数据

3. **暗色模式**
   - 部分图表颜色在暗色模式下可能不够明显
   - 后续版本将优化

---

## 📈 未来计划

- [ ] 支持更多数据可视化图表类型
- [ ] 添加情绪日历视图
- [ ] 支持标签系统（自定义标签）
- [ ] 添加情绪提醒功能
- [ ] 支持多语言（英文、日文）
- [ ] 移动端 App（React Native）
- [ ] 数据加密存储
- [ ] 云同步功能（可选）

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本项目
2. 创建特性分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'feat: Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 开启 Pull Request

---

## 📮 联系方式

如有问题或建议，欢迎通过 Issue 反馈。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [OpenAI](https://openai.com/) - AI 模型支持
- [Tailwind CSS](https://tailwindcss.com/) - UI 框架
- [Recharts](https://recharts.org/) - 数据可视化
- [原神](https://genshin.hoyoverse.com/) - 角色灵感来源

---

<div align="center">

**Made with ❤️ using Next.js and OpenAI**

[⬆ 回到顶部](#mood-mirror-)

</div>
