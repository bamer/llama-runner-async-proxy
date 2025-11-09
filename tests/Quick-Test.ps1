#!/usr/bin/env powershell
# ===============================================================================
# 🧪 Quick-Test.ps1 - Test simple sans interaction
# Pour vérifier le démarrage de base avec les ports alternatifs
# ===============================================================================

# Configuration des logs
$LogPath = "config\quick_test.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Démarrage du test rapide" | Out-File $LogPath -Append

function Write-TestLog {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$Timestamp] TEST: $Message" | Out-File $LogPath -Append
    Write-Host $Message
}

Write-TestLog "=== TEST RAPIDE LLAMARUNNER ==="
Write-TestLog "📂 Répertoire courant: $(Get-Location)"

# Vérifier si Python est disponible
$pythonAvailable = $false
try {
    $pythonVersion = python --version 2>&1
    Write-TestLog "✅ Python disponible: $pythonVersion"
    $pythonAvailable = $true
} catch {
    Write-TestLog "❌ Python non disponible: $_"
}

# Vérifier l'environnement virtuel
$venvPath = ".\dev-venv"
$pythonPath = ".\dev-venv\Scripts\python.exe"

if (Test-Path $venvPath) {
    Write-TestLog "✅ Environnement virtuel trouvé: $venvPath"
    if (Test-Path $pythonPath) {
        Write-TestLog "✅ Python dans l'environnement virtuel: $pythonPath"
        $venvAvailable = $true
    } else {
        Write-TestLog "❌ Python non trouvé dans l'environnement virtuel"
        $venvAvailable = $false
    }
} else {
    Write-TestLog "❌ Environnement virtuel non trouvé"
    $venvAvailable = $false
}

# Vérifier les ports
$portsToCheck = @(12345, 11435, 8082, 8083)
Write-TestLog "`n🔍 Vérification des ports disponibles:"

foreach ($port in $portsToCheck) {
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-TestLog "   ⚠️  Port $port: OCCUPÉ"
        } else {
            Write-TestLog "   ✅ Port $port: LIBRE"
        }
    } catch {
        Write-TestLog "   ✅ Port $port: probablement LIBRE (erreur de test: $_)"
    }
}

# Si l'environnement virtuel est disponible, faire un test simple
if ($venvAvailable) {
    Write-TestLog "`n🚀 Test de démarrage simple (headless mode)..."
    
    $args = @(
        "main_fixed.py",
        "--config", "config.json",
        "--log-level", "DEBUG",
        "--headless"
    )
    
    Write-TestLog "🔧 Commande: $pythonPath $($args -join ' ')"
    
    try {
        $process = Start-Process -FilePath $pythonPath -ArgumentList $args -NoNewWindow -Wait -PassThru -ErrorAction Stop
        Write-TestLog "✅ Processus terminé avec code: $($process.ExitCode)"
    } catch {
        Write-TestLog "❌ Erreur lors du démarrage: $_"
    }
} else {
    Write-TestLog "`n💡 Recommandations:"
    Write-TestLog "1. Installez les dépendances: .\Launch-LlamaRunner-Fixed.ps1 -Install"
    Write-TestLog "2. Si les ports sont occupés, utilisez .\PortConfig.ps1 pour changer les ports"
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Test rapide terminé" | Out-File $LogPath -Append

Write-TestLog "`n📋 Résultats du test écrits dans: $LogPath"
Write-TestLog "✅ Test terminé"