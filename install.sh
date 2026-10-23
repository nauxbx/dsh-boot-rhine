#!/usr/bin/env sh
# dsh-boot-rhine 安装器（macOS / Linux / Git Bash）
# 用法：
#   ./install.sh
#   ./install.sh --wallpaper ~/Pictures/bg.jpg
#   ./install.sh --gradient --dry-run
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
script="$root/scripts/install.mjs"

if command -v node >/dev/null 2>&1; then
	exec node "$script" "$@"
fi

# DSH 自带的 Node 运行时
for candidate in "$HOME"/.dsh/dsh-runtimes/*/dependencies/node/bin/node; do
	if [ -x "$candidate" ]; then
		exec "$candidate" "$script" "$@"
	fi
done

echo "找不到 Node.js。请安装 Node 20+，或先启动一次 DSH 以生成内置运行时。" >&2
exit 1
