# Floer.io

Floer.io 是一个现代化的全栈 Web 应用程序，使用 TypeScript 构建。

## 项目结构

项目采用 monorepo 结构，使用 pnpm workspace 进行管理：

- `client/` - 前端应用（基于 Vite）
- `server/` - 后端服务
- `common/` - 共享代码和类型定义

## 技术栈

### 前端
- TypeScript
- Vite
- ESLint

### 后端
- TypeScript
- Node.js

## 开发环境要求

- Node.js (推荐最新 LTS 版本)
- pnpm (包管理器)

## 安装

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/floer.io.git
cd floer.io
```

2. 安装依赖：
```bash
pnpm install
```

## 开发

### 启动开发服务器

启动所有服务：
```bash
pnpm dev
```

仅启动前端：
```bash
pnpm dev:client
```

仅启动后端：
```bash
pnpm dev:server
```

### 构建

构建所有项目：
```bash
pnpm build
```

### 代码检查

运行 ESLint 检查：
```bash
pnpm lint
```

运行 CI 环境下的代码检查：
```bash
pnpm lint:ci
```

## 贡献

我们欢迎任何形式的贡献，包括但不限于：

- 提交 Bug 报告
- 提出新功能建议
- 改进文档
- 提交代码修改

### 如何贡献

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 GPL-3.0 许可证 - 详见 [LICENSE](LICENSE) 文件

## 作者

- Leia (leia@tutamail.com)

## 贡献者

<a href="https://github.com/c2x/floer.io/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=c2x2n/floer.io" />
</a>