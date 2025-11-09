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
            $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
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

function Test-ScriptsAvailability {
    Write-ColorOutput "`n📜 Test des scripts de lancement..." "Yellow"
    
    $scripts = @{
        ".\Launch-LlamaRunner.ps1" = "Script PowerShell principal"
        ".\Launch-LlamaRunner.bat" = "Script Batch Windows"
        ".\Test-Launcher.ps1" = "Script de test"
        ".\PortConfig.ps1" = "Configuration des ports"
    }
    
    $allScriptsFound = $true
    
    foreach ($script in $scripts.Keys) {
        if (Test-Path $script) {
            Write-ColorOutput "   ✅ $($scripts[$script])" "Green"
        } else {
            Write-ColorOutput "   ❌ $($scripts[$script]) - Non trouvé" "Red"
            $allScriptsFound = $false
        }
    }
    
    return $allScriptsFound
}

function Test-ConfigurationFiles {
    Write-ColorOutput "`n⚙️  Test des fichiers de configuration..." "Yellow"
    
    $configs = @(
        ".\config.json",
        ".\config_prefilled.json", 
        ".\config_prefilled_enhanced.jsonc"
    )
    
    $foundConfigs = 0
    
    foreach ($config in $configs) {
        if (Test-Path $config) {
            Write-ColorOutput "   ✅ $config trouvé" "Green"
            $foundConfigs++
        } else {
            Write-ColorOutput "   ⚠️  $config non trouvé" "Yellow"
        }
    }
    
    if ($foundConfigs -eq 0) {
        Write-ColorOutput "   ❌ Aucun fichier de configuration trouvé" "Red"
        return $false
    } elseif ($foundConfigs -eq 1) {
        Write-ColorOutput "   ⚠️  Un seul fichier de configuration trouvé" "Yellow"
        return $true
    } else {
        Write-ColorOutput "   ✅ Plusieurs fichiers de configuration disponibles" "Green"
        return $true
    }
}

function Test-DocumentationFiles {
    Write-ColorOutput "`n📚 Test de la documentation..." "Yellow"
    
    $docs = @(
        ".\README.md",
        ".\GUIDE_UTILISATION.md"
    )
    
    $allDocsFound = $true
    
    foreach ($doc in $docs) {
        if (Test-Path $doc) {
            $size = (Get-Item $doc).Length
            Write-ColorOutput "   ✅ $doc ($size bytes)" "Green"
        } else {
            Write-ColorOutput "   ❌ $doc - Non trouvé" "Red"
            $allDocsFound = $false
        }
    }
    
    return $allDocsFound
}

function Test-RequirementsFile {
    Write-ColorOutput "`n📋 Test du fichier requirements.txt..." "Yellow"
    
    if (-not (Test-Path ".\requirements.txt")) {
        Write-ColorOutput "   ❌ requirements.txt non trouvé" "Red"
        return $false
    }
    
    $content = Get-Content ".\requirements.txt"
    
    # Vérifier les dépendances critiques
    $criticalDeps = @("websockets", "psutil", "fastapi", "uvicorn", "PySide6")
    $missingDeps = @()
    
    foreach ($dep in $criticalDeps) {
        if ($content -match $dep) {
            Write-ColorOutput "   ✅ $dep trouvé dans requirements.txt" "Green"
        } else {
            Write-ColorOutput "   ❌ $dep manquant dans requirements.txt" "Red"
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -eq 0) {
        Write-ColorOutput "   ✅ Toutes les dépendances critiques présentes" "Green"
        return $true
    } else {
        Write-ColorOutput "   ❌ Dépendances manquantes: $($missingDeps -join ', ')" "Red"
        return $false
    }
}

function Show-PortConfiguration {
    Write-ColorOutput "`n📡 CONFIGURATION DES PORTS" "Cyan"
    Write-Host "=" * 50 -ForegroundColor "Cyan"
    
    $ports = @{
        8080 = "Dashboard Monitoring (Temps Réel)"
        8081 = "Interface Web Utilisateur" 
        1234 = "API LM Studio Compatible"
        11434 = "API Ollama Compatible"
    }
    
    foreach ($port in $ports.Keys) {
        $description = $ports[$port]
        Write-Host "   $port - $description" -ForegroundColor "White"
    }
    
    Write-Host ""
    Write-ColorOutput "💡 Ports 8080 et 8081 remplacent 8585 et 3000" "Yellow"
    Write-ColorOutput "   Évite les conflits avec d'autres services" "Yellow"
    Write-Host ""
}

function Show-Summary {
    param([hashtable]$TestResults)
    
    Write-ColorOutput "`n╔══════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║                      📊 RÉSUMÉ FINAL                          ║" "Cyan"
    Write-ColorOutput "╚══════════════════════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
    
    $totalTests = $TestResults.Count
    $passedTests = ($TestResults.Values | Where-Object { $_ -eq $true }).Count
    $failedTests = $totalTests - $passedTests
    
    Write-Host "Tests effectués: $totalTests" -ForegroundColor "White"
    Write-Host "Tests réussis: $passedTests" -ForegroundColor "Green"
    Write-Host "Tests échoués: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
    Write-Host ""
    
    if ($failedTests -eq 0) {
        Write-ColorOutput "🎉 TOUS LES TESTS SONT PASSÉS!" "Green"
        Write-ColorOutput "✅ Le système est prêt à l'emploi" "Green"
        Write-Host ""
        Write-ColorOutput "🚀 Pour commencer:" "Cyan"
        Write-Host "   .\Launch-LlamaRunner.ps1" -ForegroundColor "White"
        Write-Host ""
        Write-ColorOutput "📊 Services disponibles:" "Cyan"
        Write-Host "   Dashboard: http://localhost:8080" -ForegroundColor "White"
        Write-Host "   Web UI: http://localhost:8081" -ForegroundColor "White"  
        Write-Host "   LM Studio: http://localhost:1234" -ForegroundColor "White"
        Write-Host "   Ollama: http://localhost:11434" -ForegroundColor "White"
    } else {
        Write-ColorOutput "⚠️  CERTAINS TESTS ONT ÉCHOUÉ" "Yellow"
        Write-ColorOutput "💡 Vérifiez les recommandations ci-dessus" "Yellow"
        Write-Host ""
        Write-ColorOutput "🔧 Actions recommandées:" "Cyan"
        Write-Host "   1. .\Launch-LlamaRunner.ps1 -Install" -ForegroundColor "White"
        Write-Host "   2. Vérifiez la configuration" -ForegroundColor "White"
        Write-Host "   3. Relancez les tests" -ForegroundColor "White"
    }
    
    Write-Host ""
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ===============================================================================

if ($Help) {
    Show-Help
    exit 0
}

Show-Header

# Configuration des tests
$TestResults = @{}

# Test des ports
if ($Quick -or $Full -or (-not $Ports -and -not $Dependencies -and -not $Scripts -and -not $Config)) {
    Show-PortConfiguration
    $portResults = Test-PortAvailability @(8080, 8081, 1234, 11434)
    $TestResults["Ports"] = ($portResults.Values | Where-Object { $_.Status -eq "Libre" }).Count -ge 2
}

# Test de l'environnement Python
if ($Full -or $Dependencies -or (-not $Ports -and -not $Scripts -and -not $Config)) {
    $TestResults["Dependencies"] = Test-PythonEnvironment
}

# Test des scripts
if ($Full -or $Scripts -or (-not $Ports -and -not $Dependencies -and -not $Config)) {
    $TestResults["Scripts"] = Test-ScriptsAvailability
}

# Test de la configuration
if ($Full -or $Config -or (-not $Ports -and -not $Dependencies -and -not $Scripts)) {
    $TestResults["Configuration"] = Test-ConfigurationFiles
    $TestResults["Documentation"] = Test-DocumentationFiles
    $TestResults["Requirements"] = Test-RequirementsFile
}

# Résumé final
Show-Summary -TestResults $TestResults

exit ($TestResults.Values | Where-Object { $_ -eq $false }).Count
