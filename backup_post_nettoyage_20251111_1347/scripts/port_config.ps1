#!/usr/bin/env powershell
# ===============================================================================
# 🌐 PortConfig.ps1 - Configuration des Ports LlamaRunner
# Gestion intelligente des ports pour éviter les conflits
# ===============================================================================

param(
    [switch]$List,
    [switch]$Set,
    [switch]$Reset,
    [switch]$Test,
    [switch]$Help,
    [int]$CustomPort
)

$ConfigFile = "config/port_config.json"
$DefaultPorts = @{
    LmStudio = 12345    # CORRECTIF: Nouveau port
    Ollama = 11435      # CORRECTIF: Nouveau port  
    WebUI = 8082        # CORRECTIF: Nouveau port
    Dashboard = 8083    # CORRECTIF: Nouveau port
    Whisper = 9090
}

# CORRECTIF: Créer le dossier logs si nécessaire
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# CORRECTIF: Utiliser le dossier logs pour les logs
$LogPath = "logs\port_config.log"

function Write-PortConfigLog {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $Message" | Out-File $LogPath -Append -Encoding UTF8
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
    Write-ColorOutput "║                    🌐 PORT CONFIGURATOR                       ║" "Cyan"
    Write-ColorOutput "║                  LlamaRunner Pro - Ports                      ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-ColorOutput "🎯 OPTIONS DE CONFIGURATION DES PORTS:" "Magenta"
    Write-Host ""
    Write-Host "  -List       : Affiche la configuration actuelle des ports"
    Write-Host "  -Set        : Configure les ports (mode interactif)"
    Write-Host "  -Reset      : Réinitialise aux ports par défaut"
    Write-Host "  -Test       : Teste la disponibilité des ports"
    Write-Host "  -CustomPort : Spécifie un port personnalisé pour test"
    Write-Host ""
    Write-Host "Exemples:"
    Write-Host "  .\scripts\PortConfig.ps1 -List"
    Write-Host "  .\scripts\PortConfig.ps1 -Set"
    Write-Host "  .\scripts\PortConfig.ps1 -Test -CustomPort 8080"
    Write-Host ""
}

function Test-PortAvailability {
    param([int]$Port)
    
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        return -not $connection.TcpTestSucceeded
    } catch {
        return $true
    }
}

function Get-CurrentPortConfig {
    if (Test-Path $ConfigFile) {
        return Get-Content $ConfigFile | ConvertFrom-Json
    } else {
        return $DefaultPorts
    }
}

function Save-PortConfig {
    param([hashtable]$Config)
    
    # CORRECTIF: Créer le dossier config si nécessaire
    if (-not (Test-Path "config")) {
        New-Item -ItemType Directory -Path "config" -Force | Out-Null
    }
    
    $Config | ConvertTo-Json | Out-File $ConfigFile
    Write-ColorOutput "✅ Configuration des ports sauvegardée" "Green"
    Write-PortConfigLog "Configuration ports sauvegardée: $($Config | ConvertTo-Json)"
}

function Show-CurrentConfig {
    $config = Get-CurrentPortConfig
    
    Write-ColorOutput "📊 CONFIGURATION ACTUELLE DES PORTS:" "Cyan"
    Write-Host "=" * 50 -ForegroundColor "Cyan"
    
    Write-Host "   LM Studio API:" -NoNewline -ForegroundColor "White"
    Write-Host "    $($config.LmStudio)" -ForegroundColor "Green"
    
    Write-Host "   Ollama API:" -NoNewline -ForegroundColor "White" 
    Write-Host "      $($config.Ollama)" -ForegroundColor "Green"
    
    Write-Host "   Interface Web:" -NoNewline -ForegroundColor "White"
    Write-Host "    $($config.WebUI)" -ForegroundColor "Green"
    
    Write-Host "   Dashboard:" -NoNewline -ForegroundColor "White"
    Write-Host "       $($config.Dashboard)" -ForegroundColor "Green"
    
    Write-Host "   Whisper Server:" -NoNewline -ForegroundColor "White"
    Write-Host "  $($config.Whisper)" -ForegroundColor "Green"
    
    Write-PortConfigLog "Configuration actuelle affichée"
    Write-Host ""
}

function Test-AllPorts {
    $config = Get-CurrentPortConfig
    
    Write-ColorOutput "🔍 TEST DE DISPONIBILITÉ DES PORTS:" "Yellow"
    
    $portsToTest = @{
        "LM Studio" = $config.LmStudio
        "Ollama" = $config.Ollama
        "Web UI" = $config.WebUI
        "Dashboard" = $config.Dashboard
        "Whisper" = $config.Whisper
    }
    
    foreach ($service in $portsToTest.Keys) {
        $port = $portsToTest[$service]
        $available = Test-PortAvailability $port
        
        if ($available) {
            Write-ColorOutput "   ✅ $service ($port): Disponible" "Green"
            Write-PortConfigLog "Port $port disponible pour $service"
        } else {
            Write-ColorOutput "   ❌ $service ($port): Occupé" "Red"
            Write-PortConfigLog "Port $port occupé pour $service"
        }
    }
}

function Set-PortsInteractively {
    $config = Get-CurrentPortConfig
    
    Show-Header
    Write-ColorOutput "🎮 CONFIGURATION INTERACTIVE DES PORTS" "Magenta"
    Write-Host ""
    
    # LM Studio Port
    Write-ColorOutput "📡 Port pour LM Studio API (défaut: $($DefaultPorts.LmStudio)):" "Yellow"
    $newPort = Read-Host "Entrez le port ou laissez vide pour garder le défaut"
    if ($newPort -and $newPort -match '^\d+$') {
        $config.LmStudio = [int]$newPort
        Write-PortConfigLog "Port LM Studio changé à: $newPort"
    }
    
    # Ollama Port
    Write-ColorOutput "`n🦙 Port pour Ollama API (défaut: $($DefaultPorts.Ollama)):" "Yellow"
    $newPort = Read-Host "Entrez le port ou laissez vide pour garder le défaut"
    if ($newPort -and $newPort -match '^\d+$') {
        $config.Ollama = [int]$newPort
        Write-PortConfigLog "Port Ollama changé à: $newPort"
    }
    
    # Web UI Port
    Write-ColorOutput "`n🌐 Port pour l'Interface Web (défaut: $($DefaultPorts.WebUI)):" "Yellow"
    $newPort = Read-Host "Entrez le port ou laissez vide pour garder le défaut"
    if ($newPort -and $newPort -match '^\d+$') {
        $config.WebUI = [int]$newPort
        Write-PortConfigLog "Port Web UI changé à: $newPort"
    }
    
    # Dashboard Port
    Write-ColorOutput "`n📊 Port pour le Dashboard (défaut: $($DefaultPorts.Dashboard)):" "Yellow"
    $newPort = Read-Host "Entrez le port ou laissez vide pour garder le défaut"
    if ($newPort -and $newPort -match '^\d+$') {
        $config.Dashboard = [int]$newPort
        Write-PortConfigLog "Port Dashboard changé à: $newPort"
    }
    
    # Whisper Port
    Write-ColorOutput "`n🎤 Port pour Whisper Server (défaut: $($DefaultPorts.Whisper)):" "Yellow"
    $newPort = Read-Host "Entrez le port ou laissez vide pour garder le défaut"
    if ($newPort -and $newPort -match '^\d+$') {
        $config.Whisper = [int]$newPort
        Write-PortConfigLog "Port Whisper changé à: $newPort"
    }
    
    Save-PortConfig $config
    Write-Host ""
    Write-ColorOutput "✅ Configuration mise à jour!" "Green"
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ===============================================================================

if ($Help) {
    Show-Help
    exit 0
}

# CORRECTIF: Créer le dossier config si nécessaire
if (-not (Test-Path "config")) {
    New-Item -ItemType Directory -Path "config" -Force | Out-Null
}

Show-Header

if ($List) {
    Show-CurrentConfig
    exit 0
}

if ($Test) {
    if ($CustomPort) {
        $available = Test-PortAvailability $CustomPort
        if ($available) {
            Write-ColorOutput "✅ Port $CustomPort est disponible" "Green"
            Write-PortConfigLog "Port $CustomPort testé et disponible"
        } else {
            Write-ColorOutput "❌ Port $CustomPort est occupé" "Red"
            Write-PortConfigLog "Port $CustomPort testé et occupé"
        }
    } else {
        Test-AllPorts
    }
    exit 0
}

if ($Reset) {
    $DefaultPorts | ConvertTo-Json | Out-File $ConfigFile
    Write-ColorOutput "🔄 Ports réinitialisés aux valeurs par défaut" "Green"
    Write-PortConfigLog "Ports réinitialisés aux valeurs par défaut"
    Show-CurrentConfig
    exit 0
}

if ($Set) {
    Set-PortsInteractively
    exit 0
}

# Mode interactif par défaut
Write-ColorOutput "🎯 MENU PRINCIPAL - CONFIGURATION DES PORTS" "Magenta"
Write-Host ""
Write-Host "1. Afficher la configuration actuelle"
Write-Host "2. Tester la disponibilité des ports"
Write-Host "3. Configurer les ports (mode interactif)"
Write-Host "4. Réinitialiser aux ports par défaut"
Write-Host "5. Quitter"
Write-Host ""

$choice = Read-Host "Sélectionnez une option (1-5)"

switch ($choice) {
    "1" { Show-CurrentConfig }
    "2" { Test-AllPorts }
    "3" { Set-PortsInteractively }
    "4" { 
        $DefaultPorts | ConvertTo-Json | Out-File $ConfigFile
        Write-ColorOutput "🔄 Ports réinitialisés aux valeurs par défaut" "Green"
        Write-PortConfigLog "Ports réinitialisés aux valeurs par défaut (menu interactif)"
        Show-CurrentConfig
    }
    "5" { 
        Write-ColorOutput "👋 Au revoir!" "Cyan"
        Write-PortConfigLog "Menu fermé par l'utilisateur"
    }
    default { 
        Write-ColorOutput "❌ Option invalide" "Red"
        Write-PortConfigLog "Option invalide sélectionnée: $choice"
    }
}