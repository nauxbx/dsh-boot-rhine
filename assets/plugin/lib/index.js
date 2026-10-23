// dsh-boot-rhine — DeepSeek Harness 蓝色开屏动画（点击鲸鱼图标启动）
//
// 工作原理：向 `webserver/index-inject` 事件推送结构化注入行（style + script）。
// 该表同时覆盖两条加载路径：
//   1. 桌面窗口：dsh-app:// 本地文档通过 IPC 拿注入表，由壳 JS 逐行应用
//   2. 外部浏览器：webServer 把同一张表渲染进 index.html
// 注入的脚本在页面加载第一时间创建全屏开屏层：蓝色 DeepSeek 风格 + 官方
// 鲸鱼图标，启动进度播完后进入"点击启动"状态，点击图标（或按
// Enter/空格/Esc）播放启动闪光并淡出进入应用。
//
// boot.css / boot.js 在每次收集注入表时实时从磁盘读取：
// 改这两个文件后保存，外部浏览器刷新页面立即生效；桌面窗口需重启 DSH
// （注入表在启动时就绪时快照一次）。
//
// 配置（cordis.patch.yml）：
//   enabled       是否启用（false 时完全不注入）
//   splashEnabled 是否注入开屏（false 时只保留主题，可配合 themeEnabled）
//   title         主标题（逐字母动画）
//   subtitle      副标题
//   caption       底部提示文字
//   watermark     背景水印（默认空）
//   minDisplayMs  最短展示时长（毫秒）
//   maxDisplayMs  进度条时长（毫秒）
//   autoLaunchMs  就绪后自动启动的等待毫秒数（0 = 一直等用户点击）
//   fadeMs        淡出时长（毫秒）
//   themeEnabled  是否注入主题 CSS（false 只保留开屏）
//   forceDark     是否在会话前 12 秒把调色板固定为深色（配合深色主题）

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const name = "boot-rhine";
export const inject = ["webServer"];

const here = dirname(fileURLToPath(import.meta.url));

const DEFAULTS = {
	enabled: true,
	splashEnabled: true,
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
};

function buildRows(options) {
	const settings = JSON.stringify({
		title: options.title,
		subtitle: options.subtitle,
		caption: options.caption,
		watermark: options.watermark,
		minDisplayMs: Number(options.minDisplayMs) || DEFAULTS.minDisplayMs,
		maxDisplayMs: Number(options.maxDisplayMs) || DEFAULTS.maxDisplayMs,
		autoLaunchMs: Number(options.autoLaunchMs) || 0,
		fadeMs: Number(options.fadeMs) || DEFAULTS.fadeMs,
		themeEnabled: options.themeEnabled !== false,
		forceDark: options.forceDark !== false
	}).replaceAll("<", "\\u003c");
	const rows = [];
	if (options.splashEnabled !== false) {
		/* 每次收集实时读取，改文件后刷新页面（HTTP 路径）即生效 */
		const bootCss = readFileSync(join(here, "boot.css"), "utf8");
		const bootJs = readFileSync(join(here, "boot.js"), "utf8");
		rows.push(
			{ kind: "style", placement: "head", text: bootCss },
			{ kind: "script", placement: "head", text: `globalThis.__DSH_BOOT_RHINE__=${settings};${bootJs}` }
		);
	}
	if (options.themeEnabled !== false) {
		rows.push({ kind: "style", placement: "head", text: readFileSync(join(here, "theme.css"), "utf8") });
		try {
			rows.push({ kind: "style", placement: "head", text: readFileSync(join(here, "theme-bg.css"), "utf8") });
		} catch {
			/* theme-bg.css 不存在（可用 make-bg.mjs 生成）时仅跳过 */
		}
		/* 只开主题时没有 boot.js，单独注入深色守卫 */
		if (options.splashEnabled === false && options.forceDark !== false) {
			rows.push({ kind: "script", placement: "head", text: readFileSync(join(here, "theme-guard.js"), "utf8") });
		}
	}
	return rows;
}

export function apply(ctx, config = {}) {
	const options = { ...DEFAULTS, ...(config ?? {}) };
	if (options.enabled === false) return;
	ctx.on("webserver/index-inject", (table) => {
		try {
			table.push(...buildRows(options));
		} catch {
			/* 读取失败时跳过注入，绝不影响页面渲染 */
		}
	});
}
