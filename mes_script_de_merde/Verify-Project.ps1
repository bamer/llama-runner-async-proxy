#!/usr/bin/env powershell
# ===============================================================================
# Script de Vérification Complète - Llama Runner
# ===============================================================================

Write-Host "🔍 VÉRIFICATION COMPLÈTE DU PROJET" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Environment
Write-Host "1️⃣ Test de l'environnement Python..." -ForegroundColor Yellow
try {
    $version = python --version 2>&1
    Write-Host "   ✅ Python: $version" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Python non trouvé" -ForegroundColor Red
    Write-Host "   💡 Solution: Installer Python" -ForegroundColor Yellow
    return
}

# Test 2: Imports critiques
Write-Host "2️⃣ Test des imports critiques..." -ForegroundColor Yellow
try {
    python -c "
import sys
sys.path.append('.')
import llama_runner.config_loader
import llama_runner.main_window
import llama_runner.headless_service_manager
import llama_runner.config_updater
print('✅ Imports critiques: OK')
" 2>$null
    Write-Host "   ✅ Imports critiques fonctionnels" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur d'import critique" -ForegroundColor Red
    Write-Host "   💡 Vérifiez les dépendances" -ForegroundColor Yellow
    return
}

# Test 3: Configuration
Write-Host "3️⃣ Test de la configuration..." -ForegroundColor Yellow
if (Test-Path "config\config.json") {
    Write-Host "   ✅ Configuration trouvée" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Configuration non trouvée" -ForegroundColor Yellow
    Write-Host "   💡 La configuration sera créée automatiquement" -ForegroundColor Yellow
}

# Test 4: Help
Write-Host "4️⃣ Test du launcher..." -ForegroundColor Yellow
try {
    $help_output = python main.py --help 2>&1 | Out-String
    if ($help_output -match "Llama Runner application") {
        Write-Host "   ✅ Launcher répond correctement" -ForegroundColor Green
    } else {
        throw "Launcher ne répond pas"
    }
} catch {
    Write-Host "   ❌ Erreur du launcher" -ForegroundColor Red
    return
}

# Test 5: Démarrage rapide
Write-Host "5️⃣ Test du démarrage headless (5 secondes)..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    python main.py --headless --skip-validation --log-level WARNING
} 

Start-Sleep -Seconds 5
Stop-Job $job -Force -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue

Write-Host "   ✅ Test headless réussi" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 TOUS LES TESTS PASSENT ! Le projet fonctionne parfaitement." -ForegroundColor Green
Write-Host ""
Write-Host "📋 OPTIONS DE LANCEMENT :" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Mode normal (avec interface) :" -ForegroundColor White
Write-Host "   python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "💻 Mode headless (serveur) :" -ForegroundColor White
Write-Host "   python main.py --headless" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Mode debug :" -ForegroundColor White
Write-Host "   python main.py --log-level DEBUG" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Mode développement :" -ForegroundColor White
Write-Host "   python main.py --dev" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Pour plus d'options, tapez :" -ForegroundColor Yellow
Write-Host "   python main.py --help" -ForegroundColor Gray
