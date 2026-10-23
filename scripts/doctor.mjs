// 体检：检查插件文件、cordis 注册、缓存标记与壁纸是否就位。
//   node scripts/doctor.mjs
//   node scripts/doctor.mjs --dsh-home ... --profile ...
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, pluginDirFor, resolveProfile } from "./lib/resolve.mjs";

function main() {
	const args = parseArgs(process.argv.slice(2));
	const profile = resolveProfile({ dshHome: args["dsh-home"], profile: args.profile });
	const targetDir = pluginDirFor(profile);
	const libDir = join(targetDir, "lib");
	const problems = [];

	console.log(`DSH home : ${profile.home}`);
	console.log(`profile  : ${profile.name}`);
	console.log(`插件目录 : ${targetDir}`);
	console.log("");

	for (const relative of ["lib/index.js", "lib/boot.css", "lib/boot.js", "lib/theme.css", "lib/theme-guard.js", "package.json"]) {
		const path = join(targetDir, ...relative.split("/"));
		const ok = existsSync(path);
		console.log(`${ok ? "✓" : "✗"} ${relative}${ok ? `（${(statSync(path).size / 1024).toFixed(1)} KB）` : " 缺失"}`);
		if (!ok) problems.push(`缺少 ${relative}`);
	}

	const config = readFileSync(profile.cordis, "utf8");
	const start = config.replace(/\r\n/g, "\n").split("\n").findIndex((line) => /^\s*-\s*id:\s*boot-rhine\s*$/.test(line));
	console.log(`${start === -1 ? "✗" : "✓"} cordis.patch.yml ${start === -1 ? "没有 boot-rhine 条目" : "已注册 boot-rhine"}`);
	if (start === -1) problems.push("cordis.patch.yml 缺少 boot-rhine 条目");

	if (start !== -1) {
		const lines = config.replace(/\r\n/g, "\n").split("\n");
		const dashIndent = lines[start].match(/^\s*/)[0].length;
		let end = lines.length;
		for (let i = start + 1; i < lines.length; i += 1) {
			if (/^\s*-\s+/.test(lines[i]) && lines[i].match(/^\s*/)[0].length <= dashIndent) {
				end = i;
				break;
			}
		}
		const block = lines.slice(start, end).join("\n");
		/* YAML 里可能用反斜杠折行，先展开再找 URL */
		const unfolded = block.replace(/\\\n\s*/g, "");

		const urlMatch = /name:\s*"?(file:[^"\s]+)"?/.exec(unfolded);
		if (!urlMatch) {
			console.log("✗ 条目里没有 file:// URL");
			problems.push("条目缺少 file:// URL");
		} else {
			const url = urlMatch[1];
			const cache = /\?v=(\d+)/.exec(url);
			let filePath;
			try {
				filePath = fileURLToPath(url.split("?")[0]);
			} catch {
				filePath = undefined;
			}
			let ok = false;
			try {
				ok = Boolean(filePath && statSync(filePath).isFile());
			} catch {
				ok = false;
			}
			console.log(`${ok ? "✓" : "✗"} 入口文件 ${ok ? filePath : `不存在或不是文件：${filePath ?? url}`}`);
			if (!ok) problems.push("入口文件不存在");
			console.log(`  缓存标记 ?v=${cache ? cache[1] : "（无）"}`);
		}

		for (const key of ["enabled", "splashEnabled", "themeEnabled", "forceDark", "minDisplayMs", "maxDisplayMs", "autoLaunchMs", "fadeMs"]) {
			const match = new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, "m").exec(block);
			console.log(`  ${key}: ${match ? match[1] : "（未设置，用默认值）"}`);
		}
	}

	const themeBg = join(libDir, "theme-bg.css");
	if (existsSync(themeBg)) {
		console.log(`✓ 壁纸主题 theme-bg.css（${(statSync(themeBg).size / 1024).toFixed(1)} KB）`);
	} else {
		console.log("· 未生成 theme-bg.css（无壁纸，仅纯色主题；需要时跑 make-bg.mjs）");
	}

	if (/[\u4e00-\u9fff]/.test(config)) {
		console.log("⚠ cordis.patch.yml 里含中文；本机配置编辑器可能无法正确往返 UTF-8，建议改到 boot.js 默认值里。");
	}

	console.log("");
	if (problems.length === 0) {
		console.log("结论：安装完整。若桌面窗口没变化，请完全退出并重新打开 DSH。");
	} else {
		console.log(`结论：发现 ${problems.length} 个问题。`);
		console.log("修复：node scripts/install.mjs");
		process.exitCode = 1;
	}
}

try {
	main();
} catch (error) {
	console.error(`✗ ${error.message}`);
	process.exit(1);
}
