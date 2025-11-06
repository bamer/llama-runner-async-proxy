#!/usr/bin/env powershell
# ===============================================================================
# Clean Professional Project Refactoring Script
# ===============================================================================

param(
    [switch]$DryRun,
    [switch]$Backup,
    [switch]$Force,
    [switch]$Help
)

function Show-Header {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "PROJECT REFACTORING" -ForegroundColor Cyan
    Write-Host "Separation of Concerns Architecture" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-Host "PROFESSIONAL PROJECT REFACTORING"
    Write-Host ""
    Write-Host "This script reorganizes the project according to separation of concerns architecture:"
    Write-Host ""
    Write-Host "Architecture Structure:"
    Write-Host "  src/backend/core/        - Main business logic"
    Write-Host "  src/backend/services/    - Services and business logic"
    Write-Host "  src/backend/api/         - REST API endpoints"
    Write-Host "  src/backend/models/      - Data models"
    Write-Host "  src/backend/proxy/       - AI proxy management"
    Write-Host "  src/backend/monitoring/  - Monitoring and metrics"
    Write-Host "  src/backend/patterns/    - Design patterns (Circuit Breaker, etc.)"
    Write-Host "  src/frontend/            - User interface"
    Write-Host "  src/shared/              - Shared code"
    Write-Host "  config/                  - Configuration"
    Write-Host "  scripts/                 - Launch scripts"
    Write-Host "  tests/                   - Tests organized by type"
    Write-Host "  docs/                    - Structured documentation"
    Write-Host "  tools/                   - Deployment tools"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -DryRun   : Show changes without applying"
    Write-Host "  -Backup   : Create backup before refactoring"
    Write-Host "  -Force    : Force refactoring (no confirmations)"
    Write-Host "  -Help     : Show this help"
    Write-Host ""
    Write-Host "Example usage:"
    Write-Host "  .\Refactor-Project-Clean.ps1 -Backup -DryRun"
    Write-Host "  .\Refactor-Project-Clean.ps1 -Backup"
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
    "tests/test_config_updater.py" = "tests/unit/test_config_updater.py"
    "tests/test_llama_runner_manager.py" = "tests/unit/test_llama_runner_manager.py"
    "tests/test_metrics_validation.py" = "tests/unit/test_metrics_validation.py"
    
    # Documentation
    "README.md" = "docs/user/README.md"
    "GUIDE_UTILISATION.md" = "docs/user/GUIDE_UTILISATION.md"
    "LICENSE" = "docs/user/LICENSE"
    
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
    
    return Test-Path $Source
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
        Write-Host "   OK: Copied $Source -> $Target" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ERROR: Failed $Source -> $Target" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Show-RefactoringPlan {
    param([hashtable]$Plan)
    
    Write-Host "REFACTORING PLAN" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $totalFiles = 0
    $fileOperations = @()
    
    foreach ($source in $Plan.Keys) {
        if (Test-SourceExists $source) {
            $target = $Plan[$source]
            
            $fileOperations += [PSCustomObject]@{
                Source = $source
                Target = $target
                Exists = $true
            }
            $totalFiles++
        }
    }
    
    Write-Host "Files to process: $totalFiles" -ForegroundColor White
    Write-Host ""
    
    $operationNum = 1
    foreach ($operation in $fileOperations) {
        Write-Host "$operationNum. FILE $($operation.Source)" -ForegroundColor Yellow
        Write-Host "    -> $($operation.Target)" -ForegroundColor Gray
        Write-Host ""
        $operationNum++
    }
}

function New-Backup {
    Write-Host "Creating backup..." -ForegroundColor Yellow
    
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
    
    Write-Host "Backup created: $backupDir" -ForegroundColor Green
    return $backupDir
}

function Invoke-Refactoring {
    param([hashtable]$Plan, [switch]$Force)
    
    Write-Host "STARTING REFACTORING" -ForegroundColor Green
    Write-Host ""
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($source in $Plan.Keys) {
        if (Test-SourceExists $source) {
            $target = $Plan[$source]
            
            if (Copy-FileWithDirectories -Source $source -Target $target -Force:$Force) {
                $successCount++
            } else {
                $errorCount++
            }
        } else {
            Write-Host "   WARNING: Source not found: $source" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "REFACTORING RESULTS" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "Files copied: $successCount" -ForegroundColor Green
    Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    
    if ($errorCount -eq 0) {
        Write-Host ""
        Write-Host "REFACTORING COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Organized structure created in current directory" -ForegroundColor White
        Write-Host "Use the new structure for development" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "REFACTORING COMPLETED WITH ERRORS" -ForegroundColor Yellow
        Write-Host "Check the errors above" -ForegroundColor Yellow
    }
}

function New-ProjectStructure {
    Write-Host "Creating base structure..." -ForegroundColor Yellow
    
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
        Write-Host "   DIR $dir" -ForegroundColor Gray
    }
    
    Write-Host "Base structure created" -ForegroundColor Green
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

Write-Host "ANALYZING EXISTING PROJECT..." -ForegroundColor Yellow
Write-Host ""

# Show refactoring plan
Show-RefactoringPlan -Plan $ArchitectureMap

if ($DryRun) {
    Write-Host "SIMULATION MODE - No files have been modified" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "To apply changes:" -ForegroundColor White
    Write-Host "  .\Refactor-Project-Clean.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Ask for confirmation unless Force is used
if (-not $Force) {
    Write-Host "Do you want to continue with refactoring?" -ForegroundColor Yellow
    Write-Host "This operation will reorganize files according to the new architecture." -ForegroundColor Gray
    $response = Read-Host "Type 'yes' to continue, or 'no' to cancel"
    
    if ($response -ne "yes" -and $response -ne "y") {
        Write-Host "Refactoring cancelled" -ForegroundColor Red
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
[Environment]::NewLine +
"## Architecture Reference" + [Environment]::NewLine +
[Environment]::NewLine +
"This project has been refactored according to separation of concerns principles." + [Environment]::NewLine +
[Environment]::NewLine +
"### Directory Structure" + [Environment]::NewLine +
[Environment]::NewLine +
"- src/backend/core/ - Main business logic" + [Environment]::NewLine +
"- src/backend/services/ - Services and business logic" + [Environment]::NewLine +
"- src/backend/api/ - REST API endpoints" + [Environment]::NewLine +
"- src/backend/models/ - Data models" + [Environment]::NewLine +
"- src/backend/proxy/ - AI proxy management" + [Environment]::NewLine +
"- src/backend/monitoring/ - Monitoring and metrics" + [Environment]::NewLine +
"- src/backend/patterns/ - Design patterns" + [Environment]::NewLine +
"- src/frontend/ - User interface" + [Environment]::NewLine +
"- src/shared/ - Shared code" + [Environment]::NewLine +
"- config/ - Configuration" + [Environment]::NewLine +
"- scripts/ - Launch scripts" + [Environment]::NewLine +
"- tests/ - Tests organized by type" + [Environment]::NewLine +
"- docs/ - Structured documentation" + [Environment]::NewLine +
"- tools/ - Deployment tools" + [Environment]::NewLine +
[Environment]::NewLine +
"## Benefits of this Architecture" + [Environment]::NewLine +
[Environment]::NewLine +
"1. Separation of Concerns - Each module has a clear responsibility" + [Environment]::NewLine +
"2. Maintainability - Code easier to maintain and test" + [Environment]::NewLine +
"3. Scalability - Easier to add new features" + [Environment]::NewLine +
"4. Readability - Clear and intuitive structure" + [Environment]::NewLine +
"5. Testability - More targeted and effective tests" + [Environment]::NewLine +
[Environment]::NewLine +
"## Migration Completed" + [Environment]::NewLine +
[Environment]::NewLine +
"Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

$docContent | Out-File -FilePath "docs/dev/ARCHITECTURE_REFERENCE.md" -Encoding UTF8
Write-Host "Architecture documentation created: docs/dev/ARCHITECTURE_REFERENCE.md" -ForegroundColor Green

if ($backupDir) {
    Write-Host ""
    Write-Host "Backup available in: $backupDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Review the new structure" -ForegroundColor White
Write-Host "2. Update imports in Python files" -ForegroundColor White  
Write-Host "3. Test main functionality" -ForegroundColor White
Write-Host "4. Continue development with clean architecture" -ForegroundColor White
Write-Host ""