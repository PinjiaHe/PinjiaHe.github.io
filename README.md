# Academic website

基于 Astro 的静态学术网站，使用 Markdown 和 YAML 管理内容，通过 GitHub Pages 发布。

## 项目结构

| 路径 | 用途 |
|---|---|
| `site/` | 当前网站的源码、内容、资源与检查脚本 |
| `.github/workflows/` | 自动检查与发布流程 |
| `docs/DEPLOYMENT.md` | 生产构建与回退说明 |
| `files/`、`images/`、`assets/`、`data/` | 保留的旧公开资源，用于兼容既有链接 |

## 开发

需要 Node.js 24 或更新版本。从仓库根目录运行：

```sh
cd site
npm ci
npm run dev
```

使用终端输出的地址预览。更多内容维护和检查命令见 [网站说明](site/README.md)，发布流程见 [部署说明](docs/DEPLOYMENT.md)。

## 旧主题来源

保留的旧主题文件来自 [AcademicPages](https://academicpages.github.io/)，基于 [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/)。原有许可与版权说明保留于 [LICENSE](LICENSE)。
