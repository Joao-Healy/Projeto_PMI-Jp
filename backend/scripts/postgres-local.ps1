param(
  [ValidateSet('setup','start','stop','status')][string]$Action = 'status',
  [string]$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin'
)
$ErrorActionPreference = 'Stop'
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$local = Join-Path $project '.postgres'
$data = Join-Path $local 'data'
$envFile = Join-Path $project '.env'
$pgctl = Join-Path $PostgresBin 'pg_ctl.exe'
if (!(Test-Path -LiteralPath $pgctl)) { throw 'PostgreSQL não encontrado; informe -PostgresBin.' }
if ($Action -eq 'status') { & $pgctl -D $data status; exit $LASTEXITCODE }
if ($Action -eq 'stop') { & $pgctl -D $data -m fast stop; exit $LASTEXITCODE }
if ($Action -eq 'start') { & $pgctl -D $data -l (Join-Path $local 'server.log') -w start; exit $LASTEXITCODE }
if ((Test-Path -LiteralPath $data) -or (Test-Path -LiteralPath $envFile)) {
  throw 'Setup recusado: .env ou dados já existem. Use start; não sobrescrevemos configurações.'
}
New-Item -ItemType Directory -Path $local -Force | Out-Null
function New-Secret { return [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant() }
$adminPassword = New-Secret
$appPassword = New-Secret
$pwFile = Join-Path $local 'init-password.tmp'
try {
  [IO.File]::WriteAllText($pwFile, $adminPassword)
  & (Join-Path $PostgresBin 'initdb.exe') -D $data -U zenith_admin --pwfile=$pwFile --auth=scram-sha-256 --encoding=UTF8 --locale=C
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao inicializar cluster Zenith.' }
} finally { Remove-Item -LiteralPath $pwFile -Force -ErrorAction SilentlyContinue }
@"
listen_addresses = '127.0.0.1'
port = 55433
timezone = 'America/Sao_Paulo'
password_encryption = 'scram-sha-256'
"@ | Add-Content -LiteralPath (Join-Path $data 'postgresql.conf')
& $pgctl -D $data -l (Join-Path $local 'server.log') -w start
if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar cluster Zenith na porta 55433.' }
$previousPgPassword = $env:PGPASSWORD
try {
  $env:PGPASSWORD = $adminPassword
  # Senha aleatória hexadecimal: não contém caracteres de sintaxe SQL.
  "CREATE ROLE zenith_app LOGIN PASSWORD '$appPassword';" | & (Join-Path $PostgresBin 'psql.exe') -X -h 127.0.0.1 -p 55433 -U zenith_admin -d postgres -v ON_ERROR_STOP=1 -q
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar usuário Zenith.' }
  foreach ($database in @('zenith_db','zenith_test')) {
    & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p 55433 -U zenith_admin -O zenith_app -T template0 $database
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar banco Zenith.' }
  }
} finally { $env:PGPASSWORD = $previousPgPassword }
@"
HOST=127.0.0.1
PORT=3002
NODE_ENV=development
FRONTEND_ORIGINS=http://127.0.0.1:3002,http://localhost:3002
DATABASE_URL=postgresql://zenith_app:${appPassword}@127.0.0.1:55433/zenith_db
TEST_DATABASE_URL=postgresql://zenith_app:${appPassword}@127.0.0.1:55433/zenith_test
"@ | Set-Content -LiteralPath $envFile -Encoding utf8
# Mantida somente no diretório local ignorado para administração por pgAdmin.
[IO.File]::WriteAllText((Join-Path $local 'admin-password.txt'), $adminPassword)
Write-Output 'PostgreSQL Zenith pronto na porta 55433. Conexões em .env; senha administrativa em .postgres/admin-password.txt. Não versione esses arquivos.'
