// 把开屏资源组装成独立 HTML，直接在浏览器打开即可预览，无需安装/重启 DSH。
//
// 用法：
//   node scripts/preview.mjs
//   node scripts/preview.mjs --still          # 就绪态静帧，方便截图
//   node scripts/preview.mjs --title "MY HARNESS" --subtitle "..." --watermark "..."
//   node scripts/preview.mjs --out D:\tmp\boot.html
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs, SKILL_ROOT } from "./lib/resolve.mjs";

const LIB = join(SKILL_ROOT, "assets", "plugin", "lib");

function main() {
	const args = parseArgs(process.argv.slice(2));
	const still = Boolean(args.still);
	const settings = {
		title: args.title || "DEEPSEEK HARNESS",
		subtitle: args.subtitle || "AI AGENT HARNESS · 智能体工作台",
		caption: args.caption || "点击图标启动 · CLICK THE EMBLEM TO LAUNCH",
		watermark: args.watermark || "",
		minDisplayMs: Number(args["min-display-ms"] ?? 1500),
		maxDisplayMs: Number(args["max-display-ms"] ?? 4000),
		autoLaunchMs: Number(args["auto-launch-ms"] ?? 0),
		fadeMs: Number(args["fade-ms"] ?? 450),
		themeEnabled: false,
		forceDark: false
	};

	const css = readFileSync(join(LIB, "boot.css"), "utf8");
	const js = readFileSync(join(LIB, "boot.js"), "utf8");
	const payload = JSON.stringify(settings).replaceAll("<", "\\u003c");

	const stillCss = still
		? `<style>
.rhine-halo,.rhine-whale,.rhine-word .rhine-l,.rhine-sub,.rhine-caption,.rhine-watermark{opacity:1!important;transform:none!important;animation:none!important}
.rhine-tile{stroke-dashoffset:0!important;animation:none!important}
.rhine-emblem{animation:none!important;transform:none!important}
.rhine-bar{width:100%!important}
.rhine-pct{font-size:0!important}
.rhine-pct::after{content:"100%";font-size:12px}
.rhine-status{font-size:0!important;color:var(--ds-blue-soft)!important}
.rhine-status::after{content:"SYSTEM READY · 点击鲸鱼图标启动 · CLICK TO LAUNCH";font-size:11px}
#dsh-rhine-overlay.rhine-ready .rhine-status::after{content:"SYSTEM READY · 点击鲸鱼图标启动 · CLICK TO LAUNCH";font-size:11px;animation:none}
</style>`
		: "";
	const stillScript = still
		? `<script>setTimeout(()=>{const o=document.getElementById("dsh-rhine-overlay");if(!o)return;o.classList.add("rhine-ready");const s=o.querySelector(".rhine-status");if(s)s.textContent="SYSTEM READY · 点击鲸鱼图标启动 · CLICK TO LAUNCH";},1200)</script>`
		: "";

	const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dsh-boot-rhine 预览</title>
<style>${css}</style>
<script>globalThis.__DSH_BOOT_RHINE__=${payload};${js}</script>
${stillCss}
${stillScript}</head>
<body></body>
</html>
`;

	const outPath = resolve(args.out || join(SKILL_ROOT, "preview", still ? "still.html" : "index.html"));
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, html, "utf8");
	console.log(`✓ 预览已生成：${outPath}`);
	console.log("  直接用浏览器打开；Ctrl+Alt+B 可重播（预览页同样支持）。");
}

try {
	main();
} catch (error) {
	console.error(`✗ ${error.message}`);
	process.exit(1);
}
