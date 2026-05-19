# Puzzle Game

一个基于 React + TypeScript + Vite 构建的拼图游戏 Web 应用，支持图片裁剪、自定义拼图、拖拽排序和二维码分享功能。

## 功能特性

- 🖼️ **图片裁剪上传** - 支持选择本地图片并裁剪
- 🧩 **自定义拼图** - 可调整拼图行列数和难度
- 🔄 **拖拽排序** - 流畅的拼图块拖拽交互体验
- 📱 **二维码分享** - 生成拼图二维码方便分享
- 🎉 **庆祝动画** - 完成拼图后有烟花庆祝效果
- 💾 **本地存储** - 自动保存拼图进度

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router v7
- **状态管理**: Zustand
- **样式**: SCSS + CSS Modules
- **拖拽库**: @dnd-kit
- **二维码**: qrcode
- **图标**: lucide-react

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动开发服务器，访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # 通用组件
│   ├── CelebrationOverlay/   # 庆祝动画
│   ├── CreatePuzzle/         # 创建拼图
│   │   ├── ImageCropper.tsx  # 图片裁剪组件
│   │   └── index.tsx         # 创建拼图主组件
│   ├── FireworkCanvas/       # 烟花画布
│   ├── Layout/               # 布局组件
│   ├── PuzzleBoard/          # 拼图板
│   ├── PuzzleList/           # 拼图列表
│   ├── QRCodeModal/          # 二维码弹窗
│   ├── ResultScreen/         # 结果展示
│   └── Toast/                # 提示消息
├── pages/                # 页面组件
│   ├── HomePage.tsx          # 主页
│   ├── EditPage.tsx          # 编辑页面
│   ├── PlayPage.tsx          # 游戏页面
│   ├── ListPage.tsx          # 拼图列表页
│   └── ResultPage.tsx        # 结果页面
├── routes/               # 路由配置
├── store/               # 状态管理
├── styles/              # 全局样式
│   ├── variables.scss   # SCSS 变量
│   └── global.scss      # 全局样式
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
│   ├── indexedDB.ts     # IndexedDB 封装
│   ├── puzzle.ts        # 拼图相关工具
│   ├── qrcode.ts        # 二维码工具
│   └── storage.ts       # 本地存储工具
├── App.tsx              # 应用入口
└── main.tsx             # React 渲染入口
```

## 主要功能模块

### 创建拼图 (CreatePuzzle)

支持上传图片并通过裁剪框选择拼图区域，设置行列数后生成拼图。

### 拼图板 (PuzzleBoard)

核心游戏区域，支持：
- 拼图块拖拽交换位置
- 实时显示移动步数
- 拼图完成检测

### 二维码分享 (QRCodeModal)

将当前拼图配置编码为二维码，分享给其他用户快速开始游戏。

### 庆祝动画 (CelebrationOverlay)

拼图完成后播放烟花动画，提供视觉反馈。

## 开发指南

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/routes/index.tsx` 添加路由配置
3. 使用 Layout 组件包裹需要统一布局的页面

### 添加新组件

推荐使用以下文件结构：

```
src/components/YourComponent/
├── index.tsx              # 组件实现
├── index.module.scss       # 样式文件
└── types.ts               # 类型定义（可选）
```

### 样式规范

- 使用 CSS Modules 避免样式冲突
- 全局样式变量定义在 `src/styles/variables.scss`
- 遵循 BEM 命名规范

## 构建与部署

### 环境变量

创建 `.env` 文件配置环境变量：

```env
VITE_API_BASE_URL=your_api_url
```

### GitHub Pages 自动部署

项目已配置 GitHub Actions 自动部署，推送到 `main` 分支后自动构建并部署到 GitHub Pages。

**配置步骤：**

1. 在 GitHub 仓库的 Settings → Pages 中，设置 Source 为 `GitHub Actions`
2. 推送代码到 `main` 分支，GitHub Actions 会自动运行部署流程
3. 部署完成后，访问 `https://<your-username>.github.io/puzzleGame/`

**部署工作流配置：**

- 文件位置：`.github/workflows/deploy.yml`
- 触发条件：`main` 分支 push 事件或手动触发
- 构建命令：`yarn build --mode deploy`
- 部署目标：GitHub Pages

**注意事项：**

- `vite.config.ts` 中的 `base` 配置为 `/puzzleGame/`（根据实际仓库名称调整）
- 确保 GitHub Pages 权限已正确配置（Settings → Actions → General → Workflow permissions）

### 手动部署

构建完成后，将 `dist` 目录部署到任意静态服务器即可。

Nginx 配置示例：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## License

MIT
