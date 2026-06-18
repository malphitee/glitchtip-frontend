# GlitchTip 中文化实施记录

> 时间：2026-06 ｜ 仓库：`malphitee/glitchtip-frontend`（fork 自 GitLab 官方）
> 目标：给自部署的 GlitchTip 加上简体中文界面，并能跟随官方持续更新。

---

## 1. 目标

自部署的 GlitchTip（1Panel，arm64）界面只有英文。需要：让它显示**简体中文**，且后续官方升级能方便地同步。

## 2. 背景调研：GlitchTip 是怎么处理语言的

- 前端是 **Angular**，用 `@angular/localize` 的**运行时翻译**：构建产物只有一份，运行时按浏览器
  `navigator.language` 决定语言，非默认语言就 `fetch('static/assets/i18n/messages.<locale>.json')`
  调 `loadTranslations()` 注入翻译。
- 官方只内置 `en`/`fr`/`nb` 三种（写死在 `src/main.ts` 的 `availableLocales`），**没有中文**，
  且没有界面语言切换开关——所以单纯改设置没用，必须自己加翻译并重新构建。
- 官方 Docker 镜像 = 后端(Django) + 预打包前端；前端 `dist/` 由 Django 经 **WhiteNoise（带哈希清单）**
  提供服务，所以替换前端后**必须重跑 `collectstatic`**。
- 关键文件：`src/main.ts`(语言检测)、`src/locale/messages.xlf`(341 条待翻译源串，XLIFF 2.0)、
  `bin/convert-xliff.js`(xlf→运行时 json)、官方 `Dockerfile.prod`(前端叠加到后端镜像的同款思路)。

## 3. 方案

以**官方为上游**，只改前端、加一层中文：

1. fork 官方前端到自己的 GitHub，GitLab 设为 `upstream`，可 `git pull` 同步官方更新；
2. 在 `src/main.ts` 的 `availableLocales` 加 `"zh"`，提供 `src/assets/i18n/messages.zh.json`；
3. `Dockerfile.zh`：阶段 1 用本仓库源码构建前端，阶段 2 `FROM glitchtip/glitchtip:<版本>`，
   替换前端静态资源并重跑 `collectstatic` → 得到完整的中文镜像；
4. GitHub Actions 构建**多架构(amd64+arm64)**镜像推到 Docker Hub `malphitee/glitchtip-zh`；
5. 1Panel 里把官方镜像换成自己的镜像。

## 4. 实施记录

1. 从官方前端 `messages.xlf` 抽取 **341 条**源串，压平占位符（`<ph>`/`<pc>` → `{$NAME}`）。
2. 交给 AI 翻成简体中文（术语表 + 占位符规则见 `zh-l10n/translation-prompt.md`），
   校验：341/341 齐全、占位符零错误。
3. `src/main.ts` 加 `zh`；翻译落到 `src/assets/i18n/messages.zh.json`。
4. 写 `Dockerfile.zh`、`.github/workflows/build-and-push.yml`、`zh-l10n/` 维护工具。
5. fork 配置：`origin`=GitHub(SSH)、`upstream`=GitLab；`git fetch --unshallow` 补全完整历史(3348 提交)；提交并推送。
6. 设 GitHub secrets：`DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN`。
7. 触发 Actions 构建，推送 `malphitee/glitchtip-zh:latest`（多架构）。
8. 1Panel compose 改一行镜像名 → `docker compose pull && up -d` → 界面变中文 ✅。

## 5. 踩坑与解决

| 问题 | 解决 |
|------|------|
| 本机 Node v22.22.1 低于 Angular CLI 要求(22.22.3) | 不在本机构建，改由 Docker(`node:22-slim`) 构建 |
| Docker 构建 `apt-get` 拉 `deb.debian.org` 不通（国内网络）| 去掉 git/apt，改用 fork 内源码 `COPY` 构建；npm 源默认 `npmmirror` |
| Docker Hub 基础镜像 tag 写成 `v6.1.8` 拉不到 | 官方 Docker tag **不带 v**，应为 `6.1.8`（`6`/`latest`/`6.1.8` 同一 digest）|
| 服务器是 **arm64**，amd64 镜像跑不了 | 构建**多架构** `linux/amd64,linux/arm64`；前端阶段 `--platform=$BUILDPLATFORM` 固定原生构建一次 |
| 纯文档改动也触发构建 | workflow 加 `paths-ignore: ['**.md','zh-l10n/**']`，文档提交用 `[skip ci]` |

## 6. 最终产物

- 镜像：`malphitee/glitchtip-zh:latest`（公开，多架构 amd64+arm64，基于官方 `6.1.8`）。
- 部署：1Panel，单 `all_in_one` 容器，仅改了 compose 里的 `image` 一行，数据/配置不变。

## 7. 仓库结构（中文化相关）

```
src/main.ts                        # availableLocales 增加 "zh"
src/assets/i18n/messages.zh.json   # 中文翻译（341 条，唯一长期维护项）
Dockerfile.zh                      # 构建中文镜像
.github/workflows/build-and-push.yml
zh-l10n/
├── README.md                      # 用法/构建/部署/排错
├── UPGRADE.md                     # 官方升级后的同步流程
├── update-translation.py          # 增量补翻 + 合并
└── translation-prompt.md          # 翻译提示词（术语表/占位符规则）
docs/zh-localization.md            # 本文件：实施记录
```

## 8. 日常维护

官方升级后的处理流程见 **[`../zh-l10n/UPGRADE.md`](../zh-l10n/UPGRADE.md)**。核心：
`git fetch upstream && git merge upstream/master` → `update-translation.py extract/merge` 补翻 →
push 触发构建 → `docker compose pull && up -d`。

## 9. 后续增强：语言切换器

最初仅靠浏览器语言自动判断。之后增加了**手动切换**：界面右下角一个浮动的 🌐 `<select>`，
选中后写入 `localStorage('locale')` 并刷新页面，`main.ts` 据此加载对应语言（下次沿用）。

- 纯前端、零后端改动。运行时翻译（`loadTranslations`）无法不刷新就热切换，故采用「存偏好 + 刷新页面」。
- 完全实现在 `src/main.ts`（`mountLanguageSwitcher` + 语言检测优先读 localStorage），**不碰任何官方组件** → 升级合并无冲突。
- 调整位置/样式改 `mountLanguageSwitcher` 的内联样式即可。
