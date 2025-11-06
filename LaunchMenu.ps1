#!/usr/bin/env powershell
# ===============================================================================
# Menu Interactif - Llama Runner
# ===============================================================================

$script:Options = @(
    @{Text="Mode Proxy (Serveur principal)"; Action="proxy"}
    @{Text="Mode Proxy + WebUI"; Action="webui"}
    @{Text="Mode Proxy + WebUI + Dashboard Métriques (Complet)"; Action="metrics"}
    @{Text="Mode Développement (Debug)"; Action="dev"}
    @{Text="Tests du système"; Action="test"}
    @{Text="Installation des dépendances"; Action="install"}
    @{Text="Quitter"; Action="exit"}
)

$script:CurrentSelection = 0
$script:Config = "config/app_config.json"
$script:LogLevel = "INFO"

function Show-Header {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "            🦙 LLAMA RUNNER - MENU INTERACTIF" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Menu {
    for ($i = 0; $i -lt $Options.Count; $i++) {
        $prefix = if ($i -eq $CurrentSelection) { "  > " } else { "    " }
        $color = if ($i -eq $CurrentSelection) { "White" } else { "Gray" }
        Write-Host "$prefix$($Options[$i].Text)" -ForegroundColor $color
    }
    
    Write-Host "`n" -NoNewline
    Write-Host "Utilisez ↑↓ pour naviguer, Entrée pour sélectionner" -ForegroundColor Cyan
}

function Test-Environment {
    Write-Host "`n=== TEST DE L'ENVIRONNEMENT ===" -ForegroundColor Yellow
    
    # Test Python
    Write-Host "`nVérification de Python..." -NoNewline
    try {
        $version = python --version 2>&1
        Write-Host " OK - $version" -ForegroundColor Green
    }
    catch {
        Write-Host " ERREUR" -ForegroundColor Red
        Write-Host "Python n'est pas installé ou accessible" -ForegroundColor Red
        return $false
    }
    
    # Test Configuration
    Write-Host "Vérification de la configuration..." -NoNewline
    if (Test-Path $Config) {
        Write-Host " OK" -ForegroundColor Green
    }
    else {
        Write-Host " ERREUR" -ForegroundColor Red
        Write-Host "Configuration manquante: $Config" -ForegroundColor Red
        Write-Host "Copiez config/examples/basic.json vers config/app_config.json" -ForegroundColor Yellow
        return $false
    }
    
    # Test Imports
    Write-Host "Test des imports Python..." -NoNewline
    $result = python -c @"
import sys
sys.path.append('.')
try:
    import llama_runner.gguf_metadata
    import llama_runner.lmstudio_proxy_thread
    print('OK')
except Exception as e:
    print(f'ERROR: {str(e)}')
"@ 2>&1

    if ($result -eq "OK") {
        Write-Host " OK" -ForegroundColor Green
    }
    else {
        Write-Host " ERREUR" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $false
    }
    
    Write-Host "`nEnvironnement OK !" -ForegroundColor Green
    Start-Sleep -Seconds 1
    return $true
}

function Install-Dependencies {
    Write-Host "`n=== INSTALLATION DES DÉPENDANCES ===" -ForegroundColor Yellow
    
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
        "pytest-asyncio",
        "gguf"
    )
    
    foreach ($pkg in $packages) {
        Write-Host "Installation de $pkg..." -NoNewline
        pip install $pkg --quiet 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " OK" -ForegroundColor Green
        }
        else {
            Write-Host " ERREUR" -ForegroundColor Red
        }
    }
    
    Write-Host "`nInstallation terminée" -ForegroundColor Green
    Write-Host "Appuyez sur une touche pour continuer..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Start-LlamaRunner {
    param (
        [string]$Mode
    )
    
    if (-not (Test-Environment)) {
        Write-Host "`nEnvironnement non valide. Installation requise." -ForegroundColor Red
        return
    }
    
    Write-Host "`n=== DÉMARRAGE DE LLAMA RUNNER ===" -ForegroundColor Yellow
    Write-Host "Mode: $Mode"
    Write-Host "Configuration: $Config"
    
    $args = @(
        "main.py",
        "--config", $Config,
        "--log-level", $LogLevel
    )
    
    switch ($Mode) {
        "proxy" { }
        "webui" { $args += "--web-ui" }
        "metrics" { 
            $args += "--web-ui"
            $args += "--metrics-port"
            $args += "8080"
        }
        "dev" { $args += "--dev" }
    }
    
    python @args
}

# Boucle principale du menu
while ($true) {
    Show-Header
    Show-Menu
    
    $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    switch ($key.VirtualKeyCode) {
        38 { # Flèche haut
            if ($CurrentSelection -gt 0) { $CurrentSelection-- }
        }
        40 { # Flèche bas
            if ($CurrentSelection -lt ($Options.Count - 1)) { $CurrentSelection++ }
        }
        13 { # Entrée
            $action = $Options[$CurrentSelection].Action
            switch ($action) {
                "proxy" { Start-LlamaRunner -Mode "proxy" }
                "webui" { Start-LlamaRunner -Mode "webui" }
                "metrics" { Start-LlamaRunner -Mode "metrics" }
                "dev" { Start-LlamaRunner -Mode "dev" }
                "test" { Test-Environment }
                "install" { Install-Dependencies }
                "exit" { 
                    Clear-Host
                    Write-Host "Au revoir !" -ForegroundColor Cyan
                    exit 
                }
            }
        }
        27 { # Échap
            Clear-Host
            Write-Host "Au revoir !" -ForegroundColor Cyan
            exit
        }
    }
}