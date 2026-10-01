# Pinjia He — academic website

Astro 静态学术网站，内容来自所有者批准的资料及可核查的公开来源。正式地址为 https://pinjiahe.github.io/，源代码位于原 GitHub Pages 仓库的 `site/`；旧 Jekyll 源码与公开附件保留。GitHub Actions 运行检查后发布，详见仓库 `docs/DEPLOYMENT.md`。

## 启动与预览

在项目根目录执行：

```sh
cd /Users/pinjia/Dropbox/Codex/homepage/site
npm ci
npm run dev
```

打开 http://127.0.0.1:4321/ 。只有本机可访问。页面包括 `/`、`/lab/`、`/join/`、`/research/`、`/research/openrca/`、`/research/utboost/`、`/research/cipherchat/`、`/research/logpai/`、`/publications/`、`/notes/` 和 `/404.html`。

普通终端中前台服务用 Ctrl+C 退出。Astro 7 在本次 Codex 环境自动使用后台模式，使用 `npm run dev:stop` 停止。切换草稿模式前先停止现有开发服务：

```sh
npm run dev:stop
npm run dev:drafts
```

此时 `/notes/markdown-layout-test/` 可查看明确标注的测试文章。测试源在 `tests/fixtures/notes/`，作者为 Test fixture；不是 Pinjia 的公开文章。测试后运行 `npm run dev:stop`，再 `npm run dev` 恢复普通模式。草稿模式仍不是隐私或权限机制。

查看静态构建（先停止同端口的开发服务）：

```sh
npm run dev:stop
npm run build
npm run preview
```

浏览器仍访问 http://127.0.0.1:4321/ 。后台预览停止命令为 `npm run preview:stop`。

## 检查命令

以下命令全部在 `site/` 执行，结果见 `../docs/STATUS.md`。

| 命令 | 检查内容 |
|---|---|
| `npm run check` | Astro/TypeScript、schema、稳定 ID、引用、必需页面公开状态、本地资产 |
| `npm test` | 多段 membership、日期、排名口径、可选字段、指导关系与一作区别、旧汇总保留 |
| `npm run build` | 先验证内容，再生成 `dist/`；无远程数据抓取 |
| `npm run check:links` | 构建内链接／锚点／资源、单 h1、noindex、草稿泄漏 |
| `npm run test:browser` | 已启动的普通本机站点，9 路由 × 6 宽度、轮播、导航、键盘、无 JS、截图 |
| `node scripts/check-draft.mjs` | 已启动的显式草稿模式，Markdown 文章与手机截图 |

浏览器脚本使用 Playwright 和本机安装的 Google Chrome（隔离临时 profile），无需登录；其他环境需安装 Chrome 或将 launch 的 channel 改为已安装的浏览器。截图写到 `../docs/screenshots/`，不进入 `dist/`。受限环境中的监听端口／浏览器启动可能需要本机进程权限。

已锁定：Node 24.20.0（本项目最低 24.0；校验脚本使用 Node 原生 TypeScript 支持）、npm 11.19.0、Astro 7.3.5、TypeScript 6.0.3、@astrojs/check 0.9.10、YAML 2.9.1、Playwright 1.63.0。依赖以 `package-lock.json` 为准。CLI 脚本关闭 Astro telemetry，避免写用户全局配置。

## 内容编辑入口

| 要改什么 | 文件 |
|---|---|
| 身份、人才称号（distinction）、邮箱、学术链接、个人照片 | `src/data/site.yaml` |
| 首页定位、两条主线、Bio；Lab Mission／Join Us | `src/content/pages/home.md`、`lab.md` |
| 首页 Teaching／Service 两段简介 | `src/content/pages/teaching.md`、`service.md` |
| 代表作首页顺序 | `src/data/homepage.yaml` 中的项目 ID |
| 项目摘要、叙事、相关论文 ID | `src/content/projects/<id>.md` |
| 成员教育、在组经历、公开论文汇总、历史去向 | `src/content/people/<id>.md` |
| 论文、准确作者贡献、指导关系、奖项与链接 | `src/content/publications/<id>.md` |
| 原创公开文章 | `src/content/notes/<id>.md`，字段模板见 `tests/fixtures/notes/` |
| 外部推荐阅读 | `src/content/resources/<id>.yaml` |
| 首页 Lab 照片与顺序 | `src/assets/lab/`，见下方维护方法 |
| 字体、颜色、密度、布局、图标 | `src/styles/` 和 `src/components/` |

每条记录的文件名与 `id` 一致；文章/项目 `slug` 固定，改标题不会改 URL。`visibility` 缺省为 `draft`；公开条目必须显式 `public`。项目正文只有一份，首页和 Research 引用相同摘要；论文关联通过 `publicationIds`；成员关联从论文作者的 `personId` 查询。Pinjia 的作者强调使用 `authorId: pinjia-he`。

项目卡片的会议／年份行由 `publicationIds` 自动生成，例如 ICLR25，不用另外维护。Explore this work 优先使用项目的 `links.website` 官网／GitHub 入口，没有主页则使用 `links.paper` 论文地址；只有两者都缺省时才回退到已有站内详情。当前四项均直接指向外部主页或论文，不需另建页面。卡片标题保留已有站内详情入口。

成员缺少照片、排名、去向时完全省略。不要将测试排名附加在真人名下。一个人的多段经历写在同一份 `memberships`；当前身份在 Current 展示。仅在所有者指定的 completed 阶段填写 `alumniOrder`，即可按该值在 MPhil & MSc Students 展示历史阶段；留组读博者仍只计一个唯一人物，历史阶段使用独立锚点，只展示阶段身份／时间／Next，成果在 Current 展示。无 active membership 的离组硕士校友入口也显示已有的 Publications 和 Awards。Postdoc & Visiting 合并显示并沿用紧凑两列布局。原 Team 页的旧一作汇总完整保留；论文 `+` 单独保存在 `supervised`。已明确核实的共同一作另记 `contribution: co-first`。

论文页按年份倒序，同年同一会议的论文相邻；会议组按现有 year／order 顺序中首次出现的位置排列，组内顺序保留，Findings 等 track 不拆成另一会议。论文页用下划线显示 `supervised` 的作者，上标 `+` 显示已核实的共同一作。作者标记按原站依据或所有者对指定论文的确认填写，不自动传播到其他论文。`links.paper` 填已核实的 PDF、DOI 或论文落地页；本次 more_papers 批次优先用 DBLP electronic edition，缺失时省略，既有链接保留。可选 `links.artifact` 填代码／数据入口；核对来源保留在 `sources`。Research Track、Long Papers 不额外显示，特殊轨道照常显示。奖项加到论文的 `awards`；企业使用证据写在项目的 `evidence`，设置 `kind: industry-use`、准确的 `label`／`text`、`sourceUrl` 和 `asOf`，通过项目的 `publicationIds` 自动出现在对应论文的链接上方。可选 `organizations` 数组逐项填写 `name`、`sourceUrl` 与 `logo`（当前支持 `anthropic`／`microsoft`），在浅色标签中显示独立公司链接和本地图标；没有公司数组时仍显示普通证据标签。

新增文章可复制测试模板的字段，放进 `src/content/notes/`，删除全部测试正文，填写已批准公开的真实标题、作者、正文和状态；**不要直接把测试文件改为 public**。所有日常内容编辑后运行 `npm run check`、`npm run build`、`npm run check:links`。

## 更新研究卡片的引用与 stars

在论文文件 `src/content/publications/<id>.md` 中维护 `citations`，在项目文件 `src/content/projects/<id>.md` 中维护 `githubStars`。两者均包含 `sourceUrl`、整数 `count` 和 `retrievedAt`（获取日期，例如 `2026-09-28`）。引用链接使用 Google Scholar，stars 链接使用对应 GitHub 仓库；数字是人工核实的本地快照，更新时同时更改日期。没有引用数时省略 `count`，只显示 Scholar 入口，不填 0 或猜测值。

会议与引用徽标按项目的 `publicationIds` 顺序显示；多篇论文在空间足够时每行两组，窄屏自动变为一列，每篇会议与引用保持成组。一个项目的 stars 只放在第一篇旁边。LogPAI 第一行是 Drain（ICWS17）、日志异常检测（ISSRE16），第二行是 Loghub（ISSRE23）、工具集（ICSE-SEIP19）。徽标全部由本地 SVG／HTML 渲染，不依赖远程图片或实时接口。

引用徽标只显示 Scholar 图标和数字，不显示 Citations 字样或数字后的星号。`estimated: true` 仍保存在来源记录内，相关解释保留在悬停提示和无障碍标签中；不要为了展示简化而删掉原始口径。

Publications 与项目详情中的论文条目也复用同一份指标，在 Paper／Artifact 之后显示引用。GitHub stars 从关联项目读取，只有 `githubStars.sourceUrl` 与该论文的 `links.artifact` 相同时才显示，避免把项目仓库的 stars 错配到其他论文；不在论文文件复制 stars 数字。

## 替换代表作图片

当前图片为真实公开材料，未生成示意数据：OpenRCA 来自 Anthropic 的 Claude Opus 4.6 发布页评测图；CipherChat 来自作者项目首页解释思路的首张示意图；LogPAI 使用 IBM Drain 案例中的日志事件／异常分数图；UTBoost 使用 ACL 2025 论文 Figure 2。OpenRCA 图注中的 Claude Opus 4.6、LogPAI 图注中的 network outage monitoring 链接各自来源；CipherChat 与 UTBoost 图注为普通文字。UTBoost 图注省略括号中的图号和会议，原图来源仍记录在项目 sources 与来源文档中。点击图片均可看原图。

- OpenRCA：直接替换 `public/images/projects/openrca.png`。
- CipherChat：直接替换 `public/images/projects/cipherchat.jpg`。
- LogPAI：直接替换 `public/images/projects/logpai-ibm-drain.png`；先前的 `logpai.jpg` 标识保留但不再引用。
- UTBoost：直接替换 `public/images/projects/utboost-figure-2.png`；原论文图的提取记录见 `../docs/utboost-figure-source-notes.md`。
- 同名同格式图片替换无需修改组件；如换格式／路径，修改对应 `src/content/projects/<id>.md` 的 `cover`。
- 同时维护 `coverAlt`、`coverCaption`，确保图注符合新图事实。可选 `coverSourceUrl` 为图注添加来源链接；`coverLinkText` 指定只链接图注中的一段原文，例如 OpenRCA 的 `Claude Opus 4.6`。没有图片时移除这些字段，界面自动省略，不放虚构占位图。
- 图片完整显示在 16:9 容器中，不裁切图表。首页、Research、详情共用这一份配置。
- 卡片因同排内容长度不同产生的额外留白，平均分配到图片和图注的上下，不再全部堆在图片上方。

运行 `npm run check`、`npm run build`、`npm run check:links` 后预览。图片来源记录见 `../docs/project-image-sources.md` 和 `../docs/cipherchat-source-notes.md`。

## 添加或更换 Lab 照片

把照片放到 **`site/src/assets/lab/`**（从本 README 所在目录看是 `src/assets/lab/`）。支持 JPG/JPEG、PNG、WebP、AVIF，大小写扩展名均可；不扫描子文件夹，无需修改代码或填写相册清单。

1. 用文件名前面的数字控制顺序，如 `01-group-gathering.jpg`、`02-conference-gathering.jpg`、`06-lab-outing.jpg`。
2. 文件名去掉编号和扩展名、将连字符改为空格后，会作为图片的替代文字；使用简短、准确的英文描述即可。
3. 新增、替换或移除照片后，刷新本地预览；若新增文件尚未出现，在 `site/` 执行 `npm run dev:stop`、`npm run dev`。静态站点需重新执行 `npm run build` 才会更新输出。

当前九张由所有者提供，项目副本只移除不必要的照片元数据，原始文件不改动。后续添加前也应使用适合公开的照片副本。页面通过 [Astro Image](https://docs.astro.build/en/guides/images/) 自动生成不同尺寸的 WebP，不直接加载数 MB 的相机原图；推荐保留至少 1200px 的源图宽度，无需手动统一比例。

首页使用自适应 **3:2 相框**，完整显示横图与竖图，相框透明，照片周围与 Lab 区域背景一致。每 3 秒切换；桌面鼠标移入或键盘焦点进入时，图片下方显示无边框的左右箭头，手机／触屏上箭头常显。不显示数字计数、文字按钮或播放开关。悬停、键盘操作、离开可见区域或切到其他标签页时暂停自动切换。开启系统“减少动态效果”时只使用箭头手动翻页。关闭 JavaScript 时显示首张照片；只有一张时不显示箭头；目录为空时省略相册。已有 `src/data/homepage.yaml` 的 `showLabPhoto` 可整体隐藏相册。

## 数据覆盖与边界

当前为 **4 项研究（首页展示 OpenRCA、CipherChat、LogPAI）、40 篇论文、70 位成员（30 当前学生、23 位非当前校友／RA、17 位本科生；两个既有成员另展示已完成硕士阶段）、3 个推荐资源、9 张首页 Lab 照片**；另有首页 Teaching／Service 简介与 Before You Apply 页面。资料来源与逐条核查范围见 `src/data/source-ledger.yaml` 和 `../docs/STATUS.md` 顶部最新轮次。

- 相关页面保留内容子集说明，不从子集推算团队人数；按所有者界面反馈移除了全站顶部 Prototype / Partial content 提示行。
- 首页 H-03 数字指标卡保持省略；About 段落按所有者本轮确认写入数字下界和来源链接，不做实时计数。没有真实个人排名；首页 Lab 左栏显示 Mission 与按钮，右栏轮播所有者提供的照片，手机上下排列。不根据照片推导成员名单、身份或人数。
- 代表作是有来源的候选编辑摘要，最终策展和措辞待所有者反馈。
- 原创 Notes 暂无公开文章；草稿模板能力已实现，普通构建排除测试目录。
- Teaching／Service 使用旧站、公开 CV 与官方会议记录的精简内容，分别作为首页独立区块，不生成独立页面。课程和服务职位仅用 Markdown 斜体。按反馈删除页脚旧站链接与 CV。发布时保留旧公开附件，并为 `/team/`、Teaching、Services、CV、About 和旧论文详情提供静态兼容跳转。
- 本地预览设 noindex；正式构建使用原域名根路径，提供 canonical 和 robots，404 保持 noindex。部署工作流位于 `.github/workflows/deploy-pages.yml`。
- 网站本身没有 live API、数据库、CMS、跟踪脚本或远程字体依赖。

本地预览使用 4321 入口。日常修改仍先通过相关检查，再提交到发布分支；GitHub Pages 的部署与回退步骤见 `docs/DEPLOYMENT.md`。

## 添加本科实习生与更新成员

每人一份 `src/content/people/<id>.md`，页面自动读取，无需再维护姓名清单。可复制现有 `haotian-xie.md` 的结构，替换文件名、`id`、姓名、membership 的 `id`、论文与来源；`order` 决定顺序。`role: undergraduate` 自动放入 Undergraduates 区，沿用 compact 条目。按所有者要求，前四位 Qiuyang、Qingshuo、Chihao、Jiayi 保留原顺序；其余成员按论文年份升序、同年按姓氏排列，使用现有 `order` 保存核对后的顺序，同年同姓保留原提供顺序。全部成员统一桌面每行四人，Publications 标签另起一行；767px 及以下单列。此布局由所有者指定，不表示成员等级。未确认仍在组还是已离组时用 `status: unknown`，无需编写日期。姓名有已确认主页时加 `website`，没有就省略。

如果合作论文已在本站 publications 中，设 `publicationDisplay: linked`，并给论文的对应作者加此人的 `personId`。否则可使用以下摘要结构；只列与本组合作且已确认的论文，`firstAuthor: true` 仅用于已核实的一作，会自动加下划线。会议和年份简称统一为 ICLR25、ICSE24、FSE23（替代 ESEC/FSE23）等格式；linked 模式也自动生成两位年份并保留原站内论文链接。linked 模式也仅对 `contribution: first` 下划线，不由 equal contribution 推断：

```yaml
publicationDisplay: source-summary
publicationSummary:
  - label: ICSE 2024
    firstAuthor: false
    # url: 这里填写真实论文链接；没有则删去这一行
```

追加 Publications 时，保留已有摘要并按年份升序排列 `publicationSummary`，同年保留原有相对顺序。新增合著与已有一作即使会议／年份相同，也各自保留并分别设置 `firstAuthor`；×2 与轨道不省略。从 legacy-summary 切换为 source-summary 时完整拆入旧一作摘要，保留旧来源字符串；不猜配论文标题或链接，也不删除学历下的论文摘要。

详细成员的公开奖项、访问和备注分别放入 `awards`、`visits`、`notes` 数组；奖项逐项换行，无末尾分号。GPA 排名只填已批准公开的真实记录，位于对应 `education` 的 `rank`（`display` 与 `scope` 必填，保留排名口径）；没有就省略。此前 RA／MPhil 等身份保留在同一人的 `memberships`，共同指导写 `supervisors`，二者自动显示在末尾 Notes。需要精简历史说明时可用顶层 `previously` 覆盖自动生成的此前经历文字，如 Songhan 的 `Transferred from MPhil to PhD`，不删除原始 membership。前 RA 统一 `entryStyle: compact`，按现有顺序在桌面每行两人、手机单列，Publications、Next、Notes 为子行，时间收进 Notes。Lab 论文项统一使用 Publications，不因成员身份或论文数量改为 Paper；各项以英文逗号加空格分隔。Next 仍指离组后的历史下一站。按所有者更正角色时修改同一记录，不复制人物。

学历下的补充条目写入对应 `education` 项的 `details` 数组，会以缩进、小号灰字和减号显示。仅填写已批准公开的内容；例如 Xiaoyuan 的本科条目为 `Rank top 10%` 和 `Undergraduate intern in the group`，不据此新增在组经历或推断排名人数。Songhan 使用 `previously: false` 关闭自动此前经历说明，将 `Transferred from MPhil to PhD in 2025.01` 放在 `notes`，主身份显示日期不变。

学历阶段的论文写入该 `education` 项的 `publicationSummary`，结构同上，显示为一个 Publications 子项，`firstAuthor: true` 给论文简称加下划线。`previously: false` 仅隐藏自动生成的此前经历说明，保留历史 membership 和共同指导。2026-10-01 增补后，17 位本科 Intern 均为 `compact`，全部 17 位按上述四列显示；此前四位指定成员已删除学历展示。前 RA 组按 `order` 保持原 Team 顺序，不再优先按离组时间排序。COLING 与 NeurIPS 对应论文的页面简称分别统一为 `COLING24 (Oral)` 和 `NeurIPS25 (D & B Track)`，按相同论文链接匹配，原链接不变。

学历 Publications 子项排在其他 details 之前。博士校友补充 Junjielong Xu 和 Youliang Yuan 后，原站论文简写仍用 legacy-summary 保留；博士后 `role: postdoc` 单独分组，紧接 PhD alumni，Zhijing Li 的 Ph.D. 学历由所有者补充，缺失论文不补写。Visiting 使用 `role: visitor` 与 `entryStyle: compact`，放在 RA 前，按 `order` 桌面每行两人、手机单列；来自机构属于访问经历 Notes，不推断为学历。新增成员的日期及 reported Next 保留原 Team 的口径，不宣称独立核验今日任职。

## 编辑招募说明

编辑 `src/content/pages/join.md` 即可更新 `/join/`。正文按所有者提供的 `prospective-students.md` 保存，分为 “PhD Students and Masters” 与 “Undergraduate Students”，保留段落与 Markdown 粗体。页面使用系统无衬线标题、Georgia 正文及窄阅读栏，专属样式位于 `src/pages/join.astro`，不影响其他页面。Lab 页引导句与按钮所在区的文案仍在 `src/content/pages/lab.md`。修改后在 `site/` 运行 `npm run check`、`npm run build`、`npm run check:links`。
