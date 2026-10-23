# 实现架构

## 1. 为什么是 cordis 插件

DSH 的 Web GUI 在启动时收集一张“注入表”，再把它应用到页面 `<head>`。收集过程是
一个事件：

```js
ctx.on("webserver/index-inject", (table) => {
	table.push({ kind: "style", placement: "head", text: css });
	table.push({ kind: "script", placement: "head", text: js });
});
```

插件只做这一件事，视觉与交互全部在 `boot.css` / `boot.js` 里。这样：

- 不修改 DSH 安装目录，不破坏签名/自动更新；
- 卸载 = 删插件目录 + 删配置条目；
- 同一份代码同时服务桌面窗口和外部浏览器。

## 2. 两条加载路径

| 路径 | 文档来源 | 注入方式 | 热更新 |
| --- | --- | --- | --- |
| 桌面窗口 | `dsh-app://` 本地文档 | 壳进程经 IPC 拿注入表，逐行应用 | 启动时就绪时快照一次 → 必须重启 |
| 外部浏览器 | `http://127.0.0.1:<port>/` | webServer 把同一张表渲染进 `index.html` | 每次响应实时收集 → 刷新即可 |

`index.js` 在**每次收集**时从磁盘读 `boot.css` / `boot.js`（以及可选的
`theme.css` / `theme-bg.css`），所以外部浏览器路径能立即看到改动。桌面路径拿到的是
启动时的字符串，改文件不会影响已经打开的窗口。

## 3. 注册

`cordis.patch.yml` 末尾：

```yaml
- insert:
    - id: boot-rhine
      name: "file:///C:/Users/<you>/.dsh/profiles/desktop/plugins/dsh-boot-rhine/lib/index.js?v=6"
      config:
        enabled: true
        splashEnabled: true
        themeEnabled: true
        forceDark: true
        minDisplayMs: 1500
        maxDisplayMs: 3300
        autoLaunchMs: 0
        fadeMs: 450
```

- `name` 是 ESM 入口，必须是 `file://` URL；`?v=` 是模块缓存破坏标记，改
  `index.js` 后要换一个新值（安装脚本用时间戳）。
- `config` 会作为 `apply(ctx, config)` 的第二个参数。
- 多个 `- insert:` 块是合法的；安装脚本只维护含 `id: boot-rhine` 的那一条。

## 4. 开屏状态机（boot.js）

```
页面加载
  └─ appendChild(#dsh-rhine-overlay)
      ├─ 调色板守卫：themeEnabled && forceDark → html[data-ds-theme-source=dark]
      │                + body[data-ds-dark-theme]，MutationObserver 重断言 12s
      ├─ tick()：maxDisplayMs 内推进到 96%，ready/launching 时 100%
      ├─ MutationObserver 观察 [data-dsh-boot]
      │     ├─ 出现 → bootSeen=true；查 [class*="_failed"] → 故障态
      │     └─ 消失 → appReady=true → enterReady()
      ├─ 兜底 forceReady：max(maxDisplayMs, 7000) 后强制可交互
      └─ 点击 / Enter / Space / Esc → requestLaunch()
            ├─ appReady → doLaunch()：光环 + LAUNCHING… + 480ms 后淡出
            └─ 未就绪 → "LAUNCH ACCEPTED · WAITING FOR HARNESS…"，
                         就绪后自动 doLaunch()
```

关键点：

- `minDisplayMs` 目前只作为配置保留，没有硬性阻塞；真正的展示时长由
  `maxDisplayMs` 与点击时机决定。要做“最短展示”需在 `requestLaunch` 里加时间判断。
- 覆盖层 `z-index: 2147483000`，启动前 `pointer-events: auto` 拦截鼠标是**有意**
  的启动门；`doLaunch` 后 `overlay.remove()`，事件自然恢复。
- `fault` 分支允许点击跳过，显示 `BOOT FAULT · ...`。
- `prefers-reduced-motion: reduce` 时 CSS 动画几乎归零，但点击逻辑不变。

## 5. 主题层

- `theme.css`：覆盖 `--dsw-alias-*` / `--dsw-specific-*`，选择器前缀
  `html[data-ds-theme-source] body[data-ds-dark-theme]`。前缀提升特异性，压过
  ui-theme 注入的 token 表；`body[data-ds-dark-theme]` 保证只影响深色。
- `theme-bg.css`（生成）：图片 base64 + 区域样式，选择器来自
  `selectors.json`。同样只在深色下生效。
- 主题 CSS 不写任何设置，不改 `ui-theme` 命名空间。切浅色就恢复默认。
- 只开主题（`splashEnabled: false`）时 `boot.js` 不注入，`index.js` 会额外注入
  `theme-guard.js`，用同样的逻辑把调色板钉在深色，否则浅色偏好下主题不会出现。

## 6. 壁纸层

```
BynINW_frame（最外层框架）
  background:
    linear-gradient(90deg, bg 0%, bg/50% 6%, transparent 20%)   ← 左边缘渐隐
    linear-gradient(bg/25%, bg/25%)                              ← 读衬
    url(data:image/jpeg;base64,...) cover, position 50% 40%      ← 壁纸
```

然后把 `centerCol` / `rightbarCol` / 标签页窗格 / 对话视图 / 滚动容器全部设
`background: transparent`，壁纸从内容区透出；对话列单独加 40% 半透明 + `blur(4px)`
的卡片，保证长文可读。侧栏、顶栏、输入框保持不透明纯色，作为视觉锚点。

类名是 CSS Modules 构建哈希，升级会变。`selectors.json` 是唯一的类名来源，
`make-bg.mjs` 负责渲染，所以换版本只改 JSON。

## 7. 失败边界

- `index.js` 的注入包在 `try/catch`：读文件失败就跳过，**绝不影响页面渲染**。
- `theme-bg.css` 不存在时只跳过壁纸，开屏和纯色主题照常。
- `boot.js` 所有 DOM 查询都判空；观察器失败时依赖计时兜底。
- 注入脚本失败不会阻止 DSH 自身启动，只表现为“没有开屏”。
