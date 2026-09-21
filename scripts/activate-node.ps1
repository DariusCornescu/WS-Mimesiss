# Dot-source this file to enable Node.js in the current PowerShell session.
param([string]$NodeBin = $env:NODE_BIN)

if (-not $NodeBin) {
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $node) {
        throw 'Node.js was not found. Install it or pass -NodeBin with the directory containing node.exe.'
    }
    Write-Host "Node.js is available for this terminal: $(& $node.Source --version)"
    return
}

$nodeExecutable = Join-Path $NodeBin 'node.exe'
if (-not (Test-Path -LiteralPath $nodeExecutable)) {
    throw "Node.js was not found at $nodeExecutable"
}
if (($env:Path -split ';') -notcontains $NodeBin) {
    $env:Path = "$NodeBin;$env:Path"
}
Write-Host "Node.js enabled for this terminal: $(& $nodeExecutable --version)"
