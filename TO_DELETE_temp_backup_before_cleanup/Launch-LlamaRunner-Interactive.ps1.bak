#!/usr/bin/env powershell
# ===============================================================================
# Main Launch Script - Llama Runner (Interactive Menu Version)
# ===============================================================================

param(
    [switch]$Proxy,
    [switch]$WebUI,
    [switch]$Metrics,
    [switch]$Dev,
    [switch]$Test,
    [switch]$Install,
    [string]$Config = "config/app_config.json",
    [string]$LogLevel = "INFO"
)

# Color definitions
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Accent = "Magenta"
    Header = "Cyan"
    MenuSelected = "White"
    MenuNormal = "Gray"
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
    Write-Host "================================================================" $Colors.Header
    Write-Host "          LLAMA RUNNER - LAUNCHER INTERACTIF" $Colors.Header
    Write-Host "================================================================" $Colors.Header
    Write-Host ""
}

function Show-Interactive-Menu {
    $menuOptions = @(
        "Mode Proxy (Serveur principal)",
        "Mode Proxy + WebUI",
        "Mode Proxy + WebUI + Dashboard Métriques (Complet)",
        "Mode Développement (Debug)",
        "Tests du système",
        "Installation des dépendances",
        "Sortie"
    )
    
    $selectedIndex = 0
    
    while ($true) {
        Clear-Host
        Show-Header
        
        Write-ColorOutput "=== MENU PRINCIPAL ===" $Colors.Info
        Write-Host ""
        
        for ($i = 0; $i -lt $menuOptions.Count; $i++) {
            if ($i -eq $selectedIndex) {
                Write-Host "  > $($menuOptions[$i])" $Colors.MenuSelected
            } else {
                Write-Host "    $($menuOptions[$i])" $Colors.MenuNormal
            }
        }
        
        Write-Host ""
        Write-Host "Utilisez les flèches ↑↓ pour naviguer, Entrée pour sélectionner" $Colors.Info
        
        # Wait for key press
        $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        switch ($key.VirtualKeyCode) {
            38 { # Up arrow
                if ($selectedIndex -gt 0) { $selectedIndex-- }
            }
            40 { # Down arrow
                if ($selectedIndex -lt $menuOptions.Count - 1) { $selectedIndex++ }
            }
            13 { # Enter
                return $selectedIndex
            }
            27 { # Escape
                return $menuOptions.Count - 1
            }
        }
    }
}

function Test-PythonEnvironment {
    try {
        $pythonVersion = & python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "OK: Python détecté: $pythonVersion" $Colors.Success
            return $true
        } else {
            Write-ColorOutput "ERROR: Python non trouvé" $Colors.Error
            return $false
        }
    } catch {
        Write-ColorOutput "ERROR: Problème Python" $Colors.Error
        return $false
    }
}

function Test-System {
    Write-ColorOutput "=== TESTS DU SYSTÈME ===" $Colors.Info
    Write-Host ""
    
    # Test Python
    if (Test-PythonEnvironment) {
        Write-ColorOutput "OK: Environnement Python" $Colors.Success
    } else {
        Write-ColorOutput "ERROR: Problème Python" $Colors.Error
    }
    
    # Test Configuration
    Write-Host "Test de la configuration..." -NoNewline
    if (Test-Path $Config) {
        Write-ColorOutput " OK - $Config trouvé" $Colors.Success
    } else {
        Write-ColorOutput " FAILED - $Config manquant" $Colors.Error
        Write-Host "Copiez config/examples/basic.json vers config/app_config.json" $Colors.Warning
    }
    
    # Test imports
    Write-Host "Test des imports Python..." -NoNewline
    $importTest = & python -c "
import sys
sys.path.append('.')
try:
    import llama_runner.gguf_metadata
    import llama_runner.lmstudio_proxy_thread
    print(' OK - Tous les modules importent correctement')
    print(f'gguf disponible: {llama_runner.gguf_metadata.gguf_available}')
except Exception as e:
    print(' FAILED')
    print(f'Erreur: {e}')
" 2>&1
    
    Write-Host ""
    Write-Host $importTest
    Write-Host ""
    Write-ColorOutput "=== TESTS TERMINÉS ===" $Colors.Info
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Install-Dependencies {
    Write-ColorOutput "=== INSTALLATION DES DÉPENDANCES ===" $Colors.Info
    Write-Host ""
    
    $packages = @(
        "fastapi", "uvicorn[standard]", "qasync", "PySide6", 
        "websocket-client", "faster-whisper", "llama-cpp-python", 
        "requests", "pytest", "pytest-asyncio", "gguf"
    )
    
    foreach ($package in $packages) {
        Write-Host "Installation de $package..." -NoNewline
        try {
            & pip install $package 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host " OK" $Colors.Success
            } else {
                Write-Host " FAILED" $Colors.Error
            }
        } catch {
            Write-Host " FAILED" $Colors.Error
        }
    }
    
    Write-Host ""
    Write-ColorOutput "=== INSTALLATION TERMINÉE ===" $Colors.Info
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Start-Application {
    param(
        [string]$Mode = "proxy"
    )
    
    Write-ColorOutput "=== LANCEMENT DE L'APPLICATION ===" $Colors.Accent
    Write-Host "Mode: $Mode" $Colors.Info
    Write-Host "Configuration: $Config" $Colors.Info
    Write-Host "Niveau de log: $LogLevel" $Colors.Info
    Write-Host ""
    Write-Host "Appuyez sur Ctrl+C pour arrêter" $Colors.Warning
    Write-Host ""
    
    $args = @("main.py", "--config", $Config, "--log-level", $LogLevel)
    
    switch ($Mode) {
        "proxy" { }
        "webui" { $args += "--web-ui" }
        "metrics" { $args += "--web-ui"; $args += "--metrics-port", "8080" }
        "dev" { $args += "--dev" }
    }
    
    & python @args
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

# Interactive mode if no direct parameters
if (-not ($Proxy -or $WebUI -or $Metrics -or $Dev)) {
    while ($true) {
        $choice = Show-Interactive-Menu
        
        switch ($choice) {
            0 { # Proxy
                Start-Application -Mode "proxy"
                break
            }
            1 { # Proxy + WebUI
                Start-Application -Mode "webui"
                break
            }
            2 { # Proxy + WebUI + Metrics
                Start-Application -Mode "metrics"
                break
            }
            3 { # Dev
                Start-Application -Mode "dev"
                break
            }
            4 { # Tests
                Test-System
            }
            5 { # Install
                Install-Dependencies
            }
            6 { # Exit
                Write-ColorOutput "Au revoir!" $Colors.Info
                exit 0
            }
        }
    }
} else {
    # Direct parameter mode
    $Mode = "proxy"
    if ($WebUI) { $Mode = "webui" }
    if ($Metrics) { $Mode = "metrics" }
    if ($Dev) { $Mode = "dev" }
    
    Start-Application -Mode $Mode
}