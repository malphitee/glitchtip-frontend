# 升级指南 · 同步官方更新

GlitchTip 官方升级后，把更新合进你的中文镜像。整个过程 =
**同步前端源码 → 补翻新文案 → 重建镜像 → 部署**。

> 记住架构：**前端**在本仓库（git 跟踪上游，`git pull` 更新）；**后端**是官方镜像，
> 由 `Dockerfile.zh` 的 `GLITCHTIP_VERSION` 指定版本。两者一起升、版本号保持一致。
> 带 🌐 的命令需联网（国内挂代理）。

---

## TL;DR（小版本升级、且没有新文案时）

```bash
cd /Users/liuq/Code/glitchtip/frontend        # 本仓库目录（任意 clone 都行）
git fetch upstream && git merge upstream/master            # 🌐 同步官方前端
python3 zh-l10n/update-translation.py extract              # 显示「需要新翻: 0」即无需翻译
git add -A && git commit -m "chore: sync upstream" && git push origin master   # 🌐 触发自动构建
# 然后在服务器上：
docker compose pull && docker compose up -d
```

---

## 详细步骤

### 1. 同步官方前端源码

```bash
git fetch upstream            # 🌐
git merge upstream/master
```

- **唯一可能的冲突是 `src/main.ts`** 里你加的那行 `availableLocales`。若官方动了它，git 会提示冲突，
  手动保留**含 `"zh"` 的版本**即可（把官方新增的语言也一并留下），例如：
  ```ts
  const availableLocales = ["en", "fr", "nb", "zh"];
  ```
  解决后 `git add src/main.ts`。
- 你自己的文件（`messages.zh.json`、`Dockerfile.zh`、`.github/`、`zh-l10n/`）官方没有，**永不冲突**。

### 2. 补翻新增文案（如有）

```bash
python3 zh-l10n/update-translation.py extract
```

它对比新版 `src/locale/messages.xlf` 与你已有翻译，输出 `zh-l10n/to-translate-new.json`
（**只含新增/改动的条目**，老翻译按 ID 自动保留）。

- 显示 **「需要新翻: 0」** → 跳到第 3 步。
- 有新条目 → 把 `zh-l10n/to-translate-new.json` 按 [`translation-prompt.md`](./translation-prompt.md)
  的提示词交给任意 AI 翻译，结果存成 `zh-l10n/translated-new.json`，然后合并：
  ```bash
  python3 zh-l10n/update-translation.py merge
  ```

### 3. 提交并重建镜像

```bash
git add -A && git commit -m "chore: 同步上游 + 补充中文翻译"
git push origin master        # 🌐
```

构建有两种触发方式：

- **手动指定版本（推荐）**：GitHub → Actions → "Build GlitchTip (zh)…" → Run workflow，
  `glitchtip_version` 填新版本号（**不带 v**，如 `6.2.0`），`image_tag` 填 `latest`，
  `platforms` 保持 `linux/amd64,linux/arm64`。
- **push 自动**：推到 master 会自动构建（用 `glitchtip_version=latest`）。
  > 纯文档/`zh-l10n/` 改动不会触发构建；改了翻译(`src/...messages.zh.json`)或源码才会。

新版本号哪里看：[GlitchTip 后端发布页](https://gitlab.com/glitchtip/glitchtip-backend/-/tags)，
或 `git fetch upstream --tags` 后看最新 tag。

### 4. 在 1Panel 部署

```bash
docker compose pull && docker compose up -d
```

- 镜像 tag 是滚动的 `:latest`，`pull` 即拿到刚构建的新版。
- 容器启动会**自动执行数据库迁移**（`all_in_one` 角色会跑 `migrate`），新版表结构变更自动处理。

---

## 注意事项

- **版本对齐**：构建时的 `GLITCHTIP_VERSION` 要与你同步到的前端版本一致（官方前后端通常同时发版）。
- **大版本升级先备份数据库**：跨大版本（如 6.x → 7.x）迁移较大，建议先在 1Panel 给 PostgreSQL 卷做快照/备份；小版本（6.1.x → 6.2.x）一般无忧。
- **保留回滚能力**：构建时除了 `latest`，可再用版本号当 `image_tag`（如 `6.2.0`）单独构建一份；新版有问题时把 compose 的 image tag 改回旧版本即可。
- **不必追新**：能正常用就不用升；想升或官方修了你在意的 bug 再走本流程。

---

## 速查

| 想做 | 命令 |
|------|------|
| 同步官方前端 | `git fetch upstream && git merge upstream/master` |
| 看有无新文案要翻 | `python3 zh-l10n/update-translation.py extract` |
| 合并新翻译 | `python3 zh-l10n/update-translation.py merge` |
| 触发构建 | `git push origin master` 或 Actions → Run workflow |
| 部署 | `docker compose pull && docker compose up -d` |
