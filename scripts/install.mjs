// 把 skill 内置的插件资源安装到 DSH profile，并在 cordis.patch.yml 注册。
//
// 用法：
//   node scripts/install.mjs
//   node scripts/install.mjs --wallpaper "D:\pics\bg.jpg"
//   node scripts/install.mjs --gradient
//   node scripts/install.mjs --dry-run
//   node scripts/install.mjs --theme-only       # 只主题/壁纸，不要开屏
//   node scripts/install.mjs --splash-only      # 只要开屏，不改主题
//   node scripts/install.mjs --all              # 恢复开屏 + 主题
//   node scripts/install.mjs --no-force-dark    # 不强制深色，尊重用户偏好
//   node scripts/install.mjs --dsh-home "D:\dsh-home" --profile desktop
//
// 特性：
// - 幂等：已存在 boot-rhine 条目时只更新 URL 的 ?v= 缓存标记，保留配置值
// - 备份 cordis.patch.yml
// - 不删除 theme-bg.css（用户生成的壁纸）
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { pluginDirFor, resolveProfile, SKILL_ROOT, parseArgs } from "./lib/resolve.mjs";
import { writeBackgroundCss } from "./make-bg.mjs";

const SOURCE_DIR = join(SKILL_ROOT, "assets", "plugin");
const PLUGIN_FILES = ["lib/index.js", "lib/boot.css", "lib/boot.js", "lib/theme.css", "lib/theme-guard.js", "package.json"];

const CONFIG_KEYS = ["enabled", "splashEnabled", "themeEnabled", "forceDark", "minDisplayMs", "maxDisplayMs", "autoLaunchMs", "fadeMs"];
const CONFIG_DEFAULTS = {
	enabled: "true",
	splashEnabled: "true",
	themeEnabled: "true",
	forceDark: "true",
	minDisplayMs: "1500",
	maxDisplayMs: "3300",
	autoLaunchMs: "0",
	fadeMs: "450"
};

function stamp() {
	const now = new Date();
	const pad = (value) => String(value).padStart(2, "0");
	return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function readConfigValues(block) {
	const values = { ...CONFIG_DEFAULTS };
	for (const key of CONFIG_KEYS) {
		const match = new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, "m").exec(block);
		if (match) values[key] = match[1].replace(/^["']|["']$/g, "");
	}
	return values;
}

function buildBlock(url, values, indent) {
	const pad = " ".repeat(indent);
	const keyPad = " ".repeat(indent + 2);
	const lines = [`${pad}- id: boot-rhine`, `${keyPad}name: ${JSON.stringify(url)}`, `${keyPad}config:`];
	for (const key of CONFIG_KEYS) {
		lines.push(`${keyPad}  ${key}: ${values[key]}`);
	}
	return lines;
}

/** 在 YAML 文本里写入/更新 boot-rhine 条目。overrides 用于 --theme-only 等开关。 */
export function patchConfigText(text, url, overrides = {}) {
	const eol = text.includes("\r\n") ? "\r\n" : "\n";
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	const start = lines.findIndex((line) => /^\s*-\s*id:\s*boot-rhine\s*$/.test(line));

	if (start === -1) {
		const block = buildBlock(url, { ...CONFIG_DEFAULTS, ...overrides }, 4);
		while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
		const next = [...lines, "", "- insert:", ...block, ""].join("\n");
		return next.replaceAll("\n", eol);
	}

	const dashIndent = lines[start].match(/^\s*/)[0].length;
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i += 1) {
		if (/^\s*-\s+/.test(lines[i]) && lines[i].match(/^\s*/)[0].length <= dashIndent) {
			end = i;
			break;
		}
	}
	const blockText = lines.slice(start, end).join("\n");
	const values = { ...readConfigValues(blockText), ...overrides };
	const rebuilt = buildBlock(url, values, dashIndent);
	lines.splice(start, end - start, ...rebuilt);
	return lines.join("\n").replaceAll("\n", eol);
}

function backup(path) {
	const target = `${path}.bak-${stamp()}`;
	copyFileSync(path, target);
	return target;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const dryRun = Boolean(args["dry-run"]);
	const profile = resolveProfile({ dshHome: args["dsh-home"], profile: args.profile });
	const targetDir = pluginDirFor(profile);
	const libDir = join(targetDir, "lib");
	const url = `${pathToFileURL(join(libDir, "index.js")).href}?v=${Date.now()}`;

	console.log(`DSH home : ${profile.home}`);
	console.log(`profile  : ${profile.name}`);
	console.log(`插件目录 : ${targetDir}`);
	if (dryRun) console.log("模式     : dry-run（只打印，不写文件）");
	if (args["theme-only"]) console.log("模式     : theme-only（只注入主题，不开屏）");
	if (args["splash-only"]) console.log("模式     : splash-only（只开屏，不改主题）");

	for (const relative of PLUGIN_FILES) {
		const source = join(SOURCE_DIR, ...relative.split("/"));
		if (!existsSync(source)) {
			throw new Error(`skill 资源缺失：${source}`);
		}
	}
	if (!existsSync(SOURCE_DIR)) throw new Error(`找不到插件资源目录：${SOURCE_DIR}`);
	if (args.wallpaper && !existsSync(resolve(String(args.wallpaper)))) {
		throw new Error(`壁纸图片不存在：${args.wallpaper}`);
	}

	if (!dryRun) {
		mkdirSync(libDir, { recursive: true });
		for (const relative of PLUGIN_FILES) {
			const destination = join(targetDir, ...relative.split("/"));
			mkdirSync(join(destination, ".."), { recursive: true });
			copyFileSync(join(SOURCE_DIR, ...relative.split("/")), destination);
		}
	}

	const original = readFileSync(profile.cordis, "utf8");
	const overrides = {};
	if (args["theme-only"]) {
		overrides.splashEnabled = "false";
		overrides.themeEnabled = "true";
	}
	if (args["splash-only"]) {
		overrides.splashEnabled = "true";
		overrides.themeEnabled = "false";
	}
	if (args.all) {
		overrides.splashEnabled = "true";
		overrides.themeEnabled = "true";
	}
	if (args["no-force-dark"]) overrides.forceDark = "false";
	const patched = patchConfigText(original, url, overrides);
	if (!dryRun) {
		const backupPath = backup(profile.cordis);
		writeFileSync(profile.cordis, patched, "utf8");
		console.log(`✓ 配置已更新（备份 ${basename(backupPath)}）`);
	} else {
		console.log("将写入配置：");
		console.log(patched.slice(patched.indexOf("- insert:")));
	}

	if (args.wallpaper) {
		if (dryRun) {
			console.log(`将生成壁纸：${args.wallpaper}`);
		} else {
			const result = writeBackgroundCss({
				imagePath: args.wallpaper,
				outPath: join(libDir, "theme-bg.css"),
				selectorsPath: join(SOURCE_DIR, "selectors.json")
			});
			console.log(`✓ 壁纸已生成（${(result.bytes / 1024).toFixed(1)} KB）`);
		}
	} else if (args.gradient) {
		if (!dryRun) {
			const result = writeBackgroundCss({
				gradient: true,
				outPath: join(libDir, "theme-bg.css"),
				selectorsPath: join(SOURCE_DIR, "selectors.json")
			});
			console.log(`✓ 渐变壁纸已生成（${(result.bytes / 1024).toFixed(1)} KB）`);
		}
	}

	console.log("");
	console.log("下一步：");
	console.log("  1. 完全退出并重新打开 DSH（桌面窗口的注入表在启动时快照）");
	console.log("  2. 外部浏览器刷新 DSH 页面可立即看到效果");
	console.log("  3. 应用内 Ctrl+Alt+B 可重播开屏");
	console.log("  4. 体检：node scripts/doctor.mjs");
}

try {
	main();
} catch (error) {
	console.error(`✗ ${error.message}`);
	process.exit(1);
}
