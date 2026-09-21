# Dot-source this file to enable Node.js in the current PowerShell session.
$projectNodeBin = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
if (-not (Test-Path -LiteralPath (Join-Path $projectNodeBin 'node.exe'))) {
    throw 'The bundled Node.js runtime was not found. Install Node.js or update this script with its location.'
}
if (($env:Path -split ';') -notcontains $projectNodeBin) {
    $env:Path = "$projectNodeBin;$env:Path"
}
Write-Host "Node.js enabled for this terminal: $(node --version)"
