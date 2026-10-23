// 卸载 dsh-boot-rhine：从 cordis.patch.yml 删除插件条目，并删除插件目录。
// 配置先备份；--dry-run 只打印。
//   node scripts/uninstall.mjs
//   node scripts/uninstall.mjs --dry-run
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pluginDirFor, resolveProfile, parseArgs } from "./lib/resolve.mjs";

function stamp() {
	const now = new Date();
	const pad = (value) => String(value).padStart(2, "0");
	return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/** 从 YAML 文本里删除 boot-rhine 条目；顺带清掉变空的 - insert: 父条目。 */
export function removeConfigText(text) {
	const eol = text.includes("\r\n") ? "\r\n" : "\n";
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	const start = lines.findIndex((line) => /^\s*-\s*id:\s*boot-rhine\s*$/.test(line));
	if (start === -1) return { text, removed: false };

	const dashIndent = lines[start].match(/^\s*/)[0].length;
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i += 1) {
		if (/^\s*-\s+/.test(lines[i]) && lines[i].match(/^\s*/)[0].length <= dashIndent) {
			end = i;
			break;
		}
	}
	lines.splice(start, end - start);

	// 清理空 insert 块：从下往上，避免索引漂移。
	for (let i = lines.length - 1; i >= 0; i -= 1) {
		const match = /^(\s*)-\s*insert:\s*$/.exec(lines[i]);
		if (!match) continue;
		const indent = match[1].length;
		let next = i + 1;
		while (next < lines.length && lines[next].trim() === "") next += 1;
		const hasChild = next < lines.length
			&& /^\s*-\s+/.test(lines[next])
			&& lines[next].match(/^\s*/)[0].length > indent;
		if (!hasChild) lines.splice(i, 1);
	}

	return { text: lines.join("\n").replaceAll("\n", eol), removed: true };
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const profile = resolveProfile({ dshHome: args["dsh-home"], profile: args.profile });
	const targetDir = pluginDirFor(profile);
	const dryRun = Boolean(args["dry-run"]);

	const original = readFileSync(profile.cordis, "utf8");
	const result = removeConfigText(original);
	if (!result.removed) {
		console.log(`cordis.patch.yml 里没有 boot-rhine 条目（${profile.cordis}）`);
	} else if (dryRun) {
		console.log("将删除配置条目：");
		console.log(original.slice(original.indexOf("- insert:")));
	} else {
		copyFileSync(profile.cordis, `${profile.cordis}.bak-${stamp()}`);
		writeFileSync(profile.cordis, result.text, "utf8");
		console.log("✓ 已从 cordis.patch.yml 删除 boot-rhine");
	}

	if (existsSync(targetDir)) {
		if (dryRun) {
			console.log(`将删除插件目录：${targetDir}`);
		} else {
			try {
				rmSync(targetDir, { recursive: true, force: true });
				console.log(`✓ 已删除插件目录：${targetDir}`);
			} catch (error) {
				console.warn(`⚠ 删除插件目录失败（DSH 可能正在运行）：${error.message}`);
				console.warn(`  完全退出 DSH 后手动删除：${targetDir}`);
			}
		}
	}

	console.log("");
	console.log("下一步：完全退出并重新打开 DSH，开屏与壁纸主题即消失。");
	console.log("配置备份在 cordis.patch.yml.bak-*，需要恢复时改名覆盖即可。");
}

try {
	main();
} catch (error) {
	console.error(`✗ ${error.message}`);
	process.exit(1);
}
