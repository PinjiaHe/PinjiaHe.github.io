# Academic website

基于 Astro 的静态学术网站。内容使用 Markdown 和 YAML 管理，共享组件负责页面呈现，GitHub Actions 完成检查并发布到 GitHub Pages。

## 项目结构

| 路径 | 用途 |
|---|---|
| `src/content/` | 页面、研究项目、成员、论文、文章与阅读资源 |
| `src/data/` | 网站配置、首页配置与来源记录 |
| `src/components/`、`src/layouts/` | 共享组件和页面布局 |
| `src/pages/` | 路由与页面模板 |
| `src/styles/` | 字体、颜色与布局样式 |
| `src/assets/` | 构建时处理的图片 |
| `public/` | 按原路径发布的静态资源 |
| `scripts/`、`tests/` | 内容校验、链接检查与测试 |

## 安装与开发

需要 Node.js 24 或更新版本。依赖版本以 `package-lock.json` 为准。

从仓库根目录执行：

```sh
cd site
npm ci
npm run dev
```

使用终端输出的地址预览。后续命令均在 `site/` 目录运行。

## 检查与构建

```sh
npm run check
npm test
npm run build
npm run check:links
```

这些命令依次检查类型和内容结构、运行测试、生成静态页面，并核对构建中的内部链接与资源。构建输出位于 `dist/`，可用 `npm run preview` 预览。

生产构建使用：

```sh
npm run build:production
npm run prepare:legacy-assets -- ..
npm run check:links:production
```

资源准备命令中的 `..` 指保留旧公开附件的仓库根目录，需要在完整 Git checkout 中执行。正式发布流程见 [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) 和 [GitHub Actions 工作流](../.github/workflows/deploy-pages.yml)。

## 内容维护

- 内容记录使用稳定的 ID；项目和文章使用固定 slug，避免标题调整改变地址。
- 使用 `visibility: public` 明确标记公开内容，草稿不进入普通构建。草稿状态不等同于访问权限，提交到公开仓库的文件仍然公开。
- 通过 ID 关联内容，复用数据与组件，避免多处维护同一信息。
- 可选资料缺失时省略字段，只添加已经确认且获准公开的内容。
- 修改后执行相关检查；不要提交登录凭据、本地配置、依赖目录或生成的构建文件。
