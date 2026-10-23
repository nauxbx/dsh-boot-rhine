---
name: dsh-boot-rhine
description: 为 DeepSeek Harness（DSH）制作、安装、修改自定义开屏动画与主图壁纸主题：通过 cordis 插件向 webserver/index-inject 注入 CSS/JS，实现点击鲸鱼启动、进度与状态机、深色 --dsw-* 调色板、整页壁纸。当用户提到 DSH 开屏、启动画面、启动页、splash、启动动画、界面壁纸、主图、主题换色、DSH 美化，或要修复/卸载 dsh-boot-rhine 时使用。
whenToUse: 用户说“给 DSH 做个开屏/启动动画”“换界面壁纸/主图”“DSH 主题美化”“开屏不生效”“卸载这个开屏插件”
---

# DSH 开屏动画 + 壁纸主题

这是一套已经跑通的方案，不是一个从零设计稿。核心事实：

- 开屏和主题都是**一个 cordis 主机插件**，通过 `webserver/index-inject` 事件把
  `<style>` / `<script>` 行推进 DSH 的注入表。
- 同一张注入表覆盖两条路径：桌面窗口（`dsh-app://` 经 IPC）和外部浏览器
  （webServer 渲染进 `index.html`）。
- **桌面窗口在每次启动时就绪时快照注入表**：改 CSS/JS 后桌面必须重启；外部浏览器
  刷新即可。
- 壁纸是**生成出来的一张 CSS**（图片 base64），挂在应用最外层框架上，再把内容链路
  改成透明。类名带构建哈希，DSH 升级后可能要重新采集。

## 0. 先确认

1. 用户要哪一档：
   - 只要开屏 → `install.mjs --splash-only`
   - 只要主题/壁纸 → `install.mjs --theme-only`
   - 开屏 + 主题 + 壁纸（默认；从单模式恢复用 `--all`）
2. 有没有壁纸图。没有就用 `--gradient` 生成纯渐变壁纸，或先不装 `theme-bg.css`
   （只有纯色主题）。
3. 用户是否在 DSH 里选过“浅色”。主题默认只在深色下生效；`forceDark: true` 会在
   启动后 12 秒内把调色板钉在深色，不写入设置。

## 1. 定位路径

本文件所在目录就是 `$SKILL_ROOT`。不要假设当前工作目录是 skill 根目录。
默认安装位置是 `~/.dsh/skills/dsh-boot-rhine`；如果本文件是从别处加载的，以本文件
所在目录为准。

- `$DSH_HOME`：`--dsh-home` 参数 > 环境变量 `DSH_HOME` > `~/.dsh`
- profile：默认 `desktop`；否则找第一个含 `cordis.patch.yml` 的 profile
- 插件目录：`<DSH_HOME>/profiles/<profile>/plugins/dsh-boot-rhine/`

先跑体检，确认现状：

```bash
node "$SKILL_ROOT/scripts/doctor.mjs"
```

## 2. 安装（最小可用）

```bash
node "$SKILL_ROOT/scripts/install.mjs"
```

它做四件事：

1. 把 `assets/plugin/` 复制到 profile 的 `plugins/dsh-boot-rhine/`（不删
   `theme-bg.css`）
2. 在 `cordis.patch.yml` 末尾写入/更新 `- insert:` 里的 `boot-rhine` 条目，
   URL 带 `?v=<时间戳>` 触发模块重载
3. 备份 `cordis.patch.yml` 为 `.bak-*`
4. 打印重启说明

带壁纸：

```bash
node "$SKILL_ROOT/scripts/install.mjs" --wallpaper "D:\pics\bg.jpg"
# 或者不用图片
node "$SKILL_ROOT/scripts/install.mjs" --gradient
```

安装后**完全退出并重新打开 DSH**。外部浏览器刷新 DSH 页面可立即验证。

## 3. 快速预览循环（改样式时用）

不要每改一次就重启 DSH。先生成独立预览页：

```bash
node "$SKILL_ROOT/scripts/preview.mjs"
# 就绪态静帧，方便截图
node "$SKILL_ROOT/scripts/preview.mjs" --still
```

浏览器打开 `preview/index.html`。`Ctrl+Alt+B` 在预览页和 DSH 里都能重播开屏。

改 `assets/plugin/lib/boot.css` / `boot.js` → 重跑 preview → 满意后再
`install.mjs` + 重启。注意：`install.mjs` 会用 `assets/` 覆盖已安装文件，所以
**所有定制都改 `assets/plugin/lib/` 下的源文件**，不要只改 profile 里的副本。

## 4. 定制

### 4.1 换色

`assets/plugin/lib/theme.css` 是整页 `--dsw-*` token 覆盖，按语义分组。最常改的几组：

| 用途 | token | 默认 |
| --- | --- | --- |
| 页面底色 | `--dsw-alias-bg-base` | `#0a0f1e` |
| 品牌/主按钮 | `--dsw-alias-brand-primary` | `#4d6bfe` |
| 链接/高亮文字 | `--dsw-alias-link`、`--dsw-alias-brand-text` | `#7ea2ff` |
| 正文 | `--dsw-alias-label-primary` | `#e8ecff` |
| 次要文字 | `--dsw-alias-label-secondary` | `#a9b6ea` |
| 边框 | `--dsw-alias-border-l2` | `rgb(126 162 255 / 14%)` |

规则：`html[data-ds-theme-source] body[data-ds-dark-theme]` 前缀用来压过应用自身
注入的 token 表，不要删。换主色时同步替换 `#4d6bfe` / `#7ea2ff` / `#a5c0ff` 三个
层级，否则按钮和文字会不协调。

### 4.2 换文案与时序

优先改 `assets/plugin/lib/boot.js` 顶部 `cfg` 默认值（UTF-8 安全）：

- `title` / `subtitle` / `caption` / `watermark`
- `minDisplayMs` / `maxDisplayMs` / `autoLaunchMs` / `fadeMs`

⚠ **不要把中文写进 `cordis.patch.yml`**：DSH 的配置编辑器在本机无法正确往返
UTF-8，会写乱。配置里只放布尔/数字/ASCII；中文放 `boot.js` 默认值。

### 4.3 换壁纸

1. 把图片压到 2 MB 以内（生成的是 base64 CSS，体积 ×1.33）。
2. 需要改颜色/焦点/读衬时，编辑 `assets/plugin/selectors.json` 的
   `colors` / `wallpaper`。
3. 重新生成（输出到已安装插件目录）：

```bash
node "$SKILL_ROOT/scripts/make-bg.mjs" "D:\pics\bg.jpg"
node "$SKILL_ROOT/scripts/make-bg.mjs" "D:\pics\bg.jpg" --focus "50% 35%" --scrim 30
```

生成逻辑：外层框架铺三层背景（左边缘渐隐 + 深色读衬 + 图片 `cover`），主内容链路
全部透明，对话列加 40% 毛玻璃卡片保证可读性。细节见
`references/customization.md`。

### 4.4 换动效

- 视觉：`boot.css` 的 `#dsh-rhine-overlay`、`.rhine-*`、`@keyframes`
- 状态机：`boot.js` 的 `tick` / `enterReady` / `requestLaunch` / `doLaunch`
- 徽记：`boot.js` 里的 `WHALE_PATH` 和 `emblem` SVG；换成自己的 logo 时保留
  `.rhine-emblem` 的点击语义和 `aria-label`

## 5. 验证清单

按顺序过一遍，不要只看预览：

1. `doctor.mjs` 全绿（文件、注册、入口 URL 存在）
2. 重启 DSH：开屏出现，进度走满，状态变成“点击启动”
3. 点击徽记（或 Enter / 空格 / Esc）：扩散光环 + 淡出，**覆盖层被移除**
4. 应用可正常点击；壁纸从内容区透出；对话文字可读；输入框/按钮颜色正常
5. 外部浏览器刷新 DSH 页面：同样播放
6. `Ctrl+Alt+B` 重播
7. 系统开启“减弱动态效果”：动画退化为静态但仍可点击进入
8. 设置里切浅色：主题应退回默认浅色（`forceDark` 会阻止；用 `--no-force-dark`
   重装后再测）

## 6. 卸载

```bash
node "$SKILL_ROOT/scripts/uninstall.mjs"
```

删除 `cordis.patch.yml` 里的 `boot-rhine` 条目和插件目录，配置有备份。重启 DSH 生效。

## 7. 已知坑（详细排查见 references/troubleshooting.md）

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 桌面窗口没变化，浏览器有效 | 注入表启动快照 | 完全退出 DSH 再开 |
| 壁纸不出现 | 类名哈希变了 / theme-bg 没生成 | 见 `references/selectors.md`，重跑 make-bg |
| 改了 CSS 但桌面还是旧样式 | 同上，桌面只认启动时的表 | 重启；或先用浏览器调 |
| 中文变乱码 | 配置编辑器 UTF-8 往返问题 | 中文移到 `boot.js` 默认值 |
| 开屏后界面点不动 | 覆盖层没移除 | 检查 `doLaunch` 的 `overlay.remove()` 与 `pointer-events` |
| 主题把浅色也改了 | 选择器没带 `body[data-ds-dark-theme]` | 不要删这个后缀 |
| 改了 index.js 不生效 | ESM 模块缓存 | 重新 install 会换 `?v=`；或手动改版本号 |
| 壁纸太糊/太亮 | 图片分辨率、focus、scrim | 见 customization |

## 8. 交付时对用户说什么

- 改了什么（开屏 / 主题 / 壁纸）
- 需要**完全退出并重开 DSH**；外部浏览器刷新即可
- 快捷操作：`Ctrl+Alt+B` 重播
- 怎么调：文案在 `boot.js`，颜色在 `theme.css`，壁纸换图重跑 `make-bg.mjs`
- 怎么退：`uninstall.mjs`

## 参考

- `references/architecture.md` — 注入机制、两条加载路径、状态机
- `references/selectors.md` — 壁纸类名表 + 升级后重新采集的方法
- `references/customization.md` — 配色/壁纸/动效参数
- `references/troubleshooting.md` — 按现象排查
- `references/distribution.md` — 发 GitHub、别人怎么安装
