#!/usr/bin/env powershell
# ===============================================================================
# 🐞 Debug-Launch.ps1 - Script de débogage pour LlamaRunner
# Test simplifié avec logs détaillés
# ===============================================================================

param(
    [switch]$Proxy,
    [switch]$WebUI,
    [switch]$Metrics,
    [switch]$Dev,
    [string]$Config = "config.json",
    [string]$LogLevel = "DEBUG"
)

# Configuration des logs
$LogPath = "config\debug_launch.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Démarrage du script de débogage" | Out-File $LogPath -Append
"[$Timestamp] Paramètres: Proxy=$Proxy, WebUI=$WebUI, Metrics=$Metrics, Dev=$Dev, Config=$Config, LogLevel=$LogLevel" | Out-File $LogPath -Append

function Write-DebugOutput {
    param([string]$Message, [string]$Color = "White")
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$Timestamp] DEBUG: $Message" | Out-File $LogPath -Append
    
    if ($Host.UI.SupportsVirtualTerminal) {
        Write-Host $Message -ForegroundColor $Color
    } else {
        Write-Host $Message
    }
}

function Test-PythonEnvironment {
    Write-DebugOutput "🔍 Test de l'environnement Python..." "Yellow"
    
    $venvPath = ".\dev-venv"
    $pythonPath = ".\dev-venv\Scripts\python.exe"
    
    if (-not (Test-Path $venvPath)) {
        Write-DebugOutput "❌ Environnement virtuel non trouvé: $venvPath" "Red"
        return $false
    }
    Write-DebugOutput "✅ Environnement virtuel trouvé" "Green"
    
    if (-not (Test-Path $pythonPath)) {
        Write-DebugOutput "❌ Python non trouvé: $pythonPath" "Red"
        return $false
    }
    Write-DebugOutput "✅ Python trouvé" "Green"
    
    # Test des imports critiques
    $testResult = & $pythonPath -c "
try:
    import sys, asyncio, websockets, psutil
    print('✅ Modules critiques disponibles')
    exit(0)
except ImportError as e:
    print(f'❌ Module manquant: {e}')
    exit(1)
"
    
    if ($LASTEXITCODE -eq 0) {
        Write-DebugOutput "✅ Modules Python critiques disponibles" "Green"
        return $true
    } else {
        Write-DebugOutput "❌ Modules Python manquants: $testResult" "Red"
        return $false
    }
}

function Start-Proxy {
    param([string]$ConfigFile, [string]$LogLevel)
    
    Write-DebugOutput "🚀 Démarrage du proxy avec configuration détaillée..." "Cyan"
    Write-DebugOutput "📋 Fichier de configuration: $ConfigFile" "White"
    Write-DebugOutput "📊 Niveau de log: $LogLevel" "White"
    
    $pythonPath = ".\dev-venv\Scripts\python.exe"
    $mainScript = "main.py"
    
    $args = @(
        $mainScript,
        "--config", $ConfigFile,
        "--log-level", $LogLevel
    )
    
    if ($Proxy) { }
    if ($WebUI) { $args += "--web-ui" }
    if ($Metrics) { $args += "--metrics-port", "8083" }
    if ($Dev) { $args += "--dev" }
    
    Write-DebugOutput "🔧 Commande Python: $pythonPath $($args -join ' ')" "Yellow"
    
    try {
        Write-DebugOutput "⏳ Lancement du processus Python..." "Yellow"
        $process = Start-Process -FilePath $pythonPath -ArgumentList $args -NoNewWindow -Wait -PassThru
        Write-DebugOutput "✅ Processus terminé avec code: $($process.ExitCode)" "Green"
    } catch {
        Write-DebugOutput "❌ Erreur lors du démarrage: $_" "Red"
    }
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ===============================================================================

Clear-Host
Write-DebugOutput "╔══════════════════════════════════════════════════════════════╗" "Cyan"
Write-DebugOutput "║                    🐞 DEBUG MODE - LLAMARUNNER               ║" "Cyan"
Write-DebugOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
Write-Host ""

if (-not (Test-PythonEnvironment)) {
    Write-DebugOutput "❌ Environnement Python non valide" "Red"
    Write-DebugOutput "💡 Pour installer les dépendances: .\Launch-LlamaRunner.ps1 -Install" "Yellow"
    exit 1
}

Write-DebugOutput "✅ Environnement Python valide" "Green"
Write-DebugOutput "📂 Répertoire courant: $(Get-Location)" "White"
Write-DebugOutput "📝 Logs écrits dans: $LogPath" "White"
Write-Host ""

if ($Proxy -or $WebUI -or $Metrics -or $Dev) {
    Start-Proxy -ConfigFile $Config -LogLevel $LogLevel
} else {
    Write-DebugOutput "🎯 Aucun mode spécifié. Utilisez les paramètres:" "Yellow"
    Write-DebugOutput "   -Proxy     : Mode proxy seul"
    Write-DebugOutput "   -WebUI     : Mode proxy + interface web"
    Write-DebugOutput "   -Metrics   : Mode complet avec métriques"
    Write-DebugOutput "   -Dev       : Mode développement"
    Write-DebugOutput "Exemple: .\Debug-Launch.ps1 -Metrics -Dev" "Cyan"
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Script de débogage terminé" | Out-File $LogPath -Append

Write-Host ""
Write-DebugOutput "🔍 Vérifiez les logs détaillés dans: $LogPath" "White"
Write-DebugOutput "✅ Test terminé" "Green"