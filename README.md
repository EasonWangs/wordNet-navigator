# WordNet Navigator

> 现代化的 WordNet 可视化工具 - 基于 Vue 3 + TypeScript + Cytoscape.js

## ✨ 特性

- 🎨 **现代化界面** - 使用 Tailwind CSS 构建的美观响应式设计
- 📊 **交互式图形可视化** - 基于 Cytoscape.js 的强大图形渲染
- 🔍 **词汇关系探索** - 支持上位词、下位词、同义词、反义词等多种关系
- ⚡ **高性能** - Vite 构建工具提供极速开发体验
- 🎯 **类型安全** - 完整的 TypeScript 类型支持
- 🧪 **测试覆盖** - 配置 Vitest 测试框架
- 📦 **状态管理** - 使用 Zustand 进行轻量级状态管理

## 🚀 技术栈

- **前端框架**: Vue 3.4
- **语言**: TypeScript 5
- **构建工具**: Vite 5
- **样式方案**: Tailwind CSS 3
- **图形可视化**: Cytoscape.js 3
- **状态管理**: Pinia 2
- **测试框架**: Vitest
- **代码质量**: ESLint + Prettier

## 📦 安装

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

## 🛠️ 开发

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 📁 项目结构

```
wordNet-navigator/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── Header.vue       # 顶部标题栏
│   │   ├── Sidebar.vue      # 侧边栏搜索和筛选
│   │   ├── GraphCanvas.vue  # 图形画布容器
│   │   ├── NodeDetail.vue   # 节点详情面板
│   │   ├── Legend.vue       # 图例组件
│   │   └── Toolbar.vue      # 工具栏
│   ├── composables/         # Vue Composables
│   │   └── useCytoscape.ts  # Cytoscape 集成
│   ├── types/               # TypeScript 类型定义
│   │   └── wordnet.ts       # WordNet 数据类型
│   ├── utils/               # 工具函数
│   │   └── relationConfig.ts # 关系类型配置
│   ├── services/            # API 和数据服务
│   │   └── wordnetService.ts # WordNet 数据服务
│   ├── stores/              # Pinia 状态管理
│   │   └── graphStore.ts    # 图形状态 Store
│   ├── styles/              # 全局样式
│   │   └── index.css        # Tailwind 样式入口
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── .eslintrc.cjs            # ESLint 配置
└── .prettierrc              # Prettier 配置
```

## 🎯 核心功能

### 1. 词汇搜索
在侧边栏输入词汇，点击"加载词汇图谱"按钮即可可视化该词的关系网络。

### 2. 关系类型筛选
通过侧边栏的复选框可以筛选显示不同类型的词汇关系：
- **上位词** (Hypernym) - 更抽象的概念
- **下位词** (Hyponym) - 更具体的概念
- **同义词** (Synonym) - 意义相近的词
- **反义词** (Antonym) - 意义相反的词
- **部分词** (Meronym) - 整体的一部分
- **整体词** (Holonym) - 部分所属的整体

### 3. 布局调整
支持多种图形布局算法：
- 力导向布局 (Force-directed)
- 圆形布局 (Circle)
- 网格布局 (Grid)
- 层次布局 (Hierarchical)

### 4. 节点详情
点击任意节点可在右侧面板查看：
- 词汇定义
- 使用例句
- 词性标注

### 5. 导出功能
支持将当前图形导出为 PNG 图片。

## 🔧 配置说明

### TypeScript 配置
- 启用严格模式 (strict mode)
- 路径映射: `@/*` → `./src/*`
- 目标: ES2020

### Vite 配置
- 开发服务器端口: 3000
- 自动打开浏览器
- 生成 Source Map

### Tailwind CSS
- 扫描 `src` 目录下所有 `.tsx` 文件
- 自定义主题色 (primary, secondary)

## 🎨 设计系统

### 主题色
- Primary: `#667eea` (紫蓝色渐变)
- Secondary: `#764ba2` (紫色)

### 关系类型颜色
- 上位词: `#e74c3c` (红色)
- 下位词: `#3498db` (蓝色)
- 同义词: `#2ecc71` (绿色)
- 反义词: `#f39c12` (橙色)
- 部分词: `#9b59b6` (紫色)
- 整体词: `#1abc9c` (青绿色)

## 🔄 迁移说明

### 从原单文件版本迁移的改进

1. **模块化架构** - 从单文件 HTML 拆分为多个模块化组件
2. **类型安全** - 添加完整的 TypeScript 类型定义
3. **现代构建** - 使用 Vite 替代 CDN 引入
4. **状态管理** - 使用 Zustand 进行集中式状态管理
5. **样式系统** - 使用 Tailwind CSS 替代内联样式
6. **开发体验** - 热更新、类型检查、代码检查等

## 🚧 后续计划

- [ ] 接入真实 WordNet API
- [ ] 添加词汇搜索历史
- [ ] 支持多语言界面
- [ ] 添加更多可视化选项
- [ ] 性能优化 (虚拟化大型图形)
- [ ] 单元测试覆盖
- [ ] E2E 测试

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请提交 GitHub Issue。
