# WordNet Navigator

> 现代化的 WordNet 可视化工具 - 基于 Vue 3 + TypeScript + Cytoscape.js

## 🚀 快速开始

**3 步快速体验：**

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 导入示例数据
访问 http://localhost:3001/admin/data
点击"导入为新项目"，选择 data/demo-data.json
```

**立即可用！** 导入后系统自动激活项目，在首页即可查看词汇关系图谱。

## ✨ 核心特性

### 可视化功能
- 🎨 **交互式图形** - 基于 Cytoscape.js 的强大图形渲染引擎
- 🔍 **词汇关系探索** - 支持上位词、下位词、同义词、反义词等 8 种关系类型
- 🎯 **智能布局** - 力导向、圆形、网格、层次等多种布局算法
- 🌈 **节点着色** - 根据关系数量自动着色，快速识别核心词汇
- 📊 **实时筛选** - 支持按关系类型动态筛选显示

### 数据管理
- 📁 **多项目支持** - 管理多个独立词汇项目，自由切换
- 📥 **批量导入** - 支持 Excel/CSV 批量导入词汇数据
- 💾 **项目管理** - 创建、重命名、导出、删除项目
- 🔄 **数据同步** - 自动保存项目修改
- 📤 **导入导出** - JSON 格式数据导入导出

### 技术架构
- ⚡ **高性能** - Vite 构建 + 批量处理优化
- 🎯 **类型安全** - 完整的 TypeScript 类型支持
- 📦 **状态管理** - Pinia 轻量级状态管理
- 🎨 **现代UI** - Tailwind CSS 响应式设计

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
├── data/                    # 示例数据文件
│   ├── demo-data.json       # 完整项目示例数据
│   └── CET-6.xlsx           # 英语六级词汇表
├── src/
│   ├── components/          # Vue 组件
│   │   ├── Header.vue       # 顶部标题栏
│   │   ├── GraphCanvas.vue  # 图形画布（主要可视化组件）
│   │   ├── Legend.vue       # 图例和关系类型筛选
│   │   └── ...
│   ├── views/               # 页面组件
│   │   ├── Viewer.vue       # 前台可视化页面
│   │   └── admin/           # 后台管理页面
│   │       ├── Words.vue    # 词汇管理
│   │       ├── Relations.vue # 关系类型管理
│   │       ├── PosTypes.vue # 词性类型管理
│   │       └── DataManagement.vue # 数据管理（项目管理）
│   ├── composables/         # Vue Composables
│   │   └── useCytoscape.ts  # Cytoscape 图形库集成
│   ├── types/               # TypeScript 类型定义
│   │   └── wordnet.ts       # WordNet 数据类型
│   ├── utils/               # 工具函数
│   │   └── relationConfig.ts # 关系类型配置
│   ├── services/            # 数据服务
│   │   ├── wordnetService.ts # WordNet 图形数据服务
│   │   └── storageService.ts # 本地存储服务（支持多项目）
│   ├── stores/              # Pinia 状态管理
│   │   ├── graphStore.ts    # 图形状态
│   │   └── adminStore.ts    # 后台管理状态
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
└── README.md                # 项目文档
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

## 💾 数据管理

### 多项目支持

应用支持管理多个独立的词汇项目：

- ✅ **项目切换** - 在不同项目间自由切换
- ✅ **独立存储** - 每个项目的数据完全独立
- ✅ **导入导出** - 支持导入/导出 JSON 格式数据
- ✅ **自动激活** - 首个导入的项目自动激活

**项目管理功能：**
- 创建项目（从当前工作区）
- 导入 JSON 为新项目
- 切换项目
- 重命名项目
- 导出项目数据
- 删除项目

**访问路径：** `/admin/data`

### 数据格式

**JSON 数据文件结构：**
```json
{
  "words": [
    {
      "id": "dog",
      "label": "dog",
      "phonetic": "/dɒg/",
      "posDefinitions": [
        { "pos": "noun", "definition": "驯养的食肉哺乳动物" }
      ],
      "examples": ["The dog barked loudly."]
    }
  ],
  "connections": [
    {
      "source": "dog",
      "target": "canine",
      "relation": "hypernym"
    }
  ],
  "relationTypes": [...],
  "posTypes": [...]
}
```

### Excel 导入格式

支持导入 Excel (.xlsx) 和 CSV 文件，格式要求：

| 词汇 | 音标 | 词性 | 定义 | 例句 |
|------|------|------|------|------|
| dog | /dɒg/ | noun | 驯养的食肉哺乳动物 | The dog barked. |

**批量导入流程：**
1. 准备 Excel 文件（参考 `data/CET-6.xlsx`）
2. 访问 `/admin/words`
3. 点击"批量导入"按钮
4. 选择文件并导入
5. 系统自动解析并添加词汇

## 🔄 技术架构

### 核心技术栈

1. **模块化架构** - 组件化开发，职责分离
2. **类型安全** - 完整的 TypeScript 类型定义
3. **现代构建** - Vite 提供极速开发体验
4. **状态管理** - Pinia 管理应用状态
5. **样式系统** - Tailwind CSS 响应式设计
6. **图形可视化** - Cytoscape.js 强大的图形渲染
7. **本地存储** - LocalStorage 支持多项目管理

## 🎯 使用指南

### 快速开始（使用示例数据）

项目提供了示例数据文件，位于 `data/` 目录：

#### 方式 1：导入完整项目数据（推荐）

使用 `data/demo-data.json` 快速体验完整功能：

1. 启动应用后，访问 `/admin/data`（数据管理页面）
2. 点击 **"📥 导入为新项目"**
3. 选择 `data/demo-data.json` 文件
4. 输入项目名称（如：Demo Project）
5. ✅ **系统自动激活项目**，立即可用！

**demo-data.json 包含：**
- ✅ 14 个英语词汇（dog, cat, puppy 等动物相关词汇）
- ✅ 24 条词汇关系（上位词、下位词、同义词等）
- ✅ 8 种关系类型配置（hypernym, hyponym, synonym 等）
- ✅ 10 种词性类型配置（名词、动词、形容词等）

导入后即可在前台查看词汇关系图谱！

#### 方式 2：批量导入词汇表

使用 `data/CET-6.xlsx` 批量导入大量词汇：

1. 访问 `/admin/words`（词汇管理页面）
2. 点击 **"批量导入"** 按钮
3. 选择 `data/CET-6.xlsx` 文件
4. 系统将自动导入 Excel 中的词汇数据
5. 导入完成后可手动添加词汇关系

**CET-6.xlsx 包含：**
- ✅ 英语六级词汇表
- ✅ 词汇、音标、词性、定义、例句等完整信息

**Excel 文件格式要求：**
```
列名：词汇 | 音标 | 词性 | 定义 | 例句
示例：dog  | /dɒg/ | n.  | 狗   | The dog barked.
```

### 从零开始

应用首次启动时为**空白状态**，您可以：

1. **配置基础类型**
   - 访问 `/admin/relations` 添加关系类型（如：上位词、下位词、同义词等）
   - 访问 `/admin/pos-types` 添加词性类型（如：名词、动词、形容词等）

2. **添加词汇数据**
   - 访问 `/admin/words` 手动添加词汇
   - 或使用批量导入功能导入 Excel/CSV 文件
   - 或从 JSON 文件导入完整项目数据

3. **创建项目**
   - 访问 `/admin/data` 数据管理页面
   - 点击 **"新建项目"** 将当前数据保存为项目
   - 支持创建多个项目并自由切换

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
