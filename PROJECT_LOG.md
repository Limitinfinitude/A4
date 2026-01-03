# Mood Mirror 架构说明

## 📐 系统架构概览

Mood Mirror 采用 **前后端分离 + AI Agent 服务端** 的架构设计，基于 Next.js 全栈框架构建。

```
┌─────────────────────────────────────────────────────────────┐
│                      客户端层 (Client)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  首页    │  │ 历史记录 │  │  统计    │  │  设置    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         React 19 + TypeScript + Tailwind CSS               │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/JSON
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  API 路由层 (Next.js API Routes)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/analyze │  │ /api/quote   │  │ /api/summary │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Agent 服务端 (AI Agent Server)                │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ analyzeMood()    │  │ generateQuote()  │                 │
│  │ - 情绪分析       │  │ - 名言生成       │                 │
│  │ - 角色反馈       │  │ - 图标分析       │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐                                       │
│  │ generateSummary()│                                       │
│  │ - 数据统计       │                                       │
│  │ - 趋势分析       │                                       │
│  └──────────────────┘                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI 服务层 (OpenAI API)                      │
│              GPT-4 / GPT-3.5 / Claude / Gemini                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 架构分层详解

### 1. 客户端层 (Client Layer)

**技术栈：**
- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **数据可视化**: Recharts
- **状态管理**: React Hooks (useState, useEffect)
- **数据存储**: localStorage (客户端本地存储)

**主要页面：**
- `/` - 首页：记录心情（文字/图标双模式）
- `/history` - 历史记录：查看、编辑、删除历史
- `/summary` - 统计页面：数据可视化和 AI 洞察
- `/feedback` - 反馈页面：展示 AI 分析结果
- `/settings` - 设置页面：数据备份、角色管理
- `/privacy` - 隐私说明页面
- `/debug` - 调试页面：AI 模型配置

**核心组件：**
- `MainLayout` - 主布局组件（包含侧边栏）
- `Sidebar` - 侧边栏导航组件

---

### 2. API 路由层 (API Routes Layer)

**位置**: `src/app/api/`

**API 端点：**

#### `/api/analyze` - 情绪分析 API
- **功能**: 分析用户输入的情绪内容，生成情绪标签、角色反馈和一记一句
- **请求体**:
  ```json
  {
    "content": "用户输入的文字或心情图标",
    "role": "角色ID（固定角色或自定义角色）",
    "customRoles": [可选] 自定义角色列表,
    "stream": false  // 可选，是否流式输出
  }
  ```
- **响应**:
  ```json
  {
    "emotionLabels": ["情绪标签1", "情绪标签2"],
    "emotionTag": "joy",
    "feedback": "角色的反馈内容",
    "slogan": "一记一句"
  }
  ```

#### `/api/quote` - 名言生成 API
- **功能**: 根据心情图标生成情绪分析和一记一句
- **请求体**:
  ```json
  {
    "moodIcon": "😊"
  }
  ```
- **响应**: 同 `/api/analyze` 的响应格式

#### `/api/summary` - 统计总结 API
- **功能**: 生成指定时间段的情绪统计和 AI 洞察
- **请求体**:
  ```json
  {
    "summaryData": {
      "total_records": 10,
      "emotion_distribution": {...},
      "trend_analysis": {...}
    }
  }
  ```
- **响应**:
  ```json
  {
    "summary": "AI 生成的统计总结文本"
  }
  ```

---

### 3. AI Agent 服务端 (AI Agent Server)

**位置**: `src/lib/`

这是项目的**核心 AI 服务层**，负责所有 AI 相关的业务逻辑。

#### 3.1 情绪分析 Agent (`analyzeMood.ts`)

**核心函数**: `analyzeMood()`

**功能**:
- 接收用户输入（文字或图标）
- 根据选择的角色生成个性化反馈
- 识别情绪标签（1-3个，每个1-7字）
- 生成标准情绪标签（12种内置标签）
- 生成一记一句（温暖治愈的话语）

**Agent 工作流程**:
1. **输入处理**: 解析用户输入和角色信息
2. **Prompt 构建**: 根据角色设定构建 AI Prompt
3. **AI 调用**: 调用 OpenAI API 进行情绪分析
4. **结果解析**: 解析 JSON 格式的 AI 响应
5. **数据验证**: 验证返回数据的完整性和格式
6. **结果返回**: 返回结构化的情绪分析结果

**支持的角色系统**:
- **8 种固定角色**: 温暖陪伴者、理性分析师、鼓励支持者等
- **自定义角色**: 用户可创建自定义 AI 角色

#### 3.2 名言生成 Agent (`generateQuote.ts`)

**核心函数**: `generateQuote()`

**功能**:
- 根据心情图标分析情绪状态
- 生成情绪标签和一记一句
- 返回完整的 `MoodAnalysisResult` 对象

#### 3.3 统计总结 Agent (`generateSummary.ts`)

**核心函数**: `generateSummary()`

**功能**:
- 分析历史情绪数据
- 生成情绪趋势洞察
- 提供个性化的情绪模式总结

#### 3.4 配置管理 (`config.ts`)

**功能**:
- 管理 OpenAI API 客户端
- 支持多模型切换（GPT-4, GPT-3.5, Claude, Gemini）
- 环境变量管理

#### 3.5 角色工具 (`roleUtils.ts`)

**功能**:
- 角色信息获取和匹配
- 角色快照管理
- 自定义角色处理

---

### 4. AI 服务层 (AI Service Layer)

**AI 提供商**: OpenAI (主要)

**支持的模型**:
- GPT-4
- GPT-3.5-turbo
- Claude (Anthropic)
- Gemini (Google)

**API 调用方式**:
- 使用 `openai` SDK 进行 API 调用
- 支持 JSON 格式输出 (`response_format: { type: 'json_object' }`)
- 支持流式输出（可选）

---

## 🔄 数据流

### 记录心情流程

```
用户输入（文字/图标）
    ↓
客户端验证
    ↓
POST /api/analyze
    ↓
analyzeMood() Agent
    ↓
构建 Prompt（包含角色设定）
    ↓
调用 OpenAI API
    ↓
解析 AI 响应
    ↓
返回 MoodAnalysisResult
    ↓
存储到 localStorage
    ↓
跳转到反馈页面
```

### 查看统计流程

```
用户点击"统计"页面
    ↓
从 localStorage 读取历史数据
    ↓
计算统计数据（情绪分布、趋势）
    ↓
POST /api/summary
    ↓
generateSummary() Agent
    ↓
调用 OpenAI API 生成洞察
    ↓
返回统计总结
    ↓
展示数据可视化图表
```

---

## 💾 数据存储

### 客户端存储 (localStorage)

**存储项**:
- `mood_history` - 情绪记录历史（JSON 数组）
- `custom_roles` - 自定义角色列表（JSON 数组）
- `mood_draft` - 草稿内容（临时）
- `debug_config` - 调试配置（模型选择等）

**数据格式**:
```typescript
interface MoodRecord {
  id: number;
  content: string;
  role: string;
  roleSnapshot: {
    name: string;
    emoji: string;
    avatar?: string;
    description: string;
  };
  feedback: MoodAnalysisResult;
  createTime: string; // ISO 8601 格式
}
```

**隐私保护**:
- ✅ 所有数据存储在用户本地浏览器
- ✅ 零服务器存储
- ✅ 支持数据导出/导入（JSON/Markdown）

---

## 🎯 AI Agent 设计理念

### Agent 的核心能力

1. **情绪理解**: 理解用户的情绪状态和需求
2. **角色扮演**: 根据不同角色设定提供差异化反馈
3. **智能分析**: 从多个维度分析情绪（情感理解、问题结构、行动建议等）
4. **个性化**: 根据历史数据提供个性化洞察

### Agent 的边界

- ✅ **提供观察和陪伴**: AI 提供情绪观察和情感支持
- ✅ **遵守伦理边界**: 不做诊断、不开药、不提供医疗建议
- ✅ **尊重隐私**: 所有数据本地存储，不上传服务器

---

## 🔧 技术特性

### 响应式设计
- 支持桌面端、平板、移动端
- 使用 Tailwind CSS 响应式类

### 深色模式
- 支持系统主题切换
- 使用 Tailwind 的 `dark:` 前缀

### 性能优化
- Next.js 自动代码分割
- 客户端路由（无页面刷新）
- localStorage 缓存

### 错误处理
- API 错误捕获和用户友好提示
- 网络错误重试机制
- 数据验证和类型检查

---

## 📦 项目结构

```
mood-mirror/
├── src/
│   ├── app/                    # Next.js 页面和路由
│   │   ├── page.tsx            # 首页
│   │   ├── history/            # 历史记录页
│   │   ├── summary/            # 统计页面
│   │   ├── feedback/           # 反馈页面
│   │   ├── settings/           # 设置页面
│   │   ├── privacy/            # 隐私页面
│   │   ├── debug/              # 调试页面
│   │   └── api/                # API 路由
│   │       ├── analyze/        # 情绪分析 API
│   │       ├── quote/          # 名言生成 API
│   │       └── summary/        # 统计总结 API
│   ├── components/             # React 组件
│   │   ├── MainLayout.tsx      # 主布局
│   │   └── Sidebar.tsx         # 侧边栏
│   └── lib/                    # AI Agent 服务端核心逻辑
│       ├── analyzeMood.ts      # 情绪分析 Agent
│       ├── generateQuote.ts    # 名言生成 Agent
│       ├── generateSummary.ts  # 统计总结 Agent
│       ├── config.ts           # AI 配置管理
│       ├── roleUtils.ts        # 角色工具函数
│       ├── customRoles.ts      # 自定义角色管理
│       └── emotionColors.ts    # 情绪颜色映射
├── public/                     # 静态资源
│   └── avatars/                # 角色头像
├── screenshots/                # 项目截图
├── .env.local                  # 环境变量（需自行创建）
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript 配置
├── README.md                   # 项目说明
└── ARCHITECTURE.md             # 架构说明（本文件）
```

---

## 🚀 部署架构

### 开发环境
```bash
npm run dev  # 启动开发服务器 (localhost:3000)
```

### 生产环境
- **平台**: Vercel / Docker / 其他 Next.js 兼容平台
- **构建**: `npm run build`
- **启动**: `npm start`

### Docker 部署
项目包含 `Dockerfile` 和 `docker-compose.yml`，支持容器化部署。

---

## 🔐 安全与隐私

### 数据安全
- ✅ 所有数据存储在用户本地（localStorage）
- ✅ 不向服务器上传任何用户数据
- ✅ API 密钥存储在服务端环境变量

### API 安全
- ✅ API 路由仅接受 POST 请求
- ✅ 请求参数验证
- ✅ 错误信息不泄露敏感信息

---

## 📝 总结

Mood Mirror 的 **AI Agent 服务端** 位于 `src/lib/` 目录，通过 `analyzeMood.ts`、`generateQuote.ts`、`generateSummary.ts` 等模块实现智能情绪分析、角色反馈和统计洞察功能。这些 Agent 通过 Next.js API 路由（`src/app/api/`）对外提供服务，客户端通过 HTTP 请求调用这些服务。

**核心特点**:
- 🎯 **AI Agent 架构**: 独立的 AI 服务层，职责清晰
- 🔄 **前后端分离**: Next.js 全栈框架，统一技术栈
- 🛡️ **隐私优先**: 本地存储，零服务器数据
- 🎨 **角色系统**: 8 种固定角色 + 自定义角色
- 📊 **数据可视化**: Recharts 图表展示

---

*最后更新: 2026年1月3日*

