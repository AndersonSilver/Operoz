# Operoz - setup local no Windows (PowerShell)
# Same idea as setup.sh: copy .env files, Django SECRET_KEY, pnpm install.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

function Copy-EnvIfExample {
    param([string]$RelativePath)
    $src = Join-Path $root $RelativePath
    $dst = Join-Path $root ($RelativePath -replace '\.env\.example$', '.env')
    if (-not (Test-Path $src)) {
        Write-Host "Erro: nao existe $RelativePath" -ForegroundColor Red
        return $false
    }
    Copy-Item -LiteralPath $src -Destination $dst -Force
    $relDst = "." + $dst.Substring($root.Length)
    Write-Host "OK  copiado -> $relDst" -ForegroundColor Green
    return $true
}

function New-PlaneSecretKey {
    $chars = [char[]](([int[]](97..122)) + ([int[]](48..57)))
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] 50
    $rng.GetBytes($buf)
    $secret = -join ($buf | ForEach-Object { $chars[$_ % $chars.Length] })
    return $secret
}

Write-Host ""
Write-Host "Operoz - preparando ambiente de desenvolvimento..." -ForegroundColor Cyan
Write-Host ""

$pairs = @(
    ".env.example",
    "apps\web\.env.example",
    "apps\api\.env.example",
    "apps\space\.env.example",
    "apps\admin\.env.example",
    "apps\live\.env.example"
)

$ok = $true
foreach ($p in $pairs) {
    if (-not (Copy-EnvIfExample $p)) { $ok = $false }
}

$apiEnv = Join-Path $root "apps\api\.env"
$liveEnv = Join-Path $root "apps\live\.env"
if ($ok -and (Test-Path $apiEnv)) {
    (Get-Content -LiteralPath $apiEnv) `
        -replace '^USE_MINIO=0$', 'USE_MINIO=1' `
        -replace '^MINIO_PUBLIC_ENDPOINT_URL=.*$', 'MINIO_PUBLIC_ENDPOINT_URL="http://localhost:9000"' |
        Set-Content -LiteralPath $apiEnv
}
if ($ok -and (Test-Path $liveEnv)) {
    (Get-Content -LiteralPath $liveEnv) `
        -replace '^REDIS_PORT=6379$', 'REDIS_PORT=16379' `
        -replace 'redis://localhost:6379/', 'redis://localhost:16379/' |
        Set-Content -LiteralPath $liveEnv
}

if ($ok -and (Test-Path $apiEnv)) {
    $content = Get-Content -LiteralPath $apiEnv -Raw
    if ($null -eq $content) { $content = "" }
    if ($content -match '(?m)^SECRET_KEY=') {
        Write-Host "SECRET_KEY ja existe em apps\api\.env - nao alterado." -ForegroundColor Yellow
    } else {
        $sk = New-PlaneSecretKey
        $line = 'SECRET_KEY="' + $sk + '"'
        Add-Content -LiteralPath $apiEnv -Value $line
        Write-Host "OK  SECRET_KEY adicionado em apps\api\.env" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Instalando dependencias com pnpm..." -ForegroundColor Yellow
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "pnpm nao esta no PATH. Opcoes:" -ForegroundColor Red
    Write-Host "  1) npm install -g pnpm@10.32.1" -ForegroundColor Gray
    Write-Host "  2) Ou PowerShell como Administrador: corepack enable pnpm" -ForegroundColor Gray
    exit 1
}
pnpm install

if (-not $ok) {
    Write-Host ""
    Write-Host "Alguns passos falharam; revise as mensagens acima." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  docker compose -f docker-compose-local.yml up -d"
Write-Host "  pnpm dev"
Write-Host "  Abra http://localhost:3001/god-mode/ e depois http://localhost:3000"
Write-Host ""
