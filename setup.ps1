param(
  [switch]$SkipInstall,
  [switch]$RunChecks,
  [switch]$StartDev
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Require-Command {
  param([string]$CommandName)
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Required command '$CommandName' was not found in PATH."
  }
}

function Ensure-EnvFile {
  param(
    [string]$ExamplePath,
    [string]$EnvPath
  )

  if (Test-Path $EnvPath) {
    Write-Host "Using existing $EnvPath"
    return
  }

  if (Test-Path $ExamplePath) {
    Copy-Item $ExamplePath $EnvPath
    Write-Host "Created $EnvPath from example"
    return
  }

  New-Item -ItemType File -Path $EnvPath | Out-Null
  Write-Host "Created empty $EnvPath"
}

function Set-Or-AppendEnvValue {
  param(
    [string]$EnvPath,
    [string]$Key,
    [string]$Value
  )

  $lines = @()
  if (Test-Path $EnvPath) {
    $lines = Get-Content $EnvPath
  }

  $pattern = "^\s*$([Regex]::Escape($Key))\s*="
  $found = $false

  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) {
      $lines[$i] = "$Key=$Value"
      $found = $true
      break
    }
  }

  if (-not $found) {
    $lines += "$Key=$Value"
  }

  Set-Content -Path $EnvPath -Value $lines
}

function Get-EnvValue {
  param(
    [string]$EnvPath,
    [string]$Key
  )

  if (-not (Test-Path $EnvPath)) {
    return $null
  }

  $pattern = "^\s*$([Regex]::Escape($Key))\s*=\s*(.*)\s*$"
  foreach ($line in Get-Content $EnvPath) {
    if ($line -match $pattern) {
      return $matches[1].Trim()
    }
  }

  return $null
}

function New-SecureSecret {
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }

  return [Convert]::ToBase64String($bytes).Replace("+", "-").Replace("/", "_").TrimEnd("=")
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Step "Checking prerequisites"
Require-Command "node"
Require-Command "npm.cmd"

$nodeVersion = (& node -v).Trim()
if ($nodeVersion -notmatch "^v(\d+)\.(\d+)\.(\d+)$") {
  throw "Unable to parse Node.js version: $nodeVersion"
}

$nodeMajor = [int]$matches[1]
if ($nodeMajor -lt 20) {
  throw "Node.js v20+ is required. Current version: $nodeVersion"
}

Write-Host "Node.js: $nodeVersion"
Write-Host "npm:      $((& npm.cmd -v).Trim())"

if (-not $SkipInstall) {
  Write-Step "Installing dependencies"
  & npm.cmd install --no-fund --no-audit
  & npm.cmd install --prefix server --no-fund --no-audit
  & npm.cmd install --prefix client --no-fund --no-audit
} else {
  Write-Step "Skipping dependency install (SkipInstall provided)"
}

Write-Step "Preparing environment files"
Ensure-EnvFile -ExamplePath "server/.env.example" -EnvPath "server/.env"
Ensure-EnvFile -ExamplePath "client/.env.example" -EnvPath "client/.env"

$currentJwtSecret = Get-EnvValue -EnvPath "server/.env" -Key "JWT_SECRET"
$needsSecret = $false

if ([string]::IsNullOrWhiteSpace($currentJwtSecret)) {
  $needsSecret = $true
} elseif ($currentJwtSecret.Length -lt 24) {
  $needsSecret = $true
} elseif ($currentJwtSecret -match "change_this_to_a_long_secure_secret|your_long_random_secret|changeme|example") {
  $needsSecret = $true
}

if ($needsSecret) {
  $newSecret = New-SecureSecret
  Set-Or-AppendEnvValue -EnvPath "server/.env" -Key "JWT_SECRET" -Value $newSecret
  Write-Host "Generated secure JWT_SECRET in server/.env"
} else {
  Write-Host "JWT_SECRET already configured"
}

if ([string]::IsNullOrWhiteSpace((Get-EnvValue -EnvPath "server/.env" -Key "MONGO_URI"))) {
  Set-Or-AppendEnvValue -EnvPath "server/.env" -Key "MONGO_URI" -Value "mongodb://127.0.0.1:27017"
}

if ([string]::IsNullOrWhiteSpace((Get-EnvValue -EnvPath "server/.env" -Key "MONGO_DB_NAME"))) {
  Set-Or-AppendEnvValue -EnvPath "server/.env" -Key "MONGO_DB_NAME" -Value "campusfixlite"
}

if ([string]::IsNullOrWhiteSpace((Get-EnvValue -EnvPath "server/.env" -Key "CLIENT_URLS"))) {
  Set-Or-AppendEnvValue -EnvPath "server/.env" -Key "CLIENT_URLS" -Value "http://localhost:5173"
}

if ([string]::IsNullOrWhiteSpace((Get-EnvValue -EnvPath "client/.env" -Key "VITE_API_URL"))) {
  Set-Or-AppendEnvValue -EnvPath "client/.env" -Key "VITE_API_URL" -Value "http://localhost:5000/api/v1"
}

$mongoUri = Get-EnvValue -EnvPath "server/.env" -Key "MONGO_URI"
if ($mongoUri -match "^mongodb://(127\.0\.0\.1|localhost):") {
  Write-Step "Checking local MongoDB service"
  $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
  if ($null -eq $mongoService) {
    Write-Host "MongoDB Windows service not found. Install MongoDB or set Atlas MONGO_URI in server/.env" -ForegroundColor Yellow
  } elseif ($mongoService.Status -ne "Running") {
    Write-Host "MongoDB service is '$($mongoService.Status)'. Trying to start..."
    try {
      Start-Service -Name "MongoDB"
      Write-Host "MongoDB service started."
    } catch {
      Write-Host "Could not start MongoDB automatically. Start it manually." -ForegroundColor Yellow
    }
  } else {
    Write-Host "MongoDB service is running."
  }
}

if ($RunChecks) {
  Write-Step "Running project checks"
  & npm.cmd run test
}

Write-Step "Setup complete"
Write-Host "Run dev server with: npm run dev" -ForegroundColor Green

if ($StartDev) {
  Write-Step "Starting dev server"
  & npm.cmd run dev
}
