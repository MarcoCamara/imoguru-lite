# Script PowerShell para criar o arquivo ZIP de deploy no Windows
# Exclui node_modules, dist, arquivos .env e outros arquivos desnecessários

Write-Host "=======================================================================" -ForegroundColor Blue
Write-Host " Criando arquivo ZIP para deploy no EasyPanel" -ForegroundColor Blue
Write-Host "=======================================================================" -ForegroundColor Blue
Write-Host ""

$zipName = "imoguru-deploy.zip"
$projectPath = Get-Location

# Remove ZIP anterior se existir
if (Test-Path $zipName) {
    Write-Host "Removendo ZIP anterior..." -ForegroundColor Yellow
    Remove-Item $zipName -Force
}

Write-Host "Criando ZIP excluindo arquivos desnecessários..." -ForegroundColor Green
Write-Host ""

# Pastas e arquivos para excluir
$excludePatterns = @(
    "node_modules",
    "dist",
    ".env",
    ".env.local",
    ".vscode",
    ".idea",
    ".git",
    "*.log",
    ".DS_Store",
    "*.swp",
    "*.swo",
    "*.zip"
)

# Coletar todos os arquivos excluindo os padrões
$filesToZip = Get-ChildItem -Path . -Recurse -File | Where-Object {
    $excluded = $false
    foreach ($pattern in $excludePatterns) {
        if ($_.FullName -like "*\$pattern\*" -or $_.Name -like $pattern) {
            $excluded = $true
            break
        }
    }
    # Excluir também backend/.env
    if ($_.FullName -like "*\backend\.env*") {
        $excluded = $true
    }
    return -not $excluded
}

try {
    # Criar o ZIP
    Compress-Archive -Path $filesToZip.FullName -DestinationPath $zipName -Force
    
    $zipSize = (Get-Item $zipName).Length / 1MB
    Write-Host ""
    Write-Host "✅ ZIP criado com sucesso: $zipName" -ForegroundColor Green
    Write-Host "Tamanho do arquivo: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Próximo passo: Faça upload deste arquivo no EasyPanel" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "Erro ao criar ZIP: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Método alternativo (manual):" -ForegroundColor Yellow
    Write-Host "1. No Windows Explorer, selecione todos os arquivos EXCETO:"
    Write-Host "   - node_modules/"
    Write-Host "   - dist/"
    Write-Host "   - .env e .env.local"
    Write-Host "   - .vscode/ e .idea/"
    Write-Host "2. Clique com botão direito > Enviar para > Pasta compactada (ZIP)"
    Write-Host "3. Nomeie como: imoguru-deploy.zip"
}

