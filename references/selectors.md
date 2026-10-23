# 壁纸选择器：类名表与重新采集

## 1. 为什么会有这个问题

DSH 的 Web 客户端用 CSS Modules，类名形如：

```
BynINW_frame          ← 组件前缀 BynINW + 角色 frame
_paneBody_6nhg2_318   ← 下划线开头 + 角色 + 构建哈希
```

前缀和哈希都随构建变化。当前 `selectors.json` 是在 **2026-10 的 Windows nightly**
上采集的；DSH 升级后壁纸可能只显示一半、或完全消失，但开屏通常不受影响（开屏只用
`#dsh-rhine-overlay` 和 `[data-dsh-boot]` 这类稳定选择器）。

## 2. 角色表

| 角色 | 当前选择器 | 作用 |
| --- | --- | --- |
| `frame` | `.BynINW_frame` | 最外层框架，壁纸挂这里 |
| `sidebar` | `.BynINW_sidebarCol` | 左侧栏，纯色 |
| `header` | `.Dc7zOa_header` | 顶栏，纯色 |
| `transparent` | `.BynINW_centerCol`、`.BynINW_rightbarCol`、`._paneBody_6nhg2_318`、`._emptyTabHost_6nhg2_143`、`._pane_6nhg2_209`、`.Dc7zOa_root`、`.Dc7zOa_body`、`.Dc7zOa_scrollBody` | 内容区链路，改透明 |
| `conversation` | `.xz4KEq_root`、`.xz4KEq_scroll`、`[data-conversation-scroll]`、`.ZNyiNW_root` | 对话滚动容器，改透明 |
| `messageColumn` | `.xz4KEq_column` | 消息列，毛玻璃卡片 |
| `trajectoryBar` | `.QnvEwG_root` | 轨迹工具栏，半透明 |
| `tabStrip` | `._tabStrip_6nhg2_237` | 标签条，半透明 |
| `composerCard` | `.RlGAzG_card` | 输入框容器 |
| `composerInput` | `.RlGAzG_input` | 输入文本 |
| `composerPrimary` | `.RlGAzG_primary` | 提交按钮 |
| `sessionRows` | `.hIlkoa_sessionRow`、`.hIlkoa_projectRow`、`.hIlkoa_searchResultRow` | 会话/项目条目悬浮 |

优先使用稳定钩子：`[data-dsh-boot]`、`[data-conversation-scroll]`、
`[data-ds-dark-theme]`、`[data-ds-theme-source]`。哈希类名只作为最后手段。

## 3. 重新采集（推荐：浏览器 DevTools）

1. 用已登录的浏览器打开 DSH 的 Web GUI 地址（DSH 桌面窗口的地址栏/托盘里能看到
   `http://127.0.0.1:<port>`）。
2. `F12` → Elements。选中“看起来是整页背景”的最外层容器，读 `class`。
3. 或者直接在 Console 跑下面的脚本。

### 3.1 列出所有 CSS Modules 前缀

```js
const map = new Map();
for (const el of document.querySelectorAll("[class]")) {
  for (const c of String(el.className).split(/\s+/)) {
    const m = /^([A-Za-z0-9]{6})_(.+)$/.exec(c);
    if (!m) continue;
    if (!map.has(m[1])) map.set(m[1], new Set());
    map.get(m[1]).add(m[2]);
  }
}
console.table([...map].map(([prefix, roles]) => ({ prefix, roles: [...roles].join(", ") })));
```

### 3.2 找出“画了背景”的元素

从页面中心往上走，打印有背景图的祖先：

```js
let node = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
while (node && node !== document.documentElement) {
  const bg = getComputedStyle(node).backgroundImage;
  if (bg && bg !== "none") {
    console.log(node.tagName, node.className, bg.slice(0, 100));
  }
  node = node.parentElement;
}
```

框架 `frame` 是其中 rect 最大、包含整个应用的那个。

### 3.3 找输入框 / 消息列 / 侧栏

```js
// 输入框
const input = document.querySelector("textarea, [contenteditable='true']");
console.log("input ancestors:", [input, input?.parentElement, input?.parentElement?.parentElement].map(el => el?.className));

// 消息列：包含多条消息、宽度受限的容器
console.log("scroll:", document.querySelector("[data-conversation-scroll]")?.className);

// 侧栏：左侧固定宽度、有会话列表
console.log("sidebar:", [...document.querySelectorAll("[class*='_sidebar']")].map(el => el.className));
```

### 3.4 验证选择器

```js
const sel = ".BynINW_frame";
const el = document.querySelector(sel);
console.log(sel, el?.getBoundingClientRect().toJSON(), getComputedStyle(el).backgroundImage.slice(0, 60));
```

`querySelector` 返回 `null` 就说明类名已经变了；`rect` 不对说明选错了角色。

## 4. 更新 `selectors.json`

只改 `assets/plugin/selectors.json` 的 `roles`，然后重新生成并重启：

```bash
node "$SKILL_ROOT/scripts/make-bg.mjs" "D:\pics\bg.jpg"
```

如果只想快速验证，可以先用 `--out` 生成到临时文件，再手工复制进插件目录：

```bash
node "$SKILL_ROOT/scripts/make-bg.mjs" "D:\pics\bg.jpg" --out "$env:TEMP\theme-bg.css"
```

## 5. CDP 方式（可选，适合批量/自动化）

浏览器以远程调试端口启动：

```bash
msedge.exe --remote-debugging-port=9222 "http://127.0.0.1:<port>/"
```

然后：

```js
const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const page = list.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
// Runtime.evaluate 执行上面的采集脚本
```

注意：DSH 的 Web 页面需要登录 cookie。用已登录的浏览器 profile 启动，或从
`~/.dsh/.credentials.yaml` 的 `client-connection/browser-session` 自签一个
`dsh-auth-<authority>` cookie（HMAC-SHA256，1 小时有效）。自签脚本属于本机调试工具，
不适合放进公开仓库。

## 6. 选择器失配的典型症状

| 症状 | 说明 |
| --- | --- |
| 壁纸完全不出现 | `frame` 选择器失效，或 `body[data-ds-dark-theme]` 没加上 |
| 壁纸只在侧栏后面出现 | 内容区透明清单失效，被不透明层盖住 |
| 消息文字看不清 | `messageColumn` 选错（选到了外层），毛玻璃卡片没生效 |
| 输入框仍是系统色 | `composerCard` / `composerPrimary` 失效 |
| 悬浮放大影响整块列表 | `sessionRows` 选到了容器而不是行 |

每次改完都跑一遍 `references/troubleshooting.md` 里的验证清单。
