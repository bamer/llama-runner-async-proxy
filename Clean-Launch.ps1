#!/usr/bin/env powershell
# ===============================================================================
# Clean PowerShell Launch Script - Llama Runner
# ===============================================================================

param(
    [switch]$Proxy,
    [switch]$WebUI,
    [switch]$Metrics,
    [switch]$Dev,
    [switch]$Headless,
    [switch]$Test,
    [switch]$Install,
    [string]$Config = "config/app_config.json",
    [string]$LogLevel = "INFO",
    [int]$MetricsPort = 8080,
    [int]$WebUIPort = 8081,
    [int]$LmStudioPort = 1234,
    [int]$OllamaPort = 11434
)

# Color definitions
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Accent = "Magenta"
    Header = "Cyan"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-Header {
    Clear-Host
    Write-ColorOutput "================================================================" $Colors.Header
    Write-ColorOutput "          🚀 LLAMA RUNNER - LAUNCHER CLEAN" $Colors.Header
    Write-ColorOutput "================================================================" $Colors.Header
    Write-Host ""
}

function Show-Menu {
    Write-ColorOutput "📋 OPTIONS DE LANCEMENT:" $Colors.Info
    Write-Host ""
    Write-Host "1. Mode Proxy (Serveur principal)"
    Write-Host "2. Mode Proxy + WebUI"
    Write-Host "3. Mode Proxy + WebUI + Metrics"
    Write-Host "4. Mode Développement (Debug)"
    Write-Host "5. Tests du système"
    Write-Host "6. Installation des dépendances"
    Write-Host "7. Sortie"
    Write-Host ""
}

function Test-PythonEnvironment {
    try {
        $pythonVersion = & python --version
        Write-ColorOutput "✅ Python détecté: $pythonVersion" $Colors.Success
        return $true
    } catch {
        Write-ColorOutput "❌ Python non trouvé" $Colors.Error
        return $false
    }
}

function Install-Dependencies {
    Write-ColorOutput "📦 Installation des dépendances..." $Colors.Info
    
    # Install required packages
    $packages = @(
        "fastapi",
        "uvicorn[standard]", 
        "qasync",
        "PySide6",
        "websocket-client",
        "faster-whisper",
        "llama-cpp-python",
        "requests",
        "pytest",
        "pytest-asyncio"
    )
    
    foreach ($package in $packages) {
        Write-Host "Installation de $package..." -NoNewline
        try {
            & pip install $package
            if ($LASTEXITCODE -eq 0) {
                Write-Host " ✅" -ForegroundColor Green
            } else {
                Write-Host " ❌" -ForegroundColor Red
            }
        } catch {
            Write-Host " ❌" -ForegroundColor Red
        }
    }
}

function Test-System {
    Write-ColorOutput "🧪 TESTS DU SYSTÈME" $Colors.Info
    Write-Host ""
    
    # Test Python
    if (Test-PythonEnvironment) {
        Write-ColorOutput "✅ Environnement Python OK" $Colors.Success
    } else {
        Write-ColorOutput "❌ Problème Python" $Colors.Error
    }
    
    # Test Configuration
    if (Test-Path $Config) {
        Write-ColorOutput "✅ Configuration trouvée: $Config" $Colors.Success
    } else {
        Write-ColorOutput "❌ Configuration manquante: $Config" $Colors.Error
        Write-Host "Copiez config/examples/basic.json vers config/app_config.json" -ForegroundColor Yellow
    }
    
    # Test Import des modules
    try {
        $pythonCode = @"
import sys
sys.path.append('.')
try:
    import llama_runner.gguf_metadata
    import llama_runner.lmstudio_proxy_thread
    print("✅ Tous les modules importent correctement")
    print(f"gguf disponible: {llama_runner.gguf_metadata.gguf_available}")
except Exception as e:
    print(f"❌ Erreur d'import: {e}")
"@
        $result = & python -c $pythonCode 2>&1
        Write-Host $result
    } catch {
        Write-ColorOutput "❌ Erreur lors du test d'import" $Colors.Error
    }
    
    Write-Host ""
    Write-ColorOutput "Tests terminés" $Colors.Info
}

function Start-Application {
    param(
        [string]$Mode,
        [string]$ConfigFile,
        [string]$Level,
        [int]$LmPort,
        [int]$OllamaPort
    )
    
    Write-ColorOutput "🚀 Lancement en mode: $Mode" $Colors.Accent
    Write-ColorOutput "Configuration: $ConfigFile" $Colors.Info
    Write-ColorOutput "Niveau de log: $Level" $Colors.Info
    
    $pythonArgs = @(
        "main.py",
        "--config", $ConfigFile,
        "--log-level", $Level,
        "--lm-studio-port", $LmPort.ToString(),
        "--ollama-port", $OllamaPort.ToString()
    )
    
    switch ($Mode) {
        "proxy" { }
        "webui" { $pythonArgs += "--web-ui" }
        "metrics" { $pythonArgs += "--web-ui"; $pythonArgs += "--metrics-port", "8080" }
        "dev" { $pythonArgs += "--dev" }
    }
    
    & python @pythonArgs
}

# Main execution
Show-Header

# Handle direct parameters
if ($Test) {
    Test-System
    exit 0
}

if ($Install) {
    Install-Dependencies
    exit 0
}

# Interactive mode if no parameters
if (-not ($Proxy -or $WebUI -or $Metrics -or $Dev)) {
    Show-Menu
    
    $choice = Read-Host "Sélectionnez une option (1-7)"
    
    switch ($choice) {
        "1" {
            Start-Application -Mode "proxy" -ConfigFile $Config -Level $LogLevel -LmPort $LmStudioPort -OllamaPort $OllamaPort
        }
        "2" {
            Start-Application -Mode "webui" -ConfigFile $Config -Level $LogLevel -LmPort $LmStudioPort -OllamaPort $OllamaPort
        }
        "3" {
            Start-Application -Mode "metrics" -ConfigFile $Config -Level $LogLevel -LmPort $LmStudioPort -OllamaPort $OllamaPort
        }
        "4" {
            Start-Application -Mode "dev" -ConfigFile $Config -Level "DEBUG" -LmPort $LmStudioPort -OllamaPort $OllamaPort
        }
        "5" {
            Test-System
        }
        "6" {
            Install-Dependencies
        }
        "7" {
            Write-ColorOutput "Au revoir!" $Colors.Info
            exit 0
        }
        default {
            Write-ColorOutput "Option invalide" $Colors.Error
            exit 1
        }
    }
} else {
    # Direct parameter mode
    if ($Proxy) {
        Start-Application -Mode "proxy" -ConfigFile $Config -Level $LogLevel -LmPort $LmStudioPort -OllamaPort $OllamaPort
    }
    if ($WebUI) {
        Start-Application -Mode "webui" -ConfigFile $Config -Level $LogLevel -LmPort $LmStudioPort -OllamaPort $OllamaPort
    }
    if ($Metrics) {
        Start-Application -Mode "metrics" -ConfigFile $Config -Level $LogLevel -LmPort $LmStudioPort -OllamaPort $OllamaPort
    }
    if ($Dev) {
        Start-Application -Mode "dev" -ConfigFile $Config -Level "DEBUG" -LmPort $LmStudioPort -OllamaPort $OllamaPort
    }
}