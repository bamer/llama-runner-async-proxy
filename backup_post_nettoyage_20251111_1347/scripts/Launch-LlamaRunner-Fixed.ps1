#!/usr/bin/env powershell
# ===============================================================================
# 🚀 LlamaRunner Pro - Lanceur Principal Fixé
# Version corrigée avec logs détaillés et gestion des ports
# ===============================================================================

param(
    [switch]$Install,
    [switch]$Proxy,
    [switch]$WebUI,
    [switch]$Metrics,
    [switch]$Dev,
    [switch]$Headless,
    [switch]$Test,
    [string]$Config = "config.json",
    [string]$LogLevel = "DEBUG",
    [int]$MetricsPort = 8083,
    [int]$WebUIPort = 8082,
    [int]$LmStudioPort = 12345,
    [int]$OllamaPort = 11435,
    [switch]$Help
)

# Configuration globale
$Script:ProjectRoot = $PSScriptRoot
$Script:VenvPath = Join-Path $Script:ProjectRoot "dev-venv"
$Script:PythonPath = Join-Path $Script:VenvPath "Scripts\python.exe"
$Script:MainScript = Join-Path $Script:ProjectRoot "main_fixed.py"
$Script:MetricsScript = Join-Path $Script:ProjectRoot "llama_runner\metrics_server.py"
$Script:TestScript = Join-Path $Script:ProjectRoot "test_implementation_validation.py"
$Script:RequirementsFile = Join-Path $Script:ProjectRoot "requirements.txt"
$Script:LogPath = Join-Path $Script:ProjectRoot "config\launch.log"

# Créer le dossier de logs si nécessaire
if (-not (Test-Path "config")) {
    New-Item -ItemType Directory -Path "config" -Force | Out-Null
}

# Fonction de logging améliorée
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Écrire dans le fichier de log
    $logEntry | Out-File $Script:LogPath -Append -Encoding UTF8
    
    # Afficher à l'écran avec couleurs
    switch ($Level) {
        "DEBUG" { Write-Host $logEntry -ForegroundColor Gray }
        "INFO" { Write-Host $logEntry -ForegroundColor White }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "CRITICAL" { Write-Host $logEntry -ForegroundColor Magenta }
        default { Write-Host $logEntry }
    }
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    if ($Host.UI.SupportsVirtualTerminal) {
        Write-Host $Message -ForegroundColor $Color
    } else {
        Write-Host $Message
    }
}

function Show-Header {
    Clear-Host
    Write-ColorOutput "╔══════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                    🚀 LLAMARUNNER PRO FIXÉ                   ║" "Cyan"
    Write-ColorOutput "║                  Professional AI Proxy Suite                  ║" "Cyan"  
    Write-ColorOutput "║                        by Bamer                                ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
    Write-Log "=== Démarrage du lanceur LlamaRunner Pro (version fixée) ===" "INFO"
}

function Show-Help {
    Show-Header
    Write-ColorOutput "🎯 MODES DE LANCEMENT DISPONIBLES:" "Magenta"
    Write-Host ""
    Write-ColorOutput "📋 Options principales:" "Cyan"
    Write-Host "  -Install         : Installation des dépendances Python"
    Write-Host "  -Proxy           : Lance le proxy (LM Studio + Ollama)"
    Write-Host "  -WebUI           : Lance le proxy + interface web"
    Write-Host "  -Metrics         : Lance proxy + web UI + dashboard métriques"
    Write-Host "  -Dev             : Mode développement avec logs détaillés"
    Write-Host "  -Headless        : Mode serveur sans interface graphique"
    Write-Host "  -Test            : Lance les tests de validation"
    Write-Host ""
    Write-ColorOutput "⚙️  Configuration:" "Cyan"
    Write-Host "  -Config         : Fichier de configuration (défaut: config.json)"
    Write-Host "  -LogLevel       : Niveau de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    Write-Host "  -MetricsPort    : Port du dashboard métriques (défaut: 8083)"
    Write-Host "  -WebUIPort      : Port de l'interface web (défaut: 8082)"
    Write-Host "  -LmStudioPort   : Port LM Studio (défaut: 12345)"
    Write-Host "  -OllamaPort     : Port Ollama (défaut: 11435)"
    Write-Host ""
    Write-ColorOutput "💡 Exemples d'utilisation:" "Green"
    Write-Host "  .\Launch-LlamaRunner-Fixed.ps1 -Install"
    Write-Host "  .\Launch-LlamaRunner-Fixed.ps1 -Metrics"
    Write-Host "  .\Launch-LlamaRunner-Fixed.ps1 -WebUI -LogLevel DEBUG"
    Write-Host "  .\Launch-LlamaRunner-Fixed.ps1 -Test"
    Write-Host ""
    Write-ColorOutput "🎮 Mode interactif (aucun paramètre):" "Yellow"
    Write-Host "  .\Launch-LlamaRunner-Fixed.ps1"
    Write-Host ""
    Write-Log "Affichage de l'aide" "INFO"
}

function Test-PythonEnvironment {
    Write-Log "Test de l'environnement Python..." "INFO"
    Write-ColorOutput "🐍 Vérification de l'environnement Python..." "Yellow"
    
    if (-not (Test-Path $Script:VenvPath)) {
        Write-ColorOutput "❌ Environnement virtuel non trouvé: $Script:VenvPath" "Red"
        Write-Log "Environnement virtuel non trouvé: $Script:VenvPath" "ERROR"
        Write-ColorOutput "💡 Utilisez -Install pour créer l'environnement" "Yellow"
        return $false
    }
    Write-Log "Environnement virtuel trouvé" "DEBUG"
    
    if (-not (Test-Path $Script:PythonPath)) {
        Write-ColorOutput "❌ Python non trouvé: $Script:PythonPath" "Red"
        Write-Log "Python non trouvé: $Script:PythonPath" "ERROR"
        return $false
    }
    Write-Log "Python exécutable trouvé" "DEBUG"
    
    # Test import des modules critiques
    Write-Log "Test des modules Python critiques..." "DEBUG"
    $testResult = & $Script:PythonPath -c "
try:
    import sys, asyncio, websockets, psutil, fastapi, uvicorn
    print('✅ Modules critiques disponibles')
    exit(0)
except ImportError as e:
    print(f'❌ Module manquant: {e}')
    exit(1)
"
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Modules Python manquants" "Red"
        Write-Log "Modules Python manquants: $testResult" "ERROR"
        Write-ColorOutput "💡 Exécutez: .\Launch-LlamaRunner-Fixed.ps1 -Install" "Yellow"
        return $false
    }
    
    Write-ColorOutput "✅ Environnement Python vérifié" "Green"
    Write-Log "Environnement Python vérifié avec succès" "INFO"
    return $true
}

function Install-Dependencies {
    Show-Header
    Write-ColorOutput "📦 INSTALLATION DES DÉPENDANCES" "Cyan"
    Write-Log "=== Installation des dépendances ===" "INFO"
    Write-Host ""
    
    # Créer l'environnement virtuel s'il n'existe pas
    if (-not (Test-Path $Script:VenvPath)) {
        Write-ColorOutput "🏗️  Création de l'environnement virtuel..." "Yellow"
        Write-Log "Création de l'environnement virtuel..." "INFO"
        & python -m venv $Script:VenvPath
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Échec de création de l'environnement virtuel" "Red"
            Write-Log "Échec de création de l'environnement virtuel" "ERROR"
            return $false
        }
        Write-Log "Environnement virtuel créé avec succès" "INFO"
    }
    
    # Mettre à jour pip
    Write-ColorOutput "📈 Mise à jour de pip..." "Yellow"
    Write-Log "Mise à jour de pip..." "INFO"
    & $Script:PythonPath -m pip install --upgrade pip
    
    # Installer les dépendances
    Write-ColorOutput "📚 Installation des dépendances..." "Yellow"
    Write-Log "Installation des dépendances depuis $Script:RequirementsFile" "INFO"
    & $Script:PythonPath -m pip install -r $Script:RequirementsFile
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Échec de l'installation des dépendances" "Red"
        Write-Log "Échec de l'installation des dépendances" "ERROR"
        return $false
    }
    
    Write-ColorOutput "✅ Installation terminée avec succès!" "Green"
    Write-Log "Installation des dépendances terminée avec succès" "INFO"
    return $true
}

function Start-Proxy {
    param([string]$ConfigFile, [string]$LogLevel, [switch]$Headless, [int]$LmStudioPort, [int]$OllamaPort)
    
    Write-Log "Démarrage du proxy avec config: $ConfigFile, log level: $LogLevel" "INFO"
    Write-ColorOutput "🚀 Démarrage du proxy LlamaRunner..." "Yellow"
    Write-ColorOutput "📡 LM Studio: http://localhost:$LmStudioPort" "Cyan"
    Write-ColorOutput "🦙 Ollama: http://localhost:$OllamaPort" "Cyan"
    
    $args = @(
        $Script:MainScript,
        "--config", $ConfigFile,
        "--log-level", $LogLevel,
        "--lm-studio-port", $LmStudioPort.ToString(),
        "--ollama-port", $OllamaPort.ToString()
    )
    
    if ($Headless) {
        $args += "--headless"
        Write-Log "Mode headless activé" "DEBUG"
    }
    
    Write-Log "Commande Python: $($Script:PythonPath) $($args -join ' ')" "DEBUG"
    Write-ColorOutput "🔧 Commande: $($Script:PythonPath) $($args -join ' ')" "Gray"
    
    try {
        $process = Start-Process -FilePath $Script:PythonPath -ArgumentList $args -NoNewWindow -Wait -PassThru
        Write-Log "Processus terminé avec code: $($process.ExitCode)" "INFO"
        return $process.ExitCode
    } catch {
        Write-ColorOutput "❌ Erreur lors du démarrage: $_" "Red"
        Write-Log "Erreur lors du démarrage: $_" "ERROR"
        return 1
    }
}

function Start-WebUI {
    param([string]$ConfigFile, [string]$LogLevel)
    
    Write-Log "Démarrage en mode WebUI" "INFO"
    Write-ColorOutput "🌐 Démarrage du proxy + interface web..." "Yellow"
    
    $args = @(
        $Script:MainScript,
        "--config", $ConfigFile,
        "--log-level", $LogLevel,
        "--web-ui"
    )
    
    Write-Log "Commande WebUI: $($Script:PythonPath) $($args -join ' ')" "DEBUG"
    Write-ColorOutput "🔧 Commande: $($Script:PythonPath) $($args -join ' ')" "Gray"
    
    try {
        $process = Start-Process -FilePath $Script:PythonPath -ArgumentList $args -NoNewWindow -Wait -PassThru
        Write-Log "Processus WebUI terminé avec code: $($process.ExitCode)" "INFO"
        return $process.ExitCode
    } catch {
        Write-ColorOutput "❌ Erreur lors du démarrage WebUI: $_" "Red"
        Write-Log "Erreur WebUI: $_" "ERROR"
        return 1
    }
}

function Start-Metrics {
    param([string]$ConfigFile, [string]$LogLevel)
    
    Write-Log "Démarrage en mode Metrics (complet)" "INFO"
    Write-ColorOutput "📊 Démarrage du système complet (Proxy + WebUI + Métriques)..." "Yellow"
    
    $args = @(
        $Script:MainScript,
        "--config", $ConfigFile,
        "--log-level", $LogLevel,
        "--web-ui",
        "--metrics-port", $MetricsPort.ToString()
    )
    
    Write-Log "Commande Metrics: $($Script:PythonPath) $($args -join ' ')" "DEBUG"
    Write-ColorOutput "🔧 Commande: $($Script:PythonPath) $($args -join ' ')" "Gray"
    
    try {
        $process = Start-Process -FilePath $Script:PythonPath -ArgumentList $args -NoNewWindow -Wait -PassThru
        Write-Log "Processus Metrics terminé avec code: $($process.ExitCode)" "INFO"
        return $process.ExitCode
    } catch {
        Write-ColorOutput "❌ Erreur lors du démarrage Metrics: $_" "Red"
        Write-Log "Erreur Metrics: $_" "ERROR"
        return 1
    }
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ===============================================================================

if ($Help) {
    Show-Help
    Write-Log "Script terminé normalement (aide affichée)" "INFO"
    exit 0
}

Show-Header

# Traiter les arguments en ligne de commande
if ($Install) {
    $result = Install-Dependencies
    Write-Log "Installation terminée avec résultat: $result" "INFO"
    exit $(if ($result) { 0 } else { 1 })
}

if ($Test) {
    Write-ColorOutput "🧪 LANCEMENT DES TESTS DE VALIDATION" "Cyan"
    Write-Log "=== Lancement des tests de validation ===" "INFO"
    Write-Host ""
    
    if (Test-PythonEnvironment) {
        Write-Log "Environnement Python OK, lancement des tests" "INFO"
        & $Script:PythonPath $Script:TestScript
        $exitCode = $LASTEXITCODE
        Write-Log "Tests terminés avec code: $exitCode" "INFO"
        exit $exitCode
    } else {
        Write-Log "Tests annulés: environnement Python non valide" "WARNING"
        exit 1
    }
}

if ($Proxy -or $WebUI -or $Metrics -or $Dev -or $Headless) {
    Write-ColorOutput "🚀 LANCEMENT EN MODE LIGNE DE COMMANDE" "Cyan"
    Write-Log "=== Lancement en mode ligne de commande ===" "INFO"
    Write-Host ""
    
    $logLevel = if ($Dev) { "DEBUG" } else { $LogLevel }
    
    if (-not (Test-PythonEnvironment)) {
        Write-Log "Arrêt: environnement Python non valide" "ERROR"
        exit 1
    }
    
    $exitCode = 0
    
    if ($Metrics) {
        $exitCode = Start-Metrics -ConfigFile $Config -LogLevel $logLevel
    }
    elseif ($WebUI) {
        $exitCode = Start-WebUI -ConfigFile $Config -LogLevel $logLevel
    }
    else {
        $exitCode = Start-Proxy -ConfigFile $Config -LogLevel $logLevel -Headless:$Headless -LmStudioPort $LmStudioPort -OllamaPort $OllamaPort
    }
    
    Write-Log "Application terminée avec code: $exitCode" "INFO"
    exit $exitCode
}

# Mode interactif par défaut
Write-ColorOutput "🎯 MODE INTERACTIF - SÉLECTIONNEZ UNE OPTION" "Magenta"
Write-Host ""
Write-Host "1. 🏃‍♂️ Proxy uniquement (LM Studio + Ollama)"
Write-Host "2. 🌐 Proxy + Interface Web"  
Write-Host "3. 📊 Proxy + Web UI + Dashboard Métriques (Complet)"
Write-Host "4. 🔧 Mode Développement (logs détaillés)"
Write-Host "5. 🧪 Lancer les tests de validation"
Write-Host "6. 📦 Installer/Mise à jour des dépendances"
Write-Host "7. 📋 Afficher l'aide"
Write-Host "8. ❌ Quitter"
Write-Host ""

$choice = Read-Host "👉 Votre choix (1-8)"

switch ($choice) {
    "1" { 
        if (Test-PythonEnvironment) {
            Start-Proxy -ConfigFile $Config -LogLevel $LogLevel -LmStudioPort $LmStudioPort -OllamaPort $OllamaPort
        }
    }
    "2" { 
        if (Test-PythonEnvironment) {
            Start-WebUI -ConfigFile $Config -LogLevel $LogLevel
        }
    }
    "3" { 
        if (Test-PythonEnvironment) {
            Start-Metrics -ConfigFile $Config -LogLevel $LogLevel
        }
    }
    "4" { 
        if (Test-PythonEnvironment) {
            Start-Metrics -ConfigFile $Config -LogLevel "DEBUG"
        }
    }
    "5" { 
        if (Test-PythonEnvironment) {
            & $Script:PythonPath $Script:TestScript
        }
    }
    "6" { 
        Install-Dependencies
    }
    "7" { 
        Show-Help
    }
    "8" { 
        Write-ColorOutput "👋 Au revoir!" "Green"
        Write-Log "Script terminé normalement (mode interactif)" "INFO"
        exit 0
    }
    default {
        Write-ColorOutput "❌ Choix invalide" "Red"
        Write-Log "Choix invalide: $choice" "WARNING"
    }
}

Write-Log "Script terminé" "INFO"