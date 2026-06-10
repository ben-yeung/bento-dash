# Mirrors docs/superpowers (plans + specs) into a gitignored read-only dashboard at the
# main checkout root (_plans-overview/), so plans authored in ANY branch/worktree are
# visible at a glance from the main checkout's file explorer.
#
# The mirror is one-directional and additive: docs/superpowers -> _plans-overview only.
# It never writes back, so it can never corrupt real plans. docs/superpowers itself is
# untouched — normal tracked git, branches and merges as usual.
#
# Wired to two events in .claude/settings.json:
#   PostToolUse (Write|Edit)  -> single-file mode: mirror the file just written (live).
#   Stop / SubagentStop       -> resync mode: reconcile completions done via `mv`.
#
# Override the dashboard folder name by setting $env:PLANS_OVERVIEW_DIR.
$ErrorActionPreference = 'SilentlyContinue'

$overviewName = if ($env:PLANS_OVERVIEW_DIR) { $env:PLANS_OVERVIEW_DIR } else { '_plans-overview' }

# --- locate the main checkout root (parent of the shared .git common dir) ---
$common = git rev-parse --path-format=absolute --git-common-dir 2>$null
if (-not $common) { exit 0 }
$mainRoot = Split-Path -Parent $common
if (-not (Test-Path $mainRoot)) { exit 0 }
$overview = Join-Path $mainRoot $overviewName

function Mirror-One([string]$srcAbs, [string]$rel) {
    # $rel is the path under docs/superpowers, using forward slashes.
    $dest = Join-Path $overview ($rel -replace '/', '\')
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    if (Test-Path -LiteralPath $srcAbs) { Copy-Item -LiteralPath $srcAbs -Destination $dest -Force }
    # If this is a completed plan, drop the stale pending copy from the dashboard.
    $cm = [regex]::Match($rel, '^plans/completed/(.+)$')
    if ($cm.Success) {
        $stale = Join-Path $overview ('plans\' + ($cm.Groups[1].Value -replace '/', '\'))
        if (Test-Path -LiteralPath $stale) { Remove-Item -LiteralPath $stale -Force }
    }
}

# --- read the hook payload from stdin ---
$raw = [Console]::In.ReadToEnd()
$fp = $null
if ($raw) {
    try { $fp = ($raw | ConvertFrom-Json).tool_input.file_path } catch { }
}

if ($fp) {
    # ---- single-file mode (PostToolUse Write|Edit) ----
    $norm = ($fp -replace '\\', '/')
    $m = [regex]::Match($norm, 'docs/superpowers/(.+)$')
    if (-not $m.Success) { exit 0 }   # not a superpowers file; ignore
    Mirror-One $fp $m.Groups[1].Value
    exit 0
}

# ---- resync mode (Stop / SubagentStop) ----
# Mirror the current worktree's whole docs/superpowers tree (additive: other branches'
# entries already in the dashboard are preserved).
$here = git rev-parse --show-toplevel 2>$null
if (-not $here) { exit 0 }
$sp = Join-Path $here 'docs\superpowers'
if (-not (Test-Path $sp)) { exit 0 }
$spFull = (Resolve-Path $sp).Path
Get-ChildItem -LiteralPath $spFull -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($spFull.Length).TrimStart('\', '/') -replace '\\', '/'
    Mirror-One $_.FullName $rel
}
exit 0
