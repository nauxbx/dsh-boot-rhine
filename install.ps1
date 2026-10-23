# dsh-boot-rhine installer (Windows)
# Usage:
#   .\install.ps1
#   .\install.ps1 -Wallpaper "D:\pics\bg.jpg"
#   .\install.ps1 -DryRun
#   .\install.ps1 -DshHome "D:\test-home" -Profile desktop
param(
	[string]$Wallpaper,
	[switch]$Gradient,
	[switch]$DryRun,
	[string]$DshHome,
	[string]$Profile
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $root "scripts\install.mjs"

$node = $null
$command = Get-Command node -ErrorAction SilentlyContinue
if ($command) {
	$node = $command.Source
}

if (-not $node) {
	$runtimes = Join-Path $HOME ".dsh\dsh-runtimes"
	if (Test-Path $runtimes) {
		$found = Get-ChildItem -Path $runtimes -Filter node.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
		if ($found) { $node = $found.FullName }
	}
}

if (-not $node) {
	throw "Node.js not found. Install Node 20+, or start DSH once to create its bundled runtime."
}

$extra = @()
if ($Wallpaper) { $extra += @("--wallpaper", $Wallpaper) }
if ($Gradient) { $extra += "--gradient" }
if ($DryRun) { $extra += "--dry-run" }
if ($DshHome) { $extra += @("--dsh-home", $DshHome) }
if ($Profile) { $extra += @("--profile", $Profile) }

& $node $script @extra
exit $LASTEXITCODE
