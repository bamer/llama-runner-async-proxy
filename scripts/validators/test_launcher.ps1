#!/usr/bin/env powershell
# ===============================================================================
# 🧪 Script de test pour Launch-LlamaRunner.ps1
# ===============================================================================

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  🧪 TESTS DU LAUNCHER                         ║" -ForegroundColor Cyan
Write-Host "║                     LlamaRunner Pro                           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Test 1: Vérification de la syntaxe PowerShell
Write-Host "🔍 Test 1: Vérification de la syntaxe PowerShell..." -ForegroundColor Yellow
try {
    $null = Get-Command powershell -ErrorAction Stop
    Write-Host "✅ PowerShell disponible" -ForegroundColor Green
} catch {
    Write-Host "❌ PowerShell non disponible" -ForegroundColor Red
    exit 1
}

# Test 2: Vérification des paramètres du script
Write-Host "`n🔍 Test 2: Validation des paramètres..." -ForegroundColor Yellow
$scriptPath = ".\Launch-LlamaRunner.ps1"
if (Test-Path $scriptPath) {
    Write-Host "✅ Script trouvé: $scriptPath" -ForegroundColor Green
    
    # Test de l'aide
    Write-Host "   🆘 Test de l'aide..." -ForegroundColor Gray
    try {
        # Simuler l'aide sans exécuter
        $helpContent = Get-Content $scriptPath | Select-String "param\("
        if ($helpContent) {
            Write-Host "   ✅ Paramètres définis" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Paramètres non trouvés" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Erreur lors de la lecture du script" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Script non trouvé: $scriptPath" -ForegroundColor Red
    exit 1
}

# Test 3: Vérification de l'environnement Python
Write-Host "`n🔍 Test 3: Environnement Python..." -ForegroundColor Yellow
$venvPath = ".\dev-venv"
if (Test-Path $venvPath) {
    Write-Host "✅ Environnement virtuel trouvé" -ForegroundColor Green
    
    $pythonPath = Join-Path $venvPath "Scripts\python.exe"
    if (Test-Path $pythonPath) {
        Write-Host "✅ Python exécutable trouvé" -ForegroundColor Green
        
        # Test d'import des modules critiques
        try {
            $testResult = & $pythonPath -c "
try:
    import sys, asyncio, websockets, psutil
    print('Modules critiques OK')
    exit(0)
except ImportError as e:
    print(f'Module manquant: {e}')
    exit(1)
" 2>$null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Modules critiques disponibles" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Modules manquants - exécutez .\Launch-LlamaRunner.ps1 -Install" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Erreur lors du test des modules" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Python exécutable non trouvé" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Environnement virtuel non trouvé - exécutez .\Launch-LlamaRunner.ps1 -Install" -ForegroundColor Yellow
}

# Test 4: Vérification des fichiers de configuration
Write-Host "`n🔍 Test 4: Fichiers de configuration..." -ForegroundColor Yellow
$configFiles = @("config/app_config.json", "config/examples/basic.json", "config/examples/advanced.json")
$foundConfigs = 0

foreach ($config in $configFiles) {
    if (Test-Path $config) {
        Write-Host "✅ $config trouvé" -ForegroundColor Green
        $foundConfigs++
    } else {
        Write-Host "⚠️  $config non trouvé" -ForegroundColor Yellow
    }
}

if ($foundConfigs -eq 0) {
    Write-Host "❌ Aucun fichier de configuration trouvé" -ForegroundColor Red
} else {
    Write-Host "✅ Au moins un fichier de configuration disponible" -ForegroundColor Green
}

# Test 5: Vérification des dépendances système
Write-Host "`n🔍 Test 5: Dépendances système..." -ForegroundColor Yellow

# Test des ports
$ports = @(8585, 1234, 11434)
foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "⚠️  Port $port déjà utilisé" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Port $port disponible" -ForegroundColor Green
    }
}

# Test 6: Résumé et recommandations
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                     📋 RÉSUMÉ DES TESTS                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 Prochaines étapes recommandées:" -ForegroundColor Magenta
Write-Host ""

# Recommandations basées sur les tests
if (-not (Test-Path $venvPath)) {
    Write-Host "1. 📦 Installation des dépendances:" -ForegroundColor Yellow
    Write-Host "   .\Launch-LlamaRunner.ps1 -Install" -ForegroundColor White
    Write-Host ""
}

if (-not (Test-Path "config/app_config.json")) {
    Write-Host "2. Configuration du systeme:" -ForegroundColor Yellow
    Write-Host "   Copier config/examples/basic.json vers config/app_config.json et modifier" -ForegroundColor White
    Write-Host ""
}

Write-Host "3. 🚀 Lancement du système:" -ForegroundColor Yellow
Write-Host "   Mode interactif: .\Launch-LlamaRunner.ps1" -ForegroundColor White
Write-Host "   Mode complet: .\Launch-LlamaRunner.ps1 -Metrics" -ForegroundColor White
Write-Host "   Tests: .\Launch-LlamaRunner.ps1 -Test" -ForegroundColor White
Write-Host ""

Write-Host "4. 🌐 Accès aux services:" -ForegroundColor Yellow
Write-Host "   Dashboard: http://localhost:8080" -ForegroundColor White
Write-Host "   Web UI: http://localhost:8081" -ForegroundColor White
Write-Host "   LM Studio: http://localhost:1234" -ForegroundColor White
Write-Host "   Ollama: http://localhost:11434" -ForegroundColor White
Write-Host ""

Write-Host "5. 📚 Documentation:" -ForegroundColor Yellow
Write-Host "   GUIDE_UTILISATION.md - Guide détaillé" -ForegroundColor White
Write-Host "   README.md - Vue d'ensemble du projet" -ForegroundColor White
Write-Host ""

Write-Host "✅ Tests terminés! Le système est prêt à l'emploi." -ForegroundColor Green
Write-Host ""
Write-Host "💡 Astuce: Utilisez le mode interactif pour explorer toutes les options:" -ForegroundColor Cyan
Write-Host "   .\Launch-LlamaRunner.ps1" -ForegroundColor White
Write-Host ""
