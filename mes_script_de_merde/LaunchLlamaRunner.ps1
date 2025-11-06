#!/usr/bin/env powershell
# ===============================================================================
# Launcher Simple et Propre - Llama Runner
# ===============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🦙 LLAMA RUNNER - LAUNCHER SIMPLE" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test de l'environnement
Write-Host "Test de l'environnement..." -ForegroundColor Yellow
try {
    $version = python --version 2>&1
    Write-Host "✅ Python: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Python non trouvé" -ForegroundColor Red
    exit 1
}

# Test des imports
Write-Host "Test des imports..." -ForegroundColor Yellow
try {
    python -c "
import sys
sys.path.append('.')
import llama_runner.config_loader
import llama_runner.main_window
print('✅ Imports OK')
" 2>$null
    Write-Host "✅ Imports fonctionnels" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur d'import" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Lancement du launcher..." -ForegroundColor Green
Write-Host ""

# Lancement
python main.py $args
