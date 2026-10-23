# 定制手册

## 1. 配色（theme.css）

### 1.1 三层颜色

主题不是单一主色，而是三层：

| 层 | 默认 | 用途 |
| --- | --- | --- |
| 深底 | `#0a0f1e` → `#172143` | 页面、卡片、弹层、菜单 |
| 品牌蓝 | `#4d6bfe` | 主按钮、选中态、焦点 |
| 浅蓝 | `#7ea2ff` / `#a5c0ff` / `#a9b6ea` | 链接、次要文字、描边、光效 |

只改 `--dsw-alias-brand-primary` 会让按钮变色但文字仍是蓝色，看起来“脏”。换色时按
层整体替换：

```bash
# 例：换成青绿
#4d6bfe → #12b8a6
#7ea2ff → #5fe3d2
#a5c0ff → #9ff0e5
#0a0f1e → #06110f
```

`theme.css` 里的颜色是按语义分组的，优先改这些：

| token | 作用 |
| --- | --- |
| `--dsw-alias-bg-base` | 页面底色 |
| `--dsw-alias-bg-layer-1/2/3` | 卡片/弹层/悬浮层 |
| `--dsw-alias-label-primary/secondary/tertiary` | 正文/次要/辅助文字 |
| `--dsw-alias-border-l1..l4` | 由弱到强的边框 |
| `--dsw-alias-brand-primary` / `brand-text` | 品牌色/品牌文字 |
| `--dsw-alias-button-primary-hover` | 主按钮 hover |
| `--dsw-alias-link` | 链接 |
| `--dsw-alias-markdown-code-block` / `inline-code` | 代码块/行内代码 |

### 1.2 特异性

选择器必须是：

```css
html[data-ds-theme-source] body[data-ds-dark-theme] { ... }
```

`html[data-ds-theme-source]` 提升特异性，保证压过 ui-theme 注入的 token 表，无论
加载顺序。`body[data-ds-dark-theme]` 保证只影响深色；删掉它，浅色主题也会被改。

### 1.3 主题与设置的关系

- `forceDark: true`：启动后 12 秒内把 `data-ds-theme-source` 钉在 `dark`，并给
  `body` 加 `data-ds-dark-theme`。不写设置项，不改用户偏好。
- 用户在设置里切“浅色”后，DSH 的 ui-theme 会把属性改成 `light`，主题自动失效。
- 若希望完全尊重用户偏好（不强制深色），把 `forceDark` 设为 `false`；此时用户是
  浅色就看不到主题。

## 2. 文案与时序

改 `assets/plugin/lib/boot.js` 顶部 `cfg` 默认值：

```js
title: "DEEPSEEK HARNESS",
subtitle: "AI AGENT HARNESS · 智能体工作台",
caption: "点击图标启动 · CLICK THE EMBLEM TO LAUNCH",
watermark: "",
minDisplayMs: 1500,
maxDisplayMs: 3300,
autoLaunchMs: 0,
fadeMs: 450,
themeEnabled: true,
forceDark: true
```

| 字段 | 效果 |
| --- | --- |
| `title` | 逐字母升起的主标题；空格自动变成间隔 |
| `subtitle` / `caption` | 副标题 / 底部提示 |
| `watermark` | 底部半透明签名；空字符串不渲染 |
| `maxDisplayMs` | 进度条推进到 96% 的时长 |
| `autoLaunchMs` | 就绪后自动进入的等待；`0` = 一直等点击 |
| `fadeMs` | 淡出时长 |

⚠ 中文只放在 `boot.js` / `index.js` 默认值里。`cordis.patch.yml` 在本机配置编辑器
中 UTF-8 往返会写乱，配置层只放 ASCII/数字/布尔。

启动状态轮播文案在 `boot.js` 的 `LINES` 数组；故障文案在 `checkFault()`。

## 3. 壁纸

### 3.1 图片准备

- 横图，建议 ≥ 2560×1440；会 `cover` 裁切。
- JPG 质量 80 左右，控制在 2 MB 内（base64 后 ×1.33）。
- 主体避开左侧 20%（左边缘有渐隐和侧栏），焦点放在偏右/居中。
- 深色图更稳；浅色图需要更大 `scrim` 才能保证文字对比度。

### 3.2 参数

`assets/plugin/selectors.json`：

```json
"wallpaper": {
  "focus": "50% 40%",
  "scrim": 25,
  "leftFade": 20,
  "leftFadeStop": 6
}
```

| 参数 | 含义 | 调大 |
| --- | --- | --- |
| `focus` | `background-position` | 图片主体右移/上移 |
| `scrim` | 全图深色遮罩百分比 | 文字更清楚，图更暗 |
| `leftFade` | 左边缘渐隐结束位置（%） | 左侧过渡更宽 |
| `leftFadeStop` | 渐隐起点（%） | 左侧纯色带更宽 |

命令行也可以临时覆盖：

```bash
node "$SKILL_ROOT/scripts/make-bg.mjs" "D:\pics\bg.jpg" --focus "50% 35%" --scrim 30
```

### 3.3 可读性

- 消息卡片：`colors.card`（默认 `rgb(11 17 34 / 40%)`）+ `blur(4px)`。图太花就提高
  不透明度到 55–65%。
- 侧栏/顶栏/输入框是纯色锚点，不建议透明；透明后长列表会失去层次。
- 如果正文仍然发灰，先加 `scrim`，再加深卡片，最后才考虑给文字加阴影。

### 3.4 生成与生效

```bash
node "$SKILL_ROOT/scripts/make-bg.mjs" "D:\pics\bg.jpg"
```

输出到已安装插件的 `lib/theme-bg.css`。桌面重启 DSH；外部浏览器刷新。换图不需要重装
插件，重新生成即可。

`theme-bg.css` 是生成物，不要手改；改了下次生成会被覆盖。

## 4. 动效

| 想要 | 改哪里 |
| --- | --- |
| 整体更快/更慢 | `boot.css` 里各 `animation` 的 duration；`maxDisplayMs` |
| 网格/扫描带 | `#dsh-rhine-overlay::before`、`.rhine-scan` |
| 徽记入场 | `.rhine-whale`、`@keyframes rhine-whale-in` |
| 就绪呼吸 | `.rhine-ready .rhine-emblem`、`@keyframes rhine-pulse` |
| 启动光环 | `.rhine-flash`、`@keyframes rhine-flash` |
| 淡出 | `#dsh-rhine-overlay.rhine-out`、`fadeMs` |

换 logo：替换 `boot.js` 里的 `WHALE_PATH`（或整个 `emblem` SVG 字符串）。保留
`.rhine-emblem` 的 `role="button"`、`tabindex="0"`、`aria-label`，否则键盘/读屏
不可用。

## 5. 工作流

1. 改 `assets/plugin/lib/*`（源文件，不是 profile 里的副本）
2. `node scripts/preview.mjs` → 浏览器看效果
3. 满意后 `node scripts/install.mjs`（会覆盖已安装文件，保留 `theme-bg.css`）
4. 完全退出并重开 DSH
5. `node scripts/doctor.mjs` 体检

## 6. 不要做

- 不要在 `cordis.patch.yml` 写中文。
- 不要直接改 `theme-bg.css`（生成物）。
- 不要把 `theme-bg.css` 提交进 git（几十万字符的 base64）。
- 不要用 `enabled: false` 来“只关开屏”——用 `splashEnabled: false`。
- 不要把 `?v=` 删掉：改 `index.js` 后模块会命中缓存。
- 不要假设桌面窗口会热更新 CSS/JS：它只认启动时的注入表。
