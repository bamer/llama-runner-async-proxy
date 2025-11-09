#!/usr/bin/env powershell
# ===============================================================================
# Simple PowerShell Launch Script - Llama Runner
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

function Show-Header {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "          LLAMA RUNNER - LAUNCHER SIMPLE" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-System {
    Write-Host "=== SYSTEM TESTS ===" -ForegroundColor Yellow
    Write-Host ""
    
    # Test Python
    Write-Host "Testing Python..." -NoNewline
    try {
        $pythonVersion = & python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " OK - $pythonVersion" -ForegroundColor Green
        } else {
            Write-Host " FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
    }
    
    # Test Configuration
    Write-Host "Testing configuration..." -NoNewline
    if (Test-Path $Config) {
        Write-Host " OK - $Config found" -ForegroundColor Green
    } else {
        Write-Host " FAILED - $Config missing" -ForegroundColor Red
        Write-Host "  Copy config/examples/basic.json to config/app_config.json" -ForegroundColor Yellow
    }
    
    # Test imports
    Write-Host "Testing Python imports..." -NoNewline
    $importTest = & python -c "
import sys
sys.path.append('.')
try:
    import llama_runner.gguf_metadata
    import llama_runner.lmstudio_proxy_thread
    print(' OK - All modules import successfully')
    print(f'gguf available: {llama_runner.gguf_metadata.gguf_available}')
except Exception as e:
    print(' FAILED')
    print(f'Error: {e}')
" 2>&1
    
    Write-Host $importTest
    Write-Host ""
    Write-Host "=== TESTS COMPLETED ===" -ForegroundColor Yellow
}

function Install-Dependencies {
    Write-Host "=== INSTALLING DEPENDENCIES ===" -ForegroundColor Yellow
    Write-Host ""
    
    $packages = @(
        "fastapi", "uvicorn[standard]", "qasync", "PySide6", 
        "websocket-client", "faster-whisper", "llama-cpp-python", 
        "requests", "pytest", "pytest-asyncio", "gguf"
    )
    
    foreach ($package in $packages) {
        Write-Host "Installing $package..." -NoNewline
        try {
            & pip install $package 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host " OK" -ForegroundColor Green
            } else {
                Write-Host " FAILED" -ForegroundColor Red
            }
        } catch {
            Write-Host " FAILED" -ForegroundColor Red
        }
    }
    Write-Host ""
    Write-Host "=== INSTALLATION COMPLETED ===" -ForegroundColor Yellow
}

function Start-Application {
    param(
        [string]$Mode = "proxy"
    )
    
    Write-Host "=== STARTING APPLICATION ===" -ForegroundColor Yellow
    Write-Host "Mode: $Mode" -ForegroundColor Cyan
    Write-Host "Config: $Config" -ForegroundColor Cyan
    Write-Host "Log Level: $LogLevel" -ForegroundColor Cyan
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

if ($Test) {
    Test-System
    exit 0
}

if ($Install) {
    Install-Dependencies
    exit 0
}

# Determine mode
$Mode = "proxy"
if ($WebUI) { $Mode = "webui" }
if ($Metrics) { $Mode = "metrics" }
if ($Dev) { $Mode = "dev" }

Start-Application -Mode $Mode