# Mood-Mirror 🌙

一个基于 AI 的个性化情绪日记分析应用，帮助你记录心情、获得温暖反馈，并通过数据可视化深入了解自己的情绪模式。

## ✨ 项目简介

Mood-Mirror 是一个现代化的情绪日记应用，结合了 AI 分析和数据可视化技术。你可以：

- 📝 **记录心情**：随时写下你的情绪和想法
- 🤖 **AI 分析**：选择不同角色（慈母/严师/老友）获得个性化反馈
- 📊 **数据可视化**：通过图表了解情绪趋势和模式
- 💡 **智能总结**：AI 自动生成周/月情绪总结，发现情绪规律

所有数据存储在本地（localStorage），保护你的隐私，无需担心数据泄露。

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
  <p><em>AI 总结与趋势分析</em></p>
</div>

## 🛠️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **AI 模型**: OpenAI GPT-4o-mini
- **数据可视化**: Recharts
- **数据存储**: localStorage（客户端存储）
- **部署**: Vercel（推荐）

## 🎯 核心功能

### 1. 首页 - 记录心情

- 📝 日记输入框，支持实时保存草稿
- 🎭 三种角色选择：
  - **慈母** 🤱：温柔包容，给予情感支持
  - **严师** 👨‍🏫：理性客观，提供成长建议
  - **老友** 👫：真诚共情，分享相似经历
- ✨ AI 自动分析情绪，提取潜意识关键词

### 2. 反馈页 - AI 分析结果

- 🔍 **潜意识情绪关键词**：AI 提取 1-2 个隐藏的情绪关键词
- 🏷️ **情绪标签**：从 12 种内置情绪中自动识别（快乐、焦虑、疲惫等）
- 💬 **角色反馈**：根据选择的角色生成 30-50 字的个性化反馈
- 💎 **治愈系金句**：一句温暖治愈的话语

### 3. 历史记录页

- 📚 查看所有历史记录
- 🗓️ 时间筛选：支持查看近 3 天/本周/本月的记录
- 🔍 显示原始日记内容（"我当时在想什么？"）
- 🗑️ 支持删除单条记录或清空所有记录

### 4. 总结页 - 数据可视化与 AI 总结

#### 📊 三种视图模式

1. **当天视图（Detail View）**
   - 折线图展示单日情绪强度变化
   - X 轴：时间窗口
   - Y 轴：情绪强度
   - Tooltip 显示主导情绪

2. **单日概览**
   - 饼图展示单日情绪分布占比
   - 直观了解一天中的情绪构成

3. **周/月趋势**
   - 折线图展示多日情绪趋势
   - X 轴：日期
   - Y 轴：平均情绪强度
   - 线条颜色表示每日主导情绪

#### ✨ AI 智能总结

- 📅 支持生成**本周**或**本月**的情绪总结
- 📈 总结内容包括：
  - **情绪走向**：最常出现的情绪、情绪分布、强度趋势、工作日/周末差异
  - **关键词回顾**：你经常提到的关键词和典型句子
- 🎯 只提供观察，不提供建议，专业且温暖

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm / yarn / pnpm

### 安装步骤

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
OPENAI_API_KEY=your_openai_api_key_here
```

> 💡 获取 OpenAI API Key：
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

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
mood-mirror/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/                # API 路由
│   │   │   ├── analyze/        # 情绪分析 API
│   │   │   └── summary/         # AI 总结 API
│   │   ├── feedback/           # 反馈页
│   │   ├── history/             # 历史记录页
│   │   ├── summary/             # 总结页
│   │   ├── layout.tsx           # 根布局
│   │   └── page.tsx             # 首页
│   ├── components/              # React 组件
│   │   ├── MainLayout.tsx       # 主布局组件
│   │   └── Sidebar.tsx           # 侧边栏导航
│   └── lib/                     # 工具函数
│       ├── analyzeMood.ts       # 情绪分析核心逻辑
│       └── generateSummary.ts   # AI 总结生成逻辑
├── public/                      # 静态资源
├── .env.local                   # 环境变量（需自行创建）
├── package.json
└── README.md
```

## 🎨 功能特性

### 内置情绪标签（12 种）

- **正向情绪（6 种）**：快乐、满足、平静、希望
- **负向情绪（6 种）**：伤心、愤怒、焦虑、恐惧、挫败、疲惫
- **中性/特殊（2 种）**：惊讶、中性

### 数据存储

- 所有数据存储在浏览器 `localStorage` 中
- 无需后端服务器，零部署成本
- 数据完全本地化，保护隐私

### 响应式设计

- 完美适配 Web 和移动端 H5
- 使用 Tailwind CSS 实现现代化 UI
- 支持深色模式

## 🔧 开发说明

### 技术亮点

1. **Prompt 工程**：精心设计的提示词确保 AI 输出可控，避免"胡说八道"
2. **延迟初始化**：OpenAI 客户端延迟初始化，避免模块加载时的环境变量错误
3. **类型安全**：完整的 TypeScript 类型定义
4. **性能优化**：使用 `useMemo` 优化计算密集型操作

### 自定义配置

- **修改 AI 模型**：在 `src/lib/analyzeMood.ts` 中修改 `model` 参数
- **调整情绪标签**：在 `src/lib/analyzeMood.ts` 中修改 `EMOTION_TAGS`
- **修改总结 prompt**：在 `src/lib/generateSummary.ts` 中调整 prompt 模板

## 📝 使用示例

1. **记录心情**
   - 在首页输入你的心情日记
   - 选择一个角色（慈母/严师/老友）
   - 点击"开始分析"

2. **查看反馈**
   - 查看 AI 分析的情绪关键词和标签
   - 阅读选定角色的个性化反馈
   - 查看治愈系金句

3. **浏览历史**
   - 在历史记录页查看所有记录
   - 使用时间筛选快速定位

4. **分析趋势**
   - 在总结页切换不同视图模式
   - 点击"生成本周/本月总结"获取 AI 分析

## 🚢 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在项目设置中添加环境变量 `OPENAI_API_KEY`
4. 部署完成！

### 其他平台

项目可以部署到任何支持 Next.js 的平台：
- Netlify
- Railway
- 自建服务器

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，欢迎通过 Issue 反馈。

---

Made with ❤️ using Next.js and OpenAI
