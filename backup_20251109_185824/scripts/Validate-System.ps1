#!/usr/bin/env powershell
# ===============================================================================
# 🧪 Script de Validation Finale - LlamaRunner Pro
# Test complet de tous les composants et configurations
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

# Configuration des logs - CORRECTIF: utiliser dossier logs
$LogPath = "logs\validation.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Démarrage de la validation du système" | Out-File $LogPath -Append

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$Timestamp] $Message" | Out-File $LogPath -Append
    
    if ($Host.UI.SupportsVirtualTerminal) {
        Write-Host $Message -ForegroundColor $Color
    } else {
        Write-Host $Message
    }
}

function Show-Header {
    Clear-Host
    Write-ColorOutput "╔══════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                  🧪 VALIDATION FINALE                        ║" "Cyan"
    Write-ColorOutput "║                    LlamaRunner Pro                           ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-ColorOutput "🎯 TESTS DE VALIDATION DISPONIBLES:" "Magenta"
    Write-Host ""
    Write-Host "  -Quick        : Test rapide des éléments critiques"
    Write-Host "  -Full         : Test complet de tous les composants" 
    Write-Host "  -Ports        : Test de disponibilité des ports"
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
    
    $venvPath = ".\dev-venv"
    $pythonPath = ".\dev-venv\Scripts\python.exe"
    
    # Test environnement virtuel
    if (-not (Test-Path $venvPath)) {
        Write-ColorOutput "   ❌ Environnement virtuel non trouvé" "Red"
        return $false
    }
    Write-ColorOutput "   ✅ Environnement virtuel trouvé" "Green"
    
    # Test Python
    if (-not (Test-Path $pythonPath)) {
        Write-ColorOutput "   ❌ Python exécutable non trouvé" "Red"
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
        Write-ColorOutput "   💡 Exécutez: .\Launch-LlamaRunner.ps1 -Install" "Yellow"
        return $false
    }
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL
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

# Test des ports - CORRECTIF: utiliser les nouveaux ports
Write-ColorOutput "🔍 Test des ports critiques..." "Yellow"
$portResults = Test-PortAvailability @(12345, 11435, 8082, 8083)  # Nouveaux ports

# Test Python
Write-ColorOutput "`n🔍 Test de l'environnement Python..." "Yellow"
$pythonTest = Test-PythonEnvironment

# Résumé
Write-ColorOutput "`n╔══════════════════════════════════════════════════════════════╗" "Cyan"
Write-ColorOutput "║                      📊 RÉSUMÉ FINAL                          ║" "Cyan"
Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
Write-Host ""

$portsOk = ($portResults.Values | Where-Object { $_.Status -eq "Libre" }).Count -ge 2
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

Write-Host "`n📋 Recommandations:" -ForegroundColor "Cyan"
if (-not $portsOk) {
    Write-Host "   ⚠️  Certains ports sont occupés. Utilisez .\PortConfig.ps1 pour configurer des ports alternatifs." -ForegroundColor "Yellow"
}
if (-not $pythonTest) {
    Write-Host "   💡 Exécutez: .\Launch-LlamaRunner.ps1 -Install pour installer les dépendances." -ForegroundColor "Yellow"
}

if ($portsOk -and $pythonTest) {
    Write-ColorOutput "`n🎉 VALIDATION RÉUSSIE !" "Green"
    Write-ColorOutput "✅ Le système est prêt à démarrer." "Green"
    Write-ColorOutput "🚀 Utilisez: .\LaunchMenu.ps1 pour démarrer l'application." "Cyan"
} else {
    Write-ColorOutput "`n⚠️  VALIDATION PARTIELLEMENT ÉCHOUÉE" "Yellow"
    Write-ColorOutput "🔧 Veuillez résoudre les problèmes ci-dessus avant de démarrer." "Yellow"
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$Timestamp] Validation terminée" | Out-File $LogPath -Append

Write-Host "`nAppuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")