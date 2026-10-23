// 共享路径解析：定位 DSH home、profile、插件目录与 skill 根目录。
// 只做存在性检查，不写任何文件。
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** 仓库 / skill 根目录（scripts/lib/ 往上两级）。 */
export const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** 极简参数解析：--key value、--key=value、--flag。 */
export function parseArgs(argv) {
	const out = { _: [] };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (!arg.startsWith("--")) {
			out._.push(arg);
			continue;
		}
		const eq = arg.indexOf("=");
		if (eq !== -1) {
			out[arg.slice(2, eq)] = arg.slice(eq + 1);
			continue;
		}
		const key = arg.slice(2);
		const next = argv[i + 1];
		if (next !== undefined && !next.startsWith("--")) {
			out[key] = next;
			i += 1;
		} else {
			out[key] = true;
		}
	}
	return out;
}

/** 解析 DSH home，优先级：--dsh-home > $DSH_HOME > ~/.dsh。 */
export function resolveDshHome(value) {
	const home = value || process.env.DSH_HOME || join(homedir(), ".dsh");
	return resolve(String(home));
}

/** 列出 profile 目录（含 cordis.patch.yml 的）。 */
export function listProfiles(dshHome) {
	const root = join(dshHome, "profiles");
	if (!existsSync(root)) return [];
	return readdirSync(root, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.filter((name) => existsSync(join(root, name, "cordis.patch.yml")))
		.sort();
}

/**
 * 定位 profile：显式 --profile，否则 desktop，再否则第一个有 cordis.patch.yml 的 profile。
 * @returns {{ name: string, dir: string, cordis: string, home: string }}
 */
export function resolveProfile(options = {}) {
	const home = resolveDshHome(options.dshHome);
	if (!existsSync(home)) {
		throw new Error(`找不到 DSH home：${home}\n请先启动一次 DSH，或用 --dsh-home 指定。`);
	}
	const root = join(home, "profiles");
	const all = existsSync(root) ? readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
	let name = options.profile;
	if (!name) name = all.includes("desktop") ? "desktop" : listProfiles(home)[0];
	if (!name) {
		throw new Error(`在 ${root} 下没找到 profile（需要 cordis.patch.yml）。请先启动一次 DSH。`);
	}
	const dir = join(root, name);
	const cordis = join(dir, "cordis.patch.yml");
	if (!existsSync(cordis)) {
		throw new Error(`profile "${name}" 缺少 ${cordis}。可用 --profile 指定其他 profile。`);
	}
	return { name, dir, cordis, home };
}

/** 插件安装目录。 */
export function pluginDirFor(profile) {
	return join(profile.dir, "plugins", "dsh-boot-rhine");
}

/** 判断路径是否存在且是目录。 */
export function isDirectory(path) {
	try {
		return statSync(path).isDirectory();
	} catch {
		return false;
	}
}

/** 把 Windows 反斜杠统一成正斜杠，便于写进 file:// URL。 */
export function toPosixPath(path) {
	return path.replaceAll("\\", "/");
}
