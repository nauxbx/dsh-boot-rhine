# 排查手册

先跑体检：

```bash
node "$SKILL_ROOT/scripts/doctor.mjs"
```

它会打印 profile、插件文件、`cordis.patch.yml` 注册、入口 URL、缓存标记和壁纸状态。
下面的排查都假设体检基本通过。

## 1. 完全没有开屏

按这个顺序二分：

1. **外部浏览器**打开 DSH 地址，刷新。
   - 浏览器也没有 → 注入没发生：看插件是否注册、`enabled` 是否为 `true`、
     `index.js` 是否能被 import。
   - 浏览器有、桌面没有 → 桌面快照问题，见 §2。
2. 在浏览器 Console 检查：
   ```js
   document.getElementById("dsh-rhine-overlay");          // null = 没注入
   document.documentElement.dataset.dsThemeSource;        // 期望 dark
   ```
3. 检查配置块是否被写坏：
   ```bash
   node -e "console.log(require('fs').readFileSync(process.argv[1],'utf8').slice(-800))" "$DSH_HOME/profiles/desktop/cordis.patch.yml"
   ```
   看 `- id: boot-rhine` 的缩进是否和同级一致，`name` 是否是完整的一行。
4. `index.js` 读取 `boot.css` / `boot.js` 失败会被 `try/catch` 静默跳过。确认
   `lib/` 下四个文件都在。

## 2. 浏览器有效，桌面窗口没变化

这是设计使然：桌面窗口在启动就绪时**快照一次**注入表。

- 完全退出 DSH（托盘也要退），重新打开。
- 只刷新页面/切换会话没用。
- 开发期先用外部浏览器调样式，最后再重启桌面验证。

## 3. 开屏卡住 / 进入后点不动

覆盖层在启动前拦截鼠标是预期的；问题在于它没被移除。

1. Console 里看 `#dsh-rhine-overlay` 是否还在，以及 `overlay.className`。
2. 手动移除验证：
   ```js
   document.getElementById("dsh-rhine-overlay")?.remove();
   ```
   能恢复 → 是 `doLaunch()` 没走到。
3. 常见原因：
   - 脚本在 `overlay.remove()` 前抛错（看 Console 红字）。
   - `fadeMs` 被设成极大值，`setTimeout` 还没到。
   - 自定义 CSS 覆盖了 `.rhine-out { pointer-events: none }`。
4. 兜底：`forceReady` 在 `max(maxDisplayMs, 7000)` 后强制可交互；如果这个也没发生，
   说明脚本根本没执行到状态机（注入被截断/语法错误）。

## 4. 壁纸不出现，但纯色主题正常

按概率排序：

1. **选择器过期**（DSH 升级最常见）。见 `references/selectors.md`。先确认：
   ```js
   getComputedStyle(document.querySelector(".BynINW_frame")).backgroundImage.slice(0, 80);
   ```
   返回 `none` → 类名不对或没匹配到。
2. **不是深色模式**：主题与壁纸都要求 `body[data-ds-dark-theme]`。检查：
   ```js
   document.documentElement.dataset.dsThemeSource;
   document.body.hasAttribute("data-ds-dark-theme");
   ```
   `forceDark` 为 `false` 且用户选浅色时会这样。
3. **`theme-bg.css` 没生成/没复制**：
   ```bash
   ls "$DSH_HOME/profiles/desktop/plugins/dsh-boot-rhine/lib/theme-bg.css"
   ```
4. **`themeEnabled: false`**：整个主题层都不注入。
5. 图片过大导致 CSS 被截断/浏览器解析失败：看 Console 是否有 CSS 解析错误；把图片压到
   2 MB 内重生成。

## 5. 壁纸出现但内容区是实心

- `transparent` 角色清单里有失效类名，中间夹了一层不透明背景。
- 用 DevTools 选中内容区，逐层看 `background-color`，把那个类名加进
  `selectors.json.transparent`。
- 注意某些容器用 `background` 简写而不是 `background-color`，照样会被
  `background: transparent` 覆盖，但要确认没有被更高特异性的规则压回去。

## 6. 文字看不清 / 输入框颜色怪

- 提高 `scrim`（全图压暗）或 `colors.card` 的不透明度。
- 不要把所有区域都透明：侧栏、顶栏、输入框保持纯色是刻意的层次。
- 输入框文字色由 `composerInput` 控制；按钮由 `composerPrimary` 控制。
- 如果代码块/行内代码对比度差，调 `theme.css` 的
  `--dsw-alias-markdown-code-block` / `inline-code`。

## 7. 中文变成问号/乱码

只可能发生在 `cordis.patch.yml` 的配置值里（本机配置编辑器 UTF-8 往返问题）。

- 把中文从配置里删掉，放回 `boot.js` 的 `cfg` 默认值。
- 已经写坏的，从 `cordis.patch.yml.bak-*` 恢复，再改配置。

## 8. 改了 index.js 不生效

ESM 模块缓存。`install.mjs` 每次都会写新的 `?v=<时间戳>`。手工改的话，把配置里的
`?v=6` 改成 `?v=7`，然后重启。

## 9. DSH 升级后开屏正常、壁纸错位

99% 是哈希类名变了。按 `references/selectors.md` 重新采集，只改
`selectors.json`，重跑 `make-bg.mjs`，重启。不要改生成器逻辑。

## 10. 卸载后还有残留

- `uninstall.mjs` 会删配置条目和插件目录；如果 DSH 正在运行，目录可能删不掉。
  完全退出后手动删：
  ```bash
  rm -rf "$DSH_HOME/profiles/desktop/plugins/dsh-boot-rhine"
  ```
- 检查 `cordis.patch.yml` 里是否还有 `id: boot-rhine`，有就手动删掉整个 `- insert:`
  块。
- 主题是运行时注入的，不会改设置；重启后自然消失。

## 11. 快速诊断脚本（浏览器 Console）

```js
(() => {
  const overlay = document.getElementById("dsh-rhine-overlay");
  const frame = document.querySelector(".BynINW_frame");
  const bg = frame && getComputedStyle(frame).backgroundImage;
  return {
    overlay: Boolean(overlay),
    overlayClass: overlay?.className,
    themeSource: document.documentElement.dataset.dsThemeSource,
    darkAttr: document.body.hasAttribute("data-ds-dark-theme"),
    frameFound: Boolean(frame),
    frameBg: bg?.slice(0, 60),
    bootScreen: Boolean(document.querySelector("[data-dsh-boot]")),
    viewport: [innerWidth, innerHeight]
  };
})();
```

把输出发回来，基本能定位到具体层。
