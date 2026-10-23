// 生成 theme-bg.css：把壁纸图片（base64）+ 区域配色 + 交互规则打成一张
// 由插件在运行时注入的样式表。换图 / 换色只需要重跑本脚本。
//
// 用法：
//   node scripts/make-bg.mjs "D:\pics\bg.jpg"
//   node scripts/make-bg.mjs "D:\pics\bg.jpg" --out path/theme-bg.css
//   node scripts/make-bg.mjs --gradient            # 不用图片，纯渐变壁纸
//   node scripts/make-bg.mjs "bg.png" --focus "50% 40%" --scrim 30
//
// 依赖 assets/plugin/selectors.json；DSH 升级后类名变了就改那个文件。
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, pluginDirFor, resolveProfile, SKILL_ROOT } from "./lib/resolve.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const DEFAULTS = {
	selectors: join(SKILL_ROOT, "assets", "plugin", "selectors.json"),
	gradient: false,
	focus: null,
	scrim: null
};

function hexToRgb(hex) {
	const value = String(hex).replace("#", "").trim();
	const full = value.length === 3 ? value.split("").map((ch) => ch + ch).join("") : value;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return { r: 10, g: 15, b: 30 };
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16)
	};
}

function rgb(hex, alpha) {
	const { r, g, b } = hexToRgb(hex);
	return alpha === undefined ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha}%)`;
}

const MIME = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
	".avif": "image/avif"
};

/** 生成 theme-bg.css 文本。 */
export function buildBackgroundCss({ imagePath, selectors, gradient, focus, scrim }) {
	const roles = selectors.roles ?? {};
	const colors = selectors.colors ?? {};
	const wallpaper = selectors.wallpaper ?? {};
	const bg = colors.bg ?? "#0a0f1e";
	const accent = colors.accent ?? "#7ea2ff";
	const card = colors.card ?? "rgb(11 17 34 / 40%)";
	const cardBorder = colors.cardBorder ?? "rgb(126 162 255 / 14%)";
	const focusValue = focus || wallpaper.focus || "50% 40%";
	const scrimValue = scrim ?? wallpaper.scrim ?? 25;
	const leftFadeStop = wallpaper.leftFadeStop ?? 6;
	const leftFade = wallpaper.leftFade ?? 20;

	let imageValue;
	let imageSize = "cover";
	let imagePosition = focusValue;
	if (gradient) {
		imageValue = [
			`radial-gradient(1100px 760px at 72% 18%, ${rgb(accent, 26)} 0%, transparent 62%)`,
			`radial-gradient(900px 620px at 18% 82%, ${rgb(accent, 16)} 0%, transparent 60%)`,
			`radial-gradient(120% 100% at 50% 0%, ${rgb(bg, 100)} 0%, #060b18 100%)`
		].join(",\n\t\t");
		imageSize = "auto";
		imagePosition = "center";
	} else {
		if (!imagePath) throw new Error("没有图片路径；想用纯渐变请加 --gradient。");
		if (!existsSync(imagePath)) throw new Error(`图片不存在：${imagePath}`);
		const ext = extname(imagePath).toLowerCase();
		const mime = MIME[ext];
		if (!mime) throw new Error(`不支持的图片格式：${ext}（支持 jpg/png/webp/gif/avif）`);
		const bytes = readFileSync(imagePath);
		if (bytes.length > 12 * 1024 * 1024) {
			console.warn(`⚠ 图片 ${(bytes.length / 1024 / 1024).toFixed(1)} MB，生成的 CSS 会很大；建议先压到 2 MB 以内。`);
		}
		imageValue = `url(data:${mime};base64,${bytes.toString("base64")})`;
	}

	const scoped = (selector) => `html[data-ds-theme-source] body[data-ds-dark-theme] ${selector}`;
	const group = (selectorsList) => selectorsList.map(scoped).join(",\n");
	const transparent = [...(roles.transparent ?? []), ...(roles.conversation ?? [])];
	const sessionRows = roles.sessionRows ?? [];

	const imageVar = `\t--rhine-bg-image: ${imageValue};\n`;

	const parts = [];
	parts.push(`/* ============================================================
   dsh-boot-rhine — 壁纸主题（自动生成，请勿手改）
   由 scripts/make-bg.mjs 生成；图片：${gradient ? "（纯渐变）" : basename(imagePath)}
   换图/换色：重跑生成器。选择器来自 assets/plugin/selectors.json。
   ============================================================ */

html[data-ds-theme-source] body[data-ds-dark-theme] {
${imageVar}}`);

	parts.push(`/* 壁纸挂在应用最外层框架上；左边缘渐隐 + 读衬，保证侧栏文字可读 */
${scoped(roles.frame ?? ".BynINW_frame")} {
	background-image:
		linear-gradient(90deg, ${rgb(bg, 100)} 0%, ${rgb(bg, 50)} ${leftFadeStop}%, transparent ${leftFade}%),
		linear-gradient(${rgb(bg, scrimValue)}, ${rgb(bg, scrimValue)}),
		var(--rhine-bg-image);
	background-size: auto, auto, ${imageSize};
	background-position: 0 0, 0 0, ${imagePosition};
	background-repeat: no-repeat;
}`);

	if (transparent.length > 0) {
		parts.push(`/* 主内容链路全部透明，让壁纸从内容区透出 */
${group(transparent)} {
	background: transparent;
}`);
	}

	if (roles.messageColumn) {
		parts.push(`/* 对话消息列：毛玻璃卡片，兼顾可读性与透出 */
${scoped(roles.messageColumn)} {
	box-sizing: border-box;
	background: ${card};
	-webkit-backdrop-filter: blur(4px);
	backdrop-filter: blur(4px);
	border: 0.5px solid ${cardBorder};
	border-radius: 16px;
	padding: 12px 20px;
}`);
	}

	if (roles.trajectoryBar) {
		parts.push(`/* 轨迹工具栏：半透明，不挡壁纸 */
${scoped(roles.trajectoryBar)} {
	background: ${rgb(colors.header ?? "#0e1830", 72)};
}`);
	}

	if (roles.tabStrip) {
		parts.push(`${scoped(roles.tabStrip)} {
	background: ${rgb(bg, 55)};
}`);
	}

	if (roles.composerCard) {
		parts.push(`/* 底部输入框：与壁纸同色调的纯色 */
${scoped(roles.composerCard)} {
	background: ${colors.composer ?? "#2b4972"};
	border-color: ${rgb(accent, 22)};
}`);

		if (roles.composerInput) {
			parts.push(`${scoped(roles.composerInput)} {
	color: ${colors.composerText ?? "#eef2ff"};
}`);
		}

		if (roles.composerPrimary) {
			parts.push(`/* 右下角提交按钮 */
${scoped(roles.composerPrimary)} {
	background: ${colors.primary ?? "#ffffff"};
	color: ${colors.primaryText ?? "#132647"};
}

${scoped(roles.composerPrimary)}:hover:not(:disabled) {
	background: ${colors.primaryHover ?? "#d7e2ff"};
}`);
		}
	}

	parts.push(`/* 左侧侧边栏 / 顶栏：纯色，工作区让位给壁纸 */
${scoped(roles.sidebar ?? ".BynINW_sidebarCol")} {
	background: ${colors.sidebar ?? "#0c1428"};
}

${scoped(roles.header ?? ".Dc7zOa_header")} {
	background: ${colors.header ?? "#0e1830"};
}`);

	if (sessionRows.length > 0) {
		parts.push(`/* 会话条目悬浮：略微放大 + 变深 */
${group(sessionRows)} {
	position: relative;
	transition: transform 0.16s cubic-bezier(0.2, 0.7, 0.3, 1), background-color 0.16s ease;
}

${sessionRows.map((selector) => `${scoped(selector)}:hover`).join(",\n")} {
	transform: scale(1.045);
	transform-origin: left center;
	background: ${colors.sessionHover ?? "#22355e"};
	z-index: 1;
}`);
	}

	return parts.join("\n\n") + "\n";
}

/** 写文件；父目录不存在时创建。 */
export function writeBackgroundCss(options) {
	const selectorsPath = resolve(options.selectorsPath ?? DEFAULTS.selectors);
	const selectors = JSON.parse(readFileSync(selectorsPath, "utf8"));
	const css = buildBackgroundCss({ ...options, selectors });
	const outPath = resolve(options.outPath);
	writeFileSync(outPath, css, "utf8");
	return { outPath, bytes: Buffer.byteLength(css), selectorsPath };
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const imagePath = args._[0] ? resolve(args._[0]) : undefined;
	const gradient = Boolean(args.gradient) || !imagePath;

	let outPath = args.out;
	if (!outPath) {
		const profile = resolveProfile({ dshHome: args["dsh-home"], profile: args.profile });
		outPath = join(pluginDirFor(profile), "lib", "theme-bg.css");
		if (!existsSync(dirname(outPath))) {
			throw new Error(`插件目录还没安装：${dirname(outPath)}\n先运行：node scripts/install.mjs`);
		}
	}

	const result = writeBackgroundCss({
		imagePath,
		outPath,
		selectorsPath: args.selectors,
		gradient,
		focus: args.focus,
		scrim: args.scrim === undefined ? undefined : Number(args.scrim)
	});
	console.log(`✓ 已生成 ${result.outPath}（${(result.bytes / 1024).toFixed(1)} KB，选择器 ${result.selectorsPath}）`);
	console.log("  桌面窗口需重启 DSH；外部浏览器刷新即生效。");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		main();
	} catch (error) {
		console.error(`✗ ${error.message}`);
		process.exit(1);
	}
}
