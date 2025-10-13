# 项目环境配置指南

## ⚠️ Node.js 版本要求

此项目使用 Vite 5 作为构建工具，**必须使用 Node.js 18 或更高版本**。

当前系统检测到的 Node 版本: **v16.13.0** (不支持)

## 🔧 升级 Node.js

### 方法 1: 使用 nvm (推荐)

```bash
# 安装 nvm (如果还没安装)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node 18
nvm install 18

# 使用 Node 18
nvm use 18

# 设置为默认版本
nvm alias default 18
```

### 方法 2: 使用官方安装包

访问 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本 (18.x 或更高)

## 📦 安装依赖

升级 Node.js 后，重新安装依赖：

```bash
# 清理旧的 node_modules
rm -rf node_modules package-lock.json

# 安装依赖 (推荐使用 pnpm)
npm install -g pnpm
pnpm install

# 或使用 npm
npm install
```

## 🚀 启动项目

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 🔍 验证环境

运行以下命令检查 Node 版本：

```bash
node -v  # 应该显示 v18.x.x 或更高
```

## 常见问题

### Q: 为什么需要 Node 18+？
A: Vite 5 依赖 Node 18+ 的新特性，包括原生 crypto API 等。

### Q: 可以使用 Node 16 吗？
A: 不可以。必须升级到 Node 18 或更高版本才能运行此项目。

### Q: 升级 Node 会影响其他项目吗？
A: 使用 nvm 可以在不同项目间切换 Node 版本，不会相互影响。

## 📝 项目已完成的配置

✅ React 18 + TypeScript 项目结构
✅ Vite 5 构建配置
✅ Tailwind CSS 样式系统
✅ Cytoscape.js 图形可视化
✅ Zustand 状态管理
✅ ESLint + Prettier 代码规范
✅ Vitest 测试框架
✅ 完整的组件模块化架构

所有代码已经准备就绪，升级 Node.js 后即可运行！
