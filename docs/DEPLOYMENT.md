# GitHub Pages 发布

目标地址：<https://pinjiahe.github.io/>。仓库：`PinjiaHe/PinjiaHe.github.io`，发布分支：`master`。

## 生产构建

新版源代码位于仓库的 `site/`，旧 Jekyll 源代码及公开附件保留在原位置。GitHub Pages 使用 GitHub Actions，运行 `.github/workflows/deploy-pages.yml`。工作流安装锁定依赖，执行内容、类型、单元测试、生产构建和内部链接检查，全部通过后才部署。

从仓库的 `site/` 目录运行：

```sh
npm ci
npm run check
npm test
npm run build:production
npm run prepare:legacy-assets -- ..
npm run check:links:production
```

生产输出为 `site/dist/`；`PUBLIC_SITE_MODE=production` 控制可索引元数据及 robots。普通 `npm run build` 和本地开发仍禁止索引。404 始终禁止索引。站点位于域名根路径，不配置子路径 base，也不配置自定义域名。

资产准备步骤只复制旧仓库 Git HEAD 中 `files/`、`images/`、`assets/`、`data/` 下的普通公开文件，不跟随符号链接，不复制隐藏或认证文件，不覆盖不同内容的新文件。历史资产中的 HTML 原样保留，未按新版页面的排版和 SEO 规则重新审计。新版页面指向旧 PDF 的链接仍验证目标存在。

Team、Teaching、Services、CV、About 和 16 个旧论文详情地址提供静态 HTML 兼容跳转；这是 meta refresh 和普通链接，不是 HTTP 301。具体映射在 `site/src/data/legacy-redirects.ts`。

## 原版本与回退

上线前的旧站版本为 `72fb5208c3a187d049b4e8f5c7a1422c00d4e0be`。原 Pages 设置为 `build_type: legacy`、`master` 分支根目录 `/`、无自定义域名、HTTPS 开启。

需要回退时，先停止新版工作流触发，以旧版本的 Git tree 创建一个新提交（父提交使用当前 master），保留后续历史，不强制覆盖分支；然后将 Pages 恢复为上述原设置并等待构建。回退后实际访问首页、Team 与 PDF 验证，不能仅凭工作流结果宣称成功。

## 日常更新

修改 `site/src/content/` 中获准公开的 Markdown／YAML 后执行相关检查并提交到 `master`，工作流自动发布。PR 不执行生产部署；手动工作流只有 `master` 分支可部署。不要上传 `.env`、登录凭据、本地缓存、截图审阅材料或私人附件。
