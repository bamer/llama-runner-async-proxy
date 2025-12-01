#!/usr/bin/env powershell
# ===============================================================================
# 🚀 LlamaRunner Pro - Lanceur Principal Multi-Mode
# Created by Bamer - Professional AI Proxy Suite Launcher
# ===============================================================================

param(
    [switch]$Install,
    [switch]$Proxy,
    [switch]$WebUI,
    [switch]$Metrics,
    [switch]$Dev,
    [switch]$Headless,
    [switch]$Test,
    [string]$Config = "config/app_config.json",
    [string]$LogLevel = "INFO",
    [int]$MetricsPort = 8080,
    [int]$WebUIPort = 8081,
    [int]$LmStudioPort = 1234,
    [int]$OllamaPort = 11434,
    [switch]$Help
)

# Configuration globale
$Script:ProjectRoot = $PSScriptRoot
$Script:VenvPath = Join-Path $Script:ProjectRoot "dev-venv"
$Script:PythonPath = Join-Path $Script:VenvPath "Scripts\python.exe"
$Script:MainScript = Join-Path $Script:ProjectRoot "main.py"
$Script:MetricsScript = Join-Path $Script:ProjectRoot "llama_runner\metrics_server.py"
$Script:TestScript = Join-Path $Script:ProjectRoot "test_implementation_validation.py"
$Script:RequirementsFile = Join-Path $Script:ProjectRoot "requirements.txt"

# Couleurs pour l'affichage
$Colors = @{
    "Header" = "Cyan"
    "Success" = "Green" 
    "Warning" = "Yellow"
    "Error" = "Red"
    "Info" = "White"
    "Accent" = "Magenta"
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
    Write-ColorOutput "╔══════════════════════════════════════════════════════════════╗" $Colors.Header
    Write-ColorOutput "║                    🚀 LlamaRunner Pro                        ║" $Colors.Header
    Write-ColorOutput "║                  Professional AI Proxy Suite                  ║" $Colors.Header  
    Write-ColorOutput "║                        by Bamer                                ║" $Colors.Header
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" $Colors.Header
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-ColorOutput "🎯 MODES DE LANCEMENT DISPONIBLES:" $Colors.Accent
    Write-Host ""
    Write-ColorOutput "📋 Options principales:" $Colors.Info
    Write-Host "  -Install         : Installation des dépendances Python"
    Write-Host "  -Proxy          : Lance le proxy (LM Studio + Ollama)"
    Write-Host "  -WebUI          : Lance le proxy + interface web"
    Write-Host "  -Metrics        : Lance proxy + web UI + dashboard métriques"
    Write-Host "  -Dev            : Mode développement avec logs détaillés"
    Write-Host "  -Headless       : Mode serveur sans interface graphique"
    Write-Host "  -Test           : Lance les tests de validation"
    Write-Host ""
    Write-ColorOutput "⚙️  Configuration:" $Colors.Info
    Write-Host "  -Config         : Fichier de configuration (défaut: config.json)"
    Write-Host "  -LogLevel       : Niveau de log (DEBUG, INFO, WARNING, ERROR)"
    Write-Host "  -MetricsPort    : Port du dashboard métriques (défaut: 8080)"
    Write-Host "  -WebUIPort      : Port de l'interface web (défaut: 8081)"
    Write-Host "  -LmStudioPort   : Port LM Studio (défaut: 1234)"
    Write-Host "  -OllamaPort     : Port Ollama (défaut: 11434)"
    Write-Host ""
    Write-ColorOutput "💡 Exemples d'utilisation:" $Colors.Info
    Write-Host "  .\Launch-LlamaRunner.ps1 -Install"
    Write-Host "  .\Launch-LlamaRunner.ps1 -Proxy"
    Write-Host "  .\Launch-LlamaRunner.ps1 -Metrics -Headless"
    Write-Host "  .\Launch-LlamaRunner.ps1 -WebUI -LogLevel DEBUG"
    Write-Host "  .\Launch-LlamaRunner.ps1 -Test"
    Write-Host ""
    Write-ColorOutput "🎮 Mode interactif (aucun paramètre):" $Colors.Warning
    Write-Host "  .\Launch-LlamaRunner.ps1"
    Write-Host ""
}

function Test-PythonEnvironment {
    Write-ColorOutput "🐍 Vérification de l'environnement Python..." $Colors.Info
    
    if (-not (Test-Path $Script:VenvPath)) {
        Write-ColorOutput "❌ Environnement virtuel non trouvé: $Script:VenvPath" $Colors.Error
        Write-ColorOutput "💡 Utilisez -Install pour créer l'environnement" $Colors.Warning
        return $false
    }
    
    if (-not (Test-Path $Script:PythonPath)) {
        Write-ColorOutput "❌ Python non trouvé: $Script:PythonPath" $Colors.Error
        return $false
    }
    
    # Test import des modules critiques
    $testResult = & $Script:PythonPath -c "
try:
    import sys, asyncio, websockets, psutil
    print('✅ Modules critiques disponibles')
    exit(0)
except ImportError as e:
    print(f'❌ Module manquant: {e}')
    exit(1)
"
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Modules Python manquants" $Colors.Error
        Write-ColorOutput "💡 Exécutez: .\Launch-LlamaRunner.ps1 -Install" $Colors.Warning
        return $false
    }
    
    Write-ColorOutput "✅ Environnement Python vérifié" $Colors.Success
    return $true
}

function Install-Dependencies {
    Show-Header
    Write-ColorOutput "📦 INSTALLATION DES DÉPENDANCES" $Colors.Accent
    Write-Host ""
    
    # Créer l'environnement virtuel s'il n'existe pas
    if (-not (Test-Path $Script:VenvPath)) {
        Write-ColorOutput "🏗️  Création de l'environnement virtuel..." $Colors.Info
        & python -m venv $Script:VenvPath
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Échec de création de l'environnement virtuel" $Colors.Error
            return $false
        }
    }
    
    # Mettre à jour pip
    Write-ColorOutput "📈 Mise à jour de pip..." $Colors.Info
    & $Script:PythonPath -m pip install --upgrade pip
    
    # Installer les dépendances
    Write-ColorOutput "📚 Installation des dépendances..." $Colors.Info
    & $Script:PythonPath -m pip install -r $Script:RequirementsFile
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Échec de l'installation des dépendances" $Colors.Error
        return $false
    }
    
    Write-ColorOutput "✅ Installation terminée avec succès!" $Colors.Success
    return $true
}

function Start-MetricsServer {
    param([int]$Port = 8585)
    
    Write-ColorOutput "📊 Démarrage du serveur de métriques..." $Colors.Info
    Write-ColorOutput "🌐 Dashboard disponible sur: http://localhost:$Port" $Colors.Accent
    
    $metricsProcess = Start-Process -FilePath $Script:PythonPath -ArgumentList $Script:MetricsScript -WindowStyle Normal -PassThru
    return $metricsProcess
}

function Start-Proxy {
    param([string]$ConfigFile, [string]$LogLevel, [switch]$Headless, [int]$LmStudioPort, [int]$OllamaPort)
    
    Write-ColorOutput "🚀 Démarrage du proxy LlamaRunner..." $Colors.Info
    Write-ColorOutput "📡 LM Studio: http://localhost:$LmStudioPort" $Colors.Accent
    Write-ColorOutput "🦙 Ollama: http://localhost:$OllamaPort" $Colors.Accent
    
    $args = @(
        $Script:MainScript,
        "--config", $ConfigFile,
        "--log-level", $LogLevel,
        "--lm-studio-port", $LmStudioPort,
        "--ollama-port", $OllamaPort
    )
    
    if ($Headless) {
        $args += "--headless"
    }
    
    $proxyProcess = Start-Process -FilePath $Script:PythonPath -ArgumentList $args -WindowStyle Normal -PassThru
    return $proxyProcess
}

function Show-InteractiveMenu {
    while ($true) {
        Show-Header
        Write-ColorOutput "🎯 SÉLECTIONNEZ LE MODE DE LANCEMENT:" $Colors.Accent
        Write-Host ""
        
        $options = @(
            "🏃‍♂️ Proxy uniquement (LM Studio + Ollama)",
            "🌐 Proxy + Interface Web",  
            "📊 Proxy + Web UI + Dashboard Métriques (Complet)",
            "🔧 Mode Développement (avec logs détaillés)",
            "🖥️  Mode Headless (serveur sans GUI)",
            "🧪 Lancer les tests de validation",
            "📦 Installer/Mise à jour des dépendances",
            "❌ Quitter"
        )
        
        $selectedIndex = 0
        
        while ($true) {
            Clear-Host
            Show-Header
            Write-ColorOutput "🎯 SÉLECTIONNEZ LE MODE DE LANCEMENT:" $Colors.Accent
            Write-Host ""
            
            for ($i = 0; $i -lt $options.Count; $i++) {
                if ($i -eq $selectedIndex) {
                    Write-Host "  ➤ $($options[$i])" -ForegroundColor $Colors.Accent
                } else {
                    Write-Host "    $($options[$i])" -ForegroundColor $Colors.Info
                }
            }
            
            Write-Host ""
            Write-Host "Utilisez ↑↓ pour naviguer, Entrée pour sélectionner, Échap pour quitter" -ForegroundColor $Colors.Warning
            
            # Attendre une touche
            $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            
            switch ($key.VirtualKeyCode) {
                38 { # Flèche haut
                    if ($selectedIndex -gt 0) { $selectedIndex-- }
                }
                40 { # Flèche bas
                    if ($selectedIndex -lt ($options.Count - 1)) { $selectedIndex++ }
                }
                13 { # Entrée
                    return ($selectedIndex + 1)
                }
                27 { # Échap
                    return 8
                }
            }
        }
    }
}

function Start-InteractiveMode {
    while ($true) {
        $choice = Show-InteractiveMenu
        
        switch ($choice) {
            1 { 
                Write-Host ""
                if (Test-PythonEnvironment) {
                    $proxyProcess = Start-Proxy -ConfigFile $Config -LogLevel $LogLevel
                    Write-Host ""
                    Write-ColorOutput "✅ Proxy démarré! Appuyez sur Ctrl+C pour arrêter" $Colors.Success
                    try {
                        Wait-Process $proxyProcess.Id
                    } catch {
                        Write-ColorOutput "🛑 Arrêt du proxy..." $Colors.Warning
                    }
                }
            }
            2 { 
                Write-Host ""
                Write-ColorOutput "🌐 Mode Proxy + Interface Web sélectionné" $Colors.Info
                if (Test-PythonEnvironment) {
                    $proxyProcess = Start-Proxy -ConfigFile $Config -LogLevel $LogLevel
                    Start-Sleep -Seconds 3
                    Write-ColorOutput "✅ Proxy démarré!" $Colors.Success
                    Write-ColorOutput "🌐 Interface Web: Ouvrir un navigateur sur http://localhost:$WebUIPort" $Colors.Accent
                    Write-ColorOutput "📡 LM Studio API: http://localhost:$LmStudioPort" $Colors.Accent
                    Write-Host ""
                    Write-ColorOutput "Appuyez sur Ctrl+C pour arrêter" $Colors.Warning
                    try {
                        Wait-Process $proxyProcess.Id
                    } catch {
                        Write-ColorOutput "🛑 Arrêt du proxy..." $Colors.Warning
                    }
                }
            }
            3 { 
                Write-Host ""
                Write-ColorOutput "📊 Mode Complet sélectionné (Proxy + Web UI + Métriques)" $Colors.Info
                if (Test-PythonEnvironment) {
                    # Démarrer le serveur de métriques
                    $metricsProcess = Start-MetricsServer -Port $MetricsPort
                    Start-Sleep -Seconds 2
                    
                    # Démarrer le proxy
                    $proxyProcess = Start-Proxy -ConfigFile $Config -LogLevel $LogLevel
                    
                    Write-Host ""
                    Write-ColorOutput "✅ Système complet démarré!" $Colors.Success
                    Write-ColorOutput "📊 Dashboard Métriques: http://localhost:$MetricsPort" $Colors.Accent
                    Write-ColorOutput "🌐 Interface Web: http://localhost:$WebUIPort" $Colors.Accent
                    Write-ColorOutput "📡 LM Studio API: http://localhost:$LmStudioPort" $Colors.Accent
                    Write-ColorOutput "🦙 Ollama API: http://localhost:$OllamaPort" $Colors.Accent
                    Write-Host ""
                    Write-ColorOutput "Appuyez sur Ctrl+C pour arrêter tous les services" $Colors.Warning
                    
                    try {
                        Wait-Process $proxyProcess.Id
                    } catch {
                        Write-ColorOutput "🛑 Arrêt des services..." $Colors.Warning
                    }
                    
                    if ($metricsProcess -and !$metricsProcess.HasExited) {
                        Stop-Process $metricsProcess.Id -Force
                    }
                }
            }
            4 { 
                Write-Host ""
                Write-ColorOutput "🔧 Mode Développement sélectionné" $Colors.Info
                if (Test-PythonEnvironment) {
                    $devProxyProcess = Start-Proxy -ConfigFile $Config -LogLevel "DEBUG" -LmStudioPort $LmStudioPort -OllamaPort $OllamaPort
                    Write-Host ""
                    Write-ColorOutput "✅ Mode développement démarré!" $Colors.Success
                    Write-ColorOutput "📝 Logs détaillés activés" $Colors.Accent
                    Write-ColorOutput "📡 LM Studio: http://localhost:$LmStudioPort" $Colors.Accent
                    Write-Host ""
                    Write-ColorOutput "Appuyez sur Ctrl+C pour arrêter" $Colors.Warning
                    try {
                        Wait-Process $devProxyProcess.Id
                    } catch {
                        Write-ColorOutput "🛑 Arrêt du mode développement..." $Colors.Warning
                    }
                }
            }
            5 { 
                Write-Host ""
                Write-ColorOutput "🖥️  Mode Headless sélectionné" $Colors.Info
                if (Test-PythonEnvironment) {
                    $headlessProcess = Start-Proxy -ConfigFile $Config -LogLevel $LogLevel -Headless -LmStudioPort $LmStudioPort -OllamaPort $OllamaPort
                    Write-Host ""
                    Write-ColorOutput "✅ Mode headless démarré!" $Colors.Success
                    Write-ColorOutput "📡 LM Studio: http://localhost:$LmStudioPort" $Colors.Accent
                    Write-ColorOutput "🦙 Ollama: http://localhost:$OllamaPort" $Colors.Accent
                    Write-Host ""
                    Write-ColorOutput "Appuyez sur Ctrl+C pour arrêter" $Colors.Warning
                    try {
                        Wait-Process $headlessProcess.Id
                    } catch {
                        Write-ColorOutput "🛑 Arrêt du mode headless..." $Colors.Warning
                    }
                }
            }
            6 { 
                Write-Host ""
                Write-ColorOutput "🧪 Lancement des tests..." $Colors.Info
                if (Test-PythonEnvironment) {
                    Write-Host ""
                    & $Script:PythonPath $Script:TestScript
                    Write-Host ""
                    Write-ColorOutput "✅ Tests terminés! Appuyez sur une touche pour continuer..." $Colors.Success
                    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                }
            }
            7 { 
                if (Install-Dependencies) {
                    Write-Host ""
                    Write-ColorOutput "✅ Installation terminée! Appuyez sur une touche pour continuer..." $Colors.Success
                    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                } else {
                    Write-Host ""
                    Write-ColorOutput "❌ Échec de l'installation. Appuyez sur une touche pour continuer..." $Colors.Error
                    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                }
            }
            8 { 
                Write-ColorOutput "👋 Au revoir!" $Colors.Info
                exit 0
            }
        }
    }
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ===============================================================================

if ($Help) {
    Show-Help
    exit 0
}

# Traiter les arguments en ligne de commande
if ($Install) {
    Show-Header
    Install-Dependencies
    exit $LASTEXITCODE
}

if ($Test) {
    Show-Header
    Write-ColorOutput "🧪 LANCEMENT DES TESTS DE VALIDATION" $Colors.Accent
    Write-Host ""
    if (Test-PythonEnvironment) {
        & $Script:PythonPath $Script:TestScript
        exit $LASTEXITCODE
    } else {
        exit 1
    }
}

if ($Proxy -or $WebUI -or $Metrics -or $Dev -or $Headless) {
    Show-Header
    Write-ColorOutput "🚀 LANCEMENT EN MODE LIGNE DE COMMANDE" $Colors.Accent
    Write-Host ""
    
    if (-not (Test-PythonEnvironment)) {
        exit 1
    }
    
    $processes = @()
    
    # Démarrer le serveur de métriques si demandé
    if ($Metrics) {
        $metricsProcess = Start-MetricsServer -Port $MetricsPort
        $processes += $metricsProcess
        Start-Sleep -Seconds 2
    }
    
    # Déterminer le niveau de log
    $effectiveLogLevel = if ($Dev) { "DEBUG" } else { $LogLevel }
    
    # Démarrer le proxy
    $proxyProcess = Start-Proxy -ConfigFile $Config -LogLevel $effectiveLogLevel -Headless:$Headless -LmStudioPort $LmStudioPort -OllamaPort $OllamaPort
    $processes += $proxyProcess
    
    Write-Host ""
    Write-ColorOutput "✅ Services démarrés!" $Colors.Success
    Write-Host ""
    
    if ($Metrics) {
        Write-ColorOutput "📊 Dashboard: http://localhost:$MetricsPort" $Colors.Accent
    }
    if ($WebUI -or $Metrics) {
        Write-ColorOutput "🌐 Interface Web: http://localhost:$WebUIPort" $Colors.Accent
    }
    Write-ColorOutput "📡 LM Studio: http://localhost:$LmStudioPort" $Colors.Accent
    Write-ColorOutput "🦙 Ollama: http://localhost:$OllamaPort" $Colors.Accent
    
    Write-Host ""
    Write-ColorOutput "Appuyez sur Ctrl+C pour arrêter tous les services" $Colors.Warning
    
    try {
        Wait-Process $proxyProcess.Id
    } catch {
        Write-ColorOutput "🛑 Arrêt des services..." $Colors.Warning
    }
    
    # Arrêter tous les processus
    foreach ($process in $processes) {
        if ($process -and !$process.HasExited) {
            Stop-Process $process.Id -Force
        }
    }
    
    exit 0
}

# Mode interactif par défaut
Show-InteractiveMenu
