# GlitchTip 前端 · 简体中文 fork

本仓库是官方 [`glitchtip-frontend`](https://gitlab.com/glitchtip/glitchtip-frontend)（GitLab）的 fork，加了**简体中文界面**，并能构建出可直接部署的 GlitchTip 镜像。

- 官方 GitLab 仓库作为 **upstream**，随时 `git pull` 拿前端官方更新；
- 中文化改动以 git 提交的形式叠在上面；
- 用 `Dockerfile.zh` 把「本仓库前端 + 官方后端镜像」打成一个镜像，推到你自己的 Docker Hub。

> **架构要点**：GlitchTip = 前端(本仓库) + 后端镜像。中文只在前端。
> 所以 `git pull upstream` 更新的是**前端**；**后端**用官方镜像、由 `Dockerfile.zh` 里的
> `GLITCHTIP_VERSION` pin 版本，升级后端=改这个版本号（它不是 git 仓库，不能 pull）。

## 中文化都改了什么（相对上游）

| 文件 | 改动 |
|------|------|
| `src/main.ts` | `availableLocales` 加了 `"zh"` |
| `src/assets/i18n/messages.zh.json` | 中文翻译（**唯一长期维护**的文件）|
| `Dockerfile.zh` | 构建中文镜像（前端→叠到官方后端镜像→collectstatic）|
| `.dockerignore` / `.github/workflows/build-and-push.yml` | 构建上下文裁剪 / CI 自动构建推送 |
| `zh-l10n/` | 翻译维护脚本、提示词、本文档 |

---

## 一次性设置

> 带 🌐 的命令要联网（国内记得挂代理）。

1. 在 GitHub 新建一个**空仓库**（如 `malphitee/glitchtip-frontend`，不要勾初始化）。
2. 在本目录配置远端 —— 让 GitLab 当 upstream、你的 GitHub 当 origin：
   ```bash
   git remote rename origin upstream          # 原 GitLab 改名为 upstream
   git remote add origin https://github.com/malphitee/glitchtip-frontend.git
   git fetch --unshallow upstream   # 🌐 把浅克隆补全为完整历史（首次必做）
   ```
3. 提交中文化改动并推到你的 GitHub：
   ```bash
   git add -A
   git commit -m "feat: 增加简体中文(zh)界面与中文镜像构建"
   git push -u origin master        # 🌐
   ```
4. 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 加两个 secret：
   - `DOCKERHUB_USERNAME` = 你的 Docker Hub 用户名
   - `DOCKERHUB_TOKEN` = Docker Hub 的 access token

> 本机网络慢的话，第 2 步也可用 GitHub 的 **Import repository** 直接从 GitLab 服务端镜像一份（不耗你本地带宽），再 `git clone` 你的 GitHub 仓库、把中文化改动拷进去提交，并 `git remote add upstream <GitLab地址>`。

---

## 构建并推送镜像

### 方式 A：GitHub Actions（推荐，原生 amd64 + 快网络）

仓库 **Actions → "Build GlitchTip (zh)…" → Run workflow**，填：
- `glitchtip_version`：与你部署的官方版本一致（如 `latest` / `v5.1.0`）
- `image_tag`：如 `latest`
- `platforms`：amd64 服务器填 `linux/amd64`

产物：`docker.io/malphitee/glitchtip-zh:<image_tag>`。

### 方式 B：本地构建（在本仓库根目录）

```bash
# 本机原生架构，快速验证能否构建
docker build -f Dockerfile.zh -t glitchtip-zh:test .

# 出 amd64 镜像并推送（Apple Silicon 上是 QEMU 模拟，较慢；嫌慢就用方式 A）
docker login
docker buildx build -f Dockerfile.zh \
  --platform linux/amd64 \
  --build-arg GLITCHTIP_VERSION=latest \
  -t malphitee/glitchtip-zh:latest \
  --push .
```

---

## 在 1Panel 切换到中文镜像

把官方 `docker-compose` 里**所有** `glitchtip/glitchtip`（`web` 和 `worker` 两个服务）改成：

```yaml
    image: malphitee/glitchtip-zh:latest
```

然后：

```bash
docker compose pull && docker compose up -d
```

用中文浏览器访问即可。看不到中文就强刷新（Ctrl/Cmd+Shift+R）。

---

## 跟上游同步 / 升级 GlitchTip

官方升级后如何同步前端、补翻新文案、重建镜像并部署，见专门文档 **[UPGRADE.md](./UPGRADE.md)**。

---

## 排错

- **构建在 collectstatic 报权限错**：确认 `Dockerfile.zh` 阶段 2 是 `USER root` 下执行的（本文件已是）。
- **页面还是英文**：浏览器首选语言不含中文，或缓存了旧资源；换 `zh-CN` 并强刷新。
- **个别文字还是英文**：该串还没翻，正常回退；按上面"同步/升级"补翻。
- **`npm ci` 慢/失败**：海外构建给 `Dockerfile.zh` 传 `--build-arg NPM_REGISTRY=https://registry.npmjs.org`；国内默认已是 npmmirror。
