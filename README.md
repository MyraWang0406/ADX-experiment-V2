# AI 搜广推实验可视化 Dashboard

基于 Next.js 14 App Router 构建的实验数据可视化平台，用于分析和展示广告实验数据。

## 功能特性

- 📊 实验数据可视化
- 🔍 多维度数据分析
- 📈 实时指标监控
- 🎯 决策支持系统

## 技术栈

- **框架:** Next.js 14 (App Router)
- **语言:** TypeScript
- **样式:** Tailwind CSS
- **图表:** Recharts

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 部署

### Cloudflare Pages

1. 连接 GitHub 仓库到 Cloudflare Pages
2. 构建命令: `npm run build`
3. 输出目录: `.next`
4. Node.js 版本: 18.x 或更高

详细部署说明请查看 [DEPLOY.md](./DEPLOY.md)

## 项目结构

```
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
├── lib/                    # 工具函数和类型定义
├── public/                 # 静态资源
└── scripts/               # 工具脚本
```

## 联系作者

- 邮箱: myrawzm0406@163.com
- 电话: 15301052620

## License

Private
