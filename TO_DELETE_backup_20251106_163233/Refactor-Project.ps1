#!/usr/bin/env powershell
# ===============================================================================
# 🔄 Professional Project Refactoring Script
# LlamaRunner Pro - Separation of Concerns Architecture
# Created by Bamer - Clean Architecture Implementation
# ===============================================================================

param(
    [switch]$DryRun,
    [switch]$Backup,
    [switch]$Force,
    [switch]$Help
)

function Show-Header {
    Clear-Host
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    🔄 PROJECT REFACTORING                     ║" -ForegroundColor Cyan
    Write-Host "║                  Separation of Concerns Architecture         ║" -ForegroundColor Cyan
    Write-Host "║                        by Bamer                               ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-Host "🎯 PROFESSIONAL PROJECT REFACTORING" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Ce script réorganise le projet selon l'architecture séparation des responsabilités:" -ForegroundColor White
    Write-Host ""
    Write-Host "📁 Architecture proposée:" -ForegroundColor Yellow
    Write-Host "  src/backend/core/        - Logique métier principale"
    Write-Host "  src/backend/services/    - Services et logique d'affaires"
    Write-Host "  src/backend/api/         - Points d'accès API REST"
    Write-Host "  src/backend/models/      - Modèles de données"
    Write-Host "  src/backend/proxy/       - Gestion des proxies AI"
    Write-Host "  src/backend/monitoring/  - Monitoring et métriques"
    Write-Host "  src/backend/patterns/    - Patterns de conception (Circuit Breaker, etc.)"
    Write-Host "  src/frontend/            - Interface utilisateur"
    Write-Host "  src/shared/              - Code partagé"
    Write-Host "  config/                  - Configuration"
    Write-Host "  scripts/                 - Scripts de lancement"
    Write-Host "  tests/                   - Tests organisés par type"
    Write-Host "  docs/                    - Documentation structurée"
    Write-Host "  tools/                   - Outils de déploiement"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -DryRun   : Afficher les changements sans les appliquer"
    Write-Host "  -Backup   : Créer une sauvegarde avant refactorisation"
    Write-Host "  -Force    : Forcer la refactorisation (pas de confirmations)"
    Write-Host "  -Help     : Afficher cette aide"
    Write-Host ""
    Write-Host "💡 Exemple d'utilisation:" -ForegroundColor Yellow
    Write-Host "  .\Refactor-Project.ps1 -Backup -DryRun"
    Write-Host "  .\Refactor-Project.ps1 -Backup"
    Write-Host ""
}

# ===============================================================================
# ARCHITECTURE MAPPING
# ===============================================================================

$ArchitectureMap = @{
    # Core Business Logic
    "llama_runner/main_window.py" = "src/backend/core/main_window.py"
    "llama_runner/llama_runner_manager.py" = "src/backend/core/runner_manager.py"
    "llama_runner/headless_service_manager.py" = "src/backend/core/service_manager.py"
    
    # Services Layer
    "llama_runner/config_loader.py" = "src/backend/services/config_service.py"
    "llama_runner/config_validator.py" = "src/backend/services/validation_service.py"
    "llama_runner/config_updater.py" = "src/backend/services/config_update_service.py"
    "llama_runner/audio_service.py" = "src/backend/services/audio_service.py"
    "llama_runner/error_handlers.py" = "src/backend/services/error_service.py"
    "llama_runner/metrics.py" = "src/backend/services/metrics_service.py"
    "llama_runner/model_status_widget.py" = "src/backend/services/model_status_service.py"
    
    # Proxy Layer
    "llama_runner/lmstudio_proxy_thread.py" = "src/backend/proxy/lmstudio_proxy.py"
    "llama_runner/ollama_proxy_thread.py" = "src/backend/proxy/ollama_proxy.py"
    "llama_runner/ollama_proxy_conversions.py" = "src/backend/proxy/conversion_service.py"
    "llama_runner/llama_cpp_runner.py" = "src/backend/proxy/llama_cpp_runner.py"
    "llama_runner/faster_whisper_runner.py" = "src/backend/proxy/whisper_runner.py"
    "llama_runner/gguf_metadata.py" = "src/backend/models/gguf_metadata.py"
    
    # API Layer
    "dashboard/src/main.py" = "src/backend/api/main_api.py"
    
    # Monitoring
    "llama_runner/metrics_server.py" = "src/backend/monitoring/metrics_server.py"
    "llama_runner/error_output_dialog.py" = "src/backend/monitoring/error_dialog.py"
    
    # Patterns
    "llama_runner/patterns/circuit_breaker.py" = "src/backend/patterns/circuit_breaker.py"
    
    # Frontend
    "src/assets/js/services/MetricsWebSocketService.js" = "src/frontend/services/metrics_service.js"
    "src/assets/js/stores/metrics.js" = "src/frontend/stores/metrics_store.js"
    "src/main.py" = "src/frontend/main.py"
    
    # Configuration
    "config.json" = "config/default/config.json"
    "config_prefilled.json" = "config/examples/config_prefilled.json"
    "config_prefilled_enhanced_with_comments.jsonc" = "config/examples/config_enhanced.jsonc"
    "config_prefilled_enhanced - Copie.json" = "config/examples/config_prefilled_copy.json"
    "requirements.txt" = "config/requirements.txt"
    
    # Scripts
    "Launch-LlamaRunner.ps1" = "scripts/launchers/Launch-LlamaRunner.ps1"
    "Launch-LlamaRunner.bat" = "scripts/launchers/Launch-LlamaRunner.bat"
    "Test-Launcher.ps1" = "scripts/validators/test_launcher.ps1"
    "Validate-System.ps1" = "scripts/validators/validate_system.ps1"
    "PortConfig.ps1" = "scripts/maintenance/port_config.ps1"
    
    # Tests
    "tests/test_*.py" = "tests/unit/test_*.py"
    "test_*.py" = "tests/unit/test_*.py"
    "tests/dummy_llama_server.py" = "tests/integration/dummy_llama_server.py"
    "tests/model1.gguf" = "tests/unit/test_model1.gguf"
    "tests/model2.gguf" = "tests/unit/test_model2.gguf"
    
    # Documentation
    "README.md" = "docs/user/README.md"
    "GUIDE_UTILISATION.md" = "docs/user/GUIDE_UTILISATION.md"
    "LICENSE" = "docs/user/LICENSE"
    "docs/*.md" = "docs/dev/*.md"
    
    # Main Entry Point
    "main.py" = "main.py"
}

# Files to exclude from refactoring
$ExcludeList = @(
    ".git",
    ".vscode",
    ".pytest_cache",
    "__pycache__",
    "dev-venv",
    ".continue",
    ".serena",
    "organized_project",
    "*.log",
    "*.pyc",
    "*.pyo",
    "*.egg-info",
    "node_modules",
    "dist",
    "build"
)

# ===============================================================================
# REFACTORING FUNCTIONS
# ===============================================================================

function Test-SourceExists {
    param([string]$Source)
    
    # Handle wildcards in source paths
    if ($Source -like "*\*") {
        return (Get-ChildItem -Path $Source -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
    } else {
        return Test-Path $Source
    }
}

function Get-TargetPath {
    param([string]$Source, [string]$Target)
    
    # If target contains wildcards, extract file name
    if ($Target -like "*\*.*") {
        $fileName = [System.IO.Path]::GetFileName($Source)
        $targetDir = [System.IO.Path]::GetDirectoryName($Target)
        return Join-Path $targetDir $fileName
    } else {
        return $Target
    }
}

function Copy-FileWithDirectories {
    param([string]$Source, [string]$Target, [switch]$Force)
    
    $targetDir = [System.IO.Path]::GetDirectoryName($Target)
    
    # Create target directory if it doesn't exist
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    # Copy file
    try {
        Copy-Item -Path $Source -Destination $Target -Force:$Force
        Write-Host "   ✅ Copied: $Source -> $Target" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ❌ Failed: $Source -> $Target" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Show-RefactoringPlan {
    param([hashtable]$Plan)
    
    Write-Host "📋 PLAN DE REFACTORISATION" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $totalFiles = 0
    $fileOperations = @{}
    
    foreach ($source in $Plan.Keys) {
        if (Test-SourceExists $source) {
            $target = $Plan[$source]
            $targetPath = Get-TargetPath -Source $source -Target $target
            
            # Count files for this operation
            if ($source -like "*\*") {
                $files = Get-ChildItem -Path $source -ErrorAction SilentlyContinue
                $fileCount = ($files | Measure-Object).Count
            } else {
                $fileCount = 1
            }
            
            $fileOperations[$source] = @{
                "target" = $targetPath
                "count" = $fileCount
            }
            $totalFiles += $fileCount
        }
    }
    
    Write-Host "📁 Fichiers à traiter: $totalFiles" -ForegroundColor White
    Write-Host ""
    
    $operationNum = 1
    foreach ($source in $fileOperations.Keys) {
        $operation = $fileOperations[$source]
        $target = $operation.target
        $count = $operation.count
        
        if ($count -eq 1) {
            Write-Host "$operationNum. 📄 $source" -ForegroundColor Yellow
            Write-Host "    -> $target" -ForegroundColor Gray
        } else {
            Write-Host "$operationNum. 📂 $source ($count files)" -ForegroundColor Yellow
            Write-Host "    -> $target" -ForegroundColor Gray
        }
        Write-Host ""
        $operationNum++
    }
}

function New-Backup {
    Write-Host "💾 Création de la sauvegarde..." -ForegroundColor Yellow
    
    $backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    # Copy all files except excluded ones
    $sourceDir = Get-Location
    Get-ChildItem -Path $sourceDir -Exclude $ExcludeList | ForEach-Object {
        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination (Join-Path $backupDir $_.Name) -Recurse -Force
        } else {
            Copy-Item -Path $_.FullName -Destination $backupDir -Force
        }
    }
    
    Write-Host "✅ Sauvegarde créée: $backupDir" -ForegroundColor Green
    return $backupDir
}

function Invoke-Refactoring {
    param([hashtable]$Plan, [switch]$Force)
    
    Write-Host "🚀 DÉBUT DE LA REFACTORISATION" -ForegroundColor Green
    Write-Host ""
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($source in $Plan.Keys) {
        if (Test-SourceExists $source) {
            $target = $Plan[$source]
            $targetPath = Get-TargetPath -Source $source -Target $target
            
            # Handle multiple files with wildcard
            if ($source -like "*\*") {
                $files = Get-ChildItem -Path $source -ErrorAction SilentlyContinue
                foreach ($file in $files) {
                    $fileTarget = Join-Path $targetPath $file.Name
                    if (Copy-FileWithDirectories -Source $file.FullName -Target $fileTarget -Force:$Force) {
                        $successCount++
                    } else {
                        $errorCount++
                    }
                }
            } else {
                # Single file
                if (Copy-FileWithDirectories -Source $source -Target $targetPath -Force:$Force) {
                    $successCount++
                } else {
                    $errorCount++
                }
            }
        } else {
            Write-Host "   ⚠️  Source non trouvé: $source" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "📊 RÉSULTATS DE LA REFACTORISATION" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "✅ Fichiers copiés: $successCount" -ForegroundColor Green
    Write-Host "❌ Erreurs: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    
    if ($errorCount -eq 0) {
        Write-Host ""
        Write-Host "🎉 REFACTORISATION TERMINÉE AVEC SUCCÈS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📁 Structure organisée créée dans le répertoire courant" -ForegroundColor White
        Write-Host "🔄 Utilisez maintenant la nouvelle structure pour développer" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "⚠️  REFACTORISATION TERMINÉE AVEC DES ERREURS" -ForegroundColor Yellow
        Write-Host "🔍 Vérifiez les erreurs ci-dessus" -ForegroundColor Yellow
    }
}

function New-ProjectStructure {
    Write-Host "🏗️  Création de la structure de base..." -ForegroundColor Yellow
    
    $directories = @(
        "src/backend/core",
        "src/backend/services", 
        "src/backend/api",
        "src/backend/models",
        "src/backend/proxy",
        "src/backend/monitoring",
        "src/backend/patterns",
        "src/frontend",
        "src/shared",
        "config/default",
        "config/examples",
        "scripts/launchers",
        "scripts/validators",
        "scripts/maintenance",
        "docs/api",
        "docs/user",
        "docs/dev",
        "tests/unit",
        "tests/integration",
        "tests/e2e",
        "tools/deployment",
        "tools/devops"
    )
    
    foreach ($dir in $directories) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   📁 $dir" -ForegroundColor Gray
    }
    
    Write-Host "✅ Structure de base créée" -ForegroundColor Green
}

# ===============================================================================
# MAIN EXECUTION
# ===============================================================================

if ($Help) {
    Show-Help
    exit 0
}

Show-Header

# Create base structure
New-ProjectStructure

Write-Host "🔍 ANALYSE DU PROJET EXISTANT..." -ForegroundColor Yellow
Write-Host ""

# Show refactoring plan
Show-RefactoringPlan -Plan $ArchitectureMap

if ($DryRun) {
    Write-Host "🧪 MODE SIMULATION - Aucun fichier n'a été modifié" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Pour appliquer les changements:" -ForegroundColor White
    Write-Host "  .\Refactor-Project.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Ask for confirmation unless Force is used
if (-not $Force) {
    Write-Host "❓ Voulez-vous continuer avec la refactorisation?" -ForegroundColor Yellow
    Write-Host "Cette opération va réorganiser les fichiers selon la nouvelle architecture." -ForegroundColor Gray
    $response = Read-Host "  Tapez 'oui' pour continuer, ou 'non' pour annuler"
    
    if ($response -ne "oui" -and $response -ne "o") {
        Write-Host "❌ Refactorisation annulée" -ForegroundColor Red
        exit 0
    }
}

# Create backup if requested
$backupDir = $null
if ($Backup) {
    $backupDir = New-Backup
    Write-Host ""
}

# Execute refactoring
Invoke-Refactoring -Plan $ArchitectureMap -Force:$Force

# Create documentation file
$docContent = "# LlamaRunner Pro - Project Structure" + [Environment]::NewLine + 
" " + [Environment]::NewLine +
"## Architecture de Reference" + [Environment]::NewLine +
" " + [Environment]::NewLine +
"Ce projet a ete refactorise selon les principes de separation des responsabilites (Separation of Concerns)." + [Environment]::NewLine +
" " + [Environment]::NewLine +
"### Structure des Repertoires" + [Environment]::NewLine +
" " + [Environment]::NewLine +
"- src/backend/core/ - Logique metier principale" + [Environment]::NewLine +
"- src/backend/services/ - Services et logique d'affaires" + [Environment]::NewLine +
"- src/backend/api/ - Points d'acces API REST" + [Environment]::NewLine +
"- src/backend/models/ - Modeles de donnees" + [Environment]::NewLine +
"- src/backend/proxy/ - Gestion des proxies AI" + [Environment]::NewLine +
"- src/backend/monitoring/ - Monitoring et metriques" + [Environment]::NewLine +
"- src/backend/patterns/ - Patterns de conception" + [Environment]::NewLine +
"- src/frontend/ - Interface utilisateur" + [Environment]::NewLine +
"- src/shared/ - Code partage" + [Environment]::NewLine +
"- config/ - Configuration" + [Environment]::NewLine +
"- scripts/ - Scripts de lancement" + [Environment]::NewLine +
"- tests/ - Tests organises par type" + [Environment]::NewLine +
"- docs/ - Documentation structuree" + [Environment]::NewLine +
"- tools/ - Outils de deploiement" + [Environment]::NewLine +
" " + [Environment]::NewLine +
"## Avantages de cette Architecture" + [Environment]::NewLine +
" " + [Environment]::NewLine +
"1. Separation des Responsabilites - Chaque module a une responsabilite claire" + [Environment]::NewLine +
"2. Maintenabilite - Code plus facile a maintenir et tester" + [Environment]::NewLine +
"3. Evolutivite - Facilite l'ajout de nouvelles fonctionnalités" + [Environment]::NewLine +
"4. Lisibilite - Structure claire et intuitive" + [Environment]::NewLine +
"5. Testabilite - Tests plus cibles et efficaces" + [Environment]::NewLine +
" " + [Environment]::NewLine +
"## Migration Completee" + [Environment]::NewLine +
" " + [Environment]::NewLine +
"Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

$docContent | Out-File -FilePath "docs/dev/ARCHITECTURE_REFERENCE.md" -Encoding UTF8
Write-Host "📚 Documentation de l'architecture créée: docs/dev/ARCHITECTURE_REFERENCE.md" -ForegroundColor Green

if ($backupDir) {
    Write-Host ""
    Write-Host "💾 Sauvegarde disponible dans: $backupDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 PROCHAINES ÉTAPES:" -ForegroundColor Magenta
Write-Host "1. Examinez la nouvelle structure" -ForegroundColor White
Write-Host "2. Mettez à jour les imports dans les fichiers Python" -ForegroundColor White  
Write-Host "3. Testez les fonctionnalités principales" -ForegroundColor White
Write-Host "4. Continuez le developpement avec l'architecture propre" -ForegroundColor White
Write-Host ""
