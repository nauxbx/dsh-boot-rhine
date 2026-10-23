# 分发：skill 还是 agent？

## 1. 结论

**做成 skill，不要做成 agent。**

| | skill | agent（subagent / 独立会话） |
| --- | --- | --- |
| 本质 | 一份按需加载的指令 + 资源包 | 一个有自己上下文的执行者 |
| 分发 | 放进 `~/.dsh/skills/` 即被发现 | 没有“安装一个 agent”的目录约定 |
| 触发 | 用户 `/名字`，或模型按 `description` 自动调用 | 只能在某个会话/编排里临时派生 |
| 适合 | 可重复的流程、安装脚本、模板 | 一次性并行任务、长任务隔离 |

用户需要的是“安装后可以直接调用”，这正是 skill 的模型：装进扫描根，出现在会话目录，
`/dsh-boot-rhine` 或一句“帮我装个开屏”就能触发。agent 是运行时的角色，不是可安装产物。

如果以后想要“一个负责长期维护主题的助手”，那是在 skill 之上再包一个 preset/agent，
不是替代 skill。

## 2. 仓库布局

仓库根目录**就是** skill 目录，必须满足 DSH 的发现规则：
`<root>/SKILL.md`（或 `<name>/SKILL.md`）。

```
dsh-boot-rhine/
├── SKILL.md                 # 模型读的入口（frontmatter: name/description）
├── README.md                # 人读的安装/使用说明
├── LICENSE
├── install.ps1              # Windows 便捷入口
├── install.sh               # macOS / Linux / Git Bash
├── assets/plugin/           # 会被安装到 profile 的插件源
│   ├── lib/index.js
│   ├── lib/boot.css
│   ├── lib/boot.js
│   ├── lib/theme.css
│   ├── selectors.json
│   └── package.json
├── scripts/install.mjs      # 复制 + 注册 + 备份
├── scripts/uninstall.mjs
├── scripts/make-bg.mjs
├── scripts/preview.mjs
├── scripts/doctor.mjs
└── references/              # 按需读取的细节
```

不要提交：

- `preview/`（生成的预览页）
- `theme-bg.css`（几十万字符的 base64）
- `*.bak-*`（配置备份）
- 个人壁纸、个人截图、真实用户名路径

## 3. 用户怎么安装

### 方式 A：clone 到用户级 skill 目录（推荐）

```bash
git clone https://github.com/<you>/dsh-boot-rhine.git ~/.dsh/skills/dsh-boot-rhine
```

Windows PowerShell：

```powershell
git clone https://github.com/<you>/dsh-boot-rhine.git "$HOME\.dsh\skills\dsh-boot-rhine"
```

然后重启 DSH（或新开一个会话），skill 出现在目录里。再说：

> 帮我装 dsh-boot-rhine 开屏，壁纸用 D:\pics\bg.jpg

或直接 `/dsh-boot-rhine`。

### 方式 B：项目级

```bash
git clone <url> <project>/.dsh/skills/dsh-boot-rhine
```

只对那个项目生效（前提：项目根有 `.git`，或 cwd 就是项目根）。

### 方式 C：不用 git

下载 ZIP → 解压到 `~/.dsh/skills/dsh-boot-rhine/`（确保 `SKILL.md` 直接在这个目录
下，不要多一层）。

### 装完手动跑安装器

skill 只是“知道怎么做”；真正写入 profile 的是：

```bash
node ~/.dsh/skills/dsh-boot-rhine/scripts/install.mjs
```

## 4. 发布到 GitHub

本机没有 git 时，可以先用 GitHub 网页上传：

1. 新建仓库 `dsh-boot-rhine`，不要勾选 README（避免冲突）。
2. 把整个目录拖进上传页；确认 `SKILL.md` 在根目录。
3. Commit。

有 git 时：

```bash
cd dsh-boot-rhine
git init
git add .
git commit -m "feat: DSH boot splash + wallpaper skill"
git branch -M main
git remote add origin https://github.com/<you>/dsh-boot-rhine.git
git push -u origin main
```

发布前检查：

- `SKILL.md` frontmatter 的 `name` 是 kebab-case，且和目录名一致；
- `description` 里包含触发词（开屏、启动画面、壁纸、DSH 美化），否则模型不会自动调用；
- 没有个人信息、真实用户名、个人壁纸；
- `node scripts/doctor.mjs --dsh-home <临时目录>` 不依赖作者机器。

## 5. 更新流程

仓库更新后，用户：

```bash
cd ~/.dsh/skills/dsh-boot-rhine
git pull
node scripts/install.mjs
```

`install.mjs` 会覆盖插件文件、保留 `theme-bg.css`、更新 `?v=`，然后重启 DSH。
如果 `theme.css` / `boot.css` 有破坏性改动，在 README 的 Changelog 里注明。

## 6. 许可与品牌

- 代码建议 MIT。
- DeepSeek 鲸鱼 logo 是 DeepSeek 的商标/品牌资产。个人主题使用通常没问题，但要在
  README 写明“非官方、与 DeepSeek 无关”；商用再分发建议换成自己的图形。
- 壁纸版权归用户；仓库不要带示例壁纸，或只带可再分发的素材。

## 7. README 应该包含

1. 一句话说明 + 截图/GIF
2. 前置条件（DSH 桌面版、Node 20+、Windows/macOS）
3. 安装（clone + 重启 + `/dsh-boot-rhine`）
4. 使用（带壁纸、纯渐变、只要主题）
5. 定制入口（三个文件：`boot.js` / `theme.css` / `selectors.json`）
6. 卸载
7. 兼容性（测试过的 DSH 版本；升级后类名可能失效）
8. 许可 + 非官方声明
