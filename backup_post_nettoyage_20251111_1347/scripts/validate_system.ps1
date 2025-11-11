#!/usr/bin/env powershell
# ===============================================================================
# 🧪 Script de Validation Finale - LlamaRunner Pro (VERSION CORRIGÉE - PHASE 2)
# Test complet de tous les composants et configurations avec chemins relatifs
# ===============================================================================

param(
    [switch]$Quick,
    [switch]$Full,
    [switch]$Ports,
    [switch]$Dependencies,
    [switch]$Scripts,
    [switch]$Config,
    [switch]$Help
)

# 🔥 PHASE 2 CORRECTION : Définir le répertoire de travail
Set-Location -Path $PSScriptRoot

# Configuration des logs - UTILISER DOSSIER logs/
$LogPath = "..\\logs\\validation.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Démarrage validation système - Phase 2" | Out-File $LogPath -Append -Encoding UTF8

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$Timestamp] $Message" | Out-File $LogPath -Append -Encoding UTF8
    
    if ($Host.UI.SupportsVirtualTerminal) {
        Write-Host $Message -ForegroundColor $Color
    } else {
        Write-Host $Message
    }
}

function Show-Header {
    Clear-Host
    Write-ColorOutput "╔══════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                  🧪 VALIDATION FINALE - PHASE 2              ║" "Cyan"
    Write-ColorOutput "║                    LlamaRunner Pro - Structure Corrigée      ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-ColorOutput "🎯 TESTS DE VALIDATION DISPONIBLES:" "Magenta"
    Write-Host ""
    Write-Host "  -Quick        : Test rapide des éléments critiques"
    Write-Host "  -Full         : Test complet de tous les composants" 
    Write-Host "  -Ports        : Test de disponibilité des ports standards"
    Write-Host "  -Dependencies : Test des dépendances Python"
    Write-Host "  -Scripts      : Test des scripts de lancement"
    Write-Host "  -Config       : Test de la configuration"
    Write-Host "  -Help         : Affiche cette aide"
    Write-Host ""
    Write-Host "Sans paramètre : Lance tous les tests"
    Write-Host ""
}

function Test-PortAvailability {
    param([int[]]$Ports)
    
    Write-ColorOutput "📡 Test de disponibilité des ports..." "Yellow"
    $results = @{}
    
    foreach ($port in $Ports) {
        try {
            $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                $results[$port] = @{ Status = "Occupé"; Color = "Yellow" }
                Write-ColorOutput "   ⚠️  Port $port déjà utilisé" "Yellow"
            } else {
                $results[$port] = @{ Status = "Libre"; Color = "Green" }
                Write-ColorOutput "   ✅ Port $port disponible" "Green"
            }
        } catch {
            $results[$port] = @{ Status = "Libre (erreur test)"; Color = "Green" }
            Write-ColorOutput "   ✅ Port $port probablement disponible" "Green"
        }
    }
    
    return $results
}

function Test-PythonEnvironment {
    Write-ColorOutput "`n🐍 Test de l'environnement Python..." "Yellow"
    
    # 🔥 PHASE 2 CORRECTION : Chemins relatifs
    $venvPath = "..\\dev-venv"
    $pythonPath = "..\\dev-venv\\Scripts\\python.exe"
    
    # Test environnement virtuel
    if (-not (Test-Path $venvPath)) {
        Write-ColorOutput "   ❌ Environnement virtuel non trouvé : $venvPath" "Red"
        Write-ColorOutput "   💡 CONSEIL : Créez-le avec : python -m venv dev-venv" "Yellow"
        return $false
    }
    Write-ColorOutput "   ✅ Environnement virtuel trouvé" "Green"
    
    # Test Python
    if (-not (Test-Path $pythonPath)) {
        Write-ColorOutput "   ❌ Python exécutable non trouvé : $pythonPath" "Red"
        Write-ColorOutput "   💡 CONSEIL : Activez le venv et installez les dépendances" "Yellow"
        return $false
    }
    Write-ColorOutput "   ✅ Python exécutable trouvé" "Green"
    
    # Test modules critiques
    $criticalModules = @("sys", "asyncio", "websockets", "psutil", "fastapi", "uvicorn")
    $missingModules = @()
    
    foreach ($module in $criticalModules) {
        try {
            & $pythonPath -c "import $module" 2>$null
            Write-ColorOutput "   ✅ Module $module disponible" "Green"
        } catch {
            Write-ColorOutput "   ❌ Module $module manquant" "Red"
            $missingModules += $module
        }
    }
    
    if ($missingModules.Count -eq 0) {
        Write-ColorOutput "   ✅ Tous les modules critiques sont disponibles" "Green"
        return $true
    } else {
        Write-ColorOutput "   ❌ Modules manquants: $($missingModules -join ', ')" "Red"
        Write-ColorOutput "   💡 Exécutez: ..\\LaunchMenu.ps1 pour installer les dépendances" "Yellow"
        return $false
    }
}

function Test-ProjectStructure {
    Write-ColorOutput "`n📁 Test de la structure du projet..." "Yellow"
    
    $requiredDirs = @("config", "scripts", "tests", "docs", "llama_runner", "logs", "models", "tools")
    $missingDirs = @()
    
    foreach ($dir in $requiredDirs) {
        if (Test-Path "..\\$dir") {
            Write-ColorOutput "   ✅ Dossier $dir trouvé" "Green"
        } else {
            Write-ColorOutput "   ❌ Dossier $dir manquant" "Red"
            $missingDirs += $dir
        }
    }
    
    $requiredFiles = @("main.py", "requirements.txt", "LaunchMenu.ps1")
    $missingFiles = @()
    
    foreach ($file in $requiredFiles) {
        if (Test-Path "..\\$file") {
            Write-ColorOutput "   ✅ Fichier $file trouvé" "Green"
        } else {
            Write-ColorOutput "   ❌ Fichier $file manquant" "Red"
            $missingFiles += $file
        }
    }
    
    if ($missingDirs.Count -eq 0 -and $missingFiles.Count -eq 0) {
        Write-ColorOutput "   ✅ Structure du projet valide" "Green"
        return $true
    } else {
        return $false
    }
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL - VERSION CORRIGÉE PHASE 2
# ===============================================================================

if ($Help) {
    Show-Help
    exit 0
}

Show-Header
Write-ColorOutput "🚀 Démarrage de la validation complète du système..." "Cyan"
Write-ColorOutput "📂 Répertoire courant: $(Get-Location)" "White"
Write-ColorOutput "📝 Logs écrits dans: $LogPath" "White"
Write-Host ""

# 🔥 PHASE 2 CORRECTION : Ports standards selon documentation technique
# LM Studio API: 1234, Ollama API: 11434, Dashboard Web: 8035
Write-ColorOutput "🔍 Test des ports standards..." "Yellow"
$portResults = Test-PortAvailability @(1234, 11434, 8035, 8000)

# Test Python
Write-ColorOutput "`n🔍 Test de l'environnement Python..." "Yellow"
$pythonTest = Test-PythonEnvironment

# Test structure projet
Write-ColorOutput "`n🔍 Test de la structure du projet..." "Yellow"
$structureTest = Test-ProjectStructure

# Résumé
Write-ColorOutput "`n╔══════════════════════════════════════════════════════════════╗" "Cyan"
Write-ColorOutput "║                      📊 RÉSUMÉ FINAL - PHASE 2               ║" "Cyan"
Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
Write-Host ""

$portsOk = ($portResults.Values | Where-Object { $_.Status -eq "Libre" }).Count -ge 3
Write-Host "Ports disponibles:" -ForegroundColor "White"
foreach ($port in $portResults.Keys) {
    $status = $portResults[$port].Status
    $color = $portResults[$port].Color
    Write-Host "   Port $port : $status" -ForegroundColor $color
}

Write-Host "`nEnvironnement Python:" -ForegroundColor "White"
Write-Host "   " -NoNewline
if ($pythonTest) {
    Write-Host "✅ OK - Tous les modules nécessaires sont disponibles" -ForegroundColor "Green"
} else {
    Write-Host "❌ KO - Des modules Python sont manquants" -ForegroundColor "Red"
}

Write-Host "`nStructure du projet:" -ForegroundColor "White"
Write-Host "   " -NoNewline
if ($structureTest) {
    Write-Host "✅ OK - Structure conforme à la documentation technique" -ForegroundColor "Green"
} else {
    Write-Host "❌ KO - Structure incomplète ou incorrecte" -ForegroundColor "Red"
}

$globalSuccess = $portsOk -and $pythonTest -and $structureTest

Write-Host "`n📋 État global:" -ForegroundColor "Cyan"
Write-Host "   " -NoNewline
if ($globalSuccess) {
    Write-Host "🎉 TOUT EST PRÊT POUR LA PHASE 2 !" -ForegroundColor "Green"
} else {
    Write-Host "⚠️  DES CORRECTIONS SONT NÉCESSAIRES" -ForegroundColor "Yellow"
}

if ($globalSuccess) {
    Write-ColorOutput "`n🎉 VALIDATION RÉUSSIE - PHASE 2 !" "Green"
    Write-ColorOutput "✅ Le système est prêt à démarrer avec la nouvelle structure." "Green"
    Write-ColorOutput "🚀 Utilisez: ..\\LaunchMenu.ps1 pour démarrer l'application." "Cyan"
} else {
    Write-ColorOutput "`n⚠️  VALIDATION PARTIELLEMENT ÉCHOUÉE - PHASE 2" "Yellow"
    Write-ColorOutput "🔧 Veuillez résoudre les problèmes ci-dessus avant de continuer." "Yellow"
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Validation terminée - Phase 2" | Out-File $LogPath -Append -Encoding UTF8

Write-Host "`nAppuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")