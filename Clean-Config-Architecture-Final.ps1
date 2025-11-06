#!/usr/bin/env powershell
# ===============================================================================
# Clean Config Architecture - Portability Enhancement
# ===============================================================================

param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Help
)

function Show-Header {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "CLEAN CONFIG ARCHITECTURE - PORTABILITY ENHANCEMENT" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-Host "ENHANCEMENT OBJECTIVES:"
    Write-Host "  - Create dedicated config/ directory for all configuration files"
    Write-Host "  - Create dedicated logs/ directory for all log files"
    Write-Host "  - Clean up confusing file names"
    Write-Host "  - Ensure project portability (no user space pollution)"
    Write-Host ""
    Write-Host "NEW ARCHITECTURE:"
    Write-Host "  config/"
    Write-Host "    app_config.json      - Main application configuration"
    Write-Host "    examples/"
    Write-Host "      basic.json        - Basic configuration example"
    Write-Host "      advanced.json     - Advanced configuration example"
    Write-Host "      full.json         - Full configuration example"
    Write-Host "    schemas/"
    Write-Host "      config_schema.json - Configuration validation schema"
    Write-Host "  logs/"
    Write-Host "    app.log              - Application logs"
    Write-Host "    error.log            - Error logs"
    Write-Host "    debug.log            - Debug logs"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -DryRun   : Show changes without applying"
    Write-Host "  -Force    : Force reorganization (no confirmations)"
    Write-Host "  -Help     : Show this help"
    Write-Host ""
    Write-Host "Example usage:"
    Write-Host "  .\Clean-Config-Architecture.ps1 -DryRun"
    Write-Host "  .\Clean-Config-Architecture.ps1"
    Write-Host ""
}

# ===============================================================================
# CONFIG CLEANUP OPERATIONS
# ===============================================================================

$ConfigCleanup = @{
    # Main configuration file
    "config/default/config.json" = "config/app_config.json"
    
    # Clean example files (remove confusing names)
    "config/examples/config_prefilled.json" = "config/examples/basic.json"
    "config/examples/config_enhanced.jsonc" = "config/examples/advanced.json"
    "config/examples/config_prefilled_copy.json" = "config/examples/full.json"
    
    # Copy requirements to config
    "config/requirements.txt" = "config/app_requirements.txt"
    
    # Remove old redundant files
    "config_prefilled.json" = $null
    "config_prefilled_enhanced_with_comments.jsonc" = $null
    "config_prefilled_enhanced - Copie.json" = $null
}

$LogDirectories = @(
    "logs",
    "logs/archive"
)

# ===============================================================================
# CLEANUP FUNCTIONS
# ===============================================================================

function New-CleanArchitecture {
    param([hashtable]$CleanupMap, [array]$LogDirs, [switch]$Force)
    
    Write-Host "Creating clean config architecture..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create log directories
    foreach ($logDir in $LogDirs) {
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
            Write-Host "   DIR: $logDir" -ForegroundColor Green
        }
    }
    
    # Create example and schema directories
    $configSubDirs = @("config/examples", "config/schemas")
    foreach ($subDir in $configSubDirs) {
        if (-not (Test-Path $subDir)) {
            New-Item -ItemType Directory -Path $subDir -Force | Out-Null
            Write-Host "   DIR: $subDir" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "Processing configuration files..." -ForegroundColor Yellow
    
    $successCount = 0
    $errorCount = 0
    $removedCount = 0
    
    foreach ($source in $CleanupMap.Keys) {
        $target = $CleanupMap[$source]
        
        if ($target -eq $null) {
            # Remove file
            if (Test-Path $source) {
                try {
                    Remove-Item $source -Force
                    Write-Host "   REMOVED: $source" -ForegroundColor Yellow
                    $removedCount++
                } catch {
                    Write-Host "   ERROR: Failed to remove $source" -ForegroundColor Red
                    $errorCount++
                }
            }
        } else {
            # Copy/move file
            if (Test-Path $source) {
                $targetDir = [System.IO.Path]::GetDirectoryName($target)
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                
                try {
                    Copy-Item -Path $source -Destination $target -Force
                    Write-Host "   MOVED: $source -> $target" -ForegroundColor Green
                    $successCount++
                } catch {
                    Write-Host "   ERROR: Failed to move $source -> $target" -ForegroundColor Red
                    $errorCount++
                }
            } else {
                Write-Host "   SKIP: Source not found $source" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "CLEANUP RESULTS" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "Files reorganized: $successCount" -ForegroundColor Green
    Write-Host "Files removed: $removedCount" -ForegroundColor Yellow
    Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
    
    if ($errorCount -eq 0) {
        Write-Host ""
        Write-Host "CONFIG CLEANUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host ""
        Write-Host "New clean architecture:" -ForegroundColor White
        Write-Host "  - All config files in config/ directory" -ForegroundColor Gray
        Write-Host "  - All log files in logs/ directory" -ForegroundColor Gray
        Write-Host "  - No confusing file names" -ForegroundColor Gray
        Write-Host "  - Project is now portable" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "CLEANUP COMPLETED WITH ERRORS" -ForegroundColor Yellow
    }
}

function Show-CleanupPlan {
    param([hashtable]$Plan)
    
    Write-Host "CONFIG CLEANUP PLAN" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $reorganizationCount = 0
    $removalCount = 0
    
    foreach ($source in $Plan.Keys) {
        $target = $Plan[$source]
        
        if ($target -eq $null) {
            Write-Host "REMOVE: $source" -ForegroundColor Red
            $removalCount++
        } else {
            Write-Host "MOVE: $source" -ForegroundColor Yellow
            Write-Host "    -> $target" -ForegroundColor Gray
            $reorganizationCount++
        }
        Write-Host ""
    }
    
    Write-Host "Summary:" -ForegroundColor White
    Write-Host "  - Files to reorganize: $reorganizationCount" -ForegroundColor Green
    Write-Host "  - Files to remove: $removalCount" -ForegroundColor Yellow
    Write-Host ""
}

# ===============================================================================
# MAIN EXECUTION
# ===============================================================================

if ($Help) {
    Show-Help
    exit 0
}

Show-Header

Write-Host "ANALYZING CURRENT CONFIGURATION..." -ForegroundColor Yellow
Write-Host ""

# Show cleanup plan
Show-CleanupPlan -Plan $ConfigCleanup

if ($DryRun) {
    Write-Host "SIMULATION MODE - No files have been modified" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "To apply changes:" -ForegroundColor White
    Write-Host "  .\Clean-Config-Architecture.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Ask for confirmation unless Force is used
if (-not $Force) {
    Write-Host "Do you want to proceed with config cleanup?" -ForegroundColor Yellow
    Write-Host "This will reorganize config files and remove redundant files." -ForegroundColor Gray
    $response = Read-Host "Type 'yes' to continue, or 'no' to cancel"
    
    if ($response -ne "yes" -and $response -ne "y") {
        Write-Host "Config cleanup cancelled" -ForegroundColor Red
        exit 0
    }
}

# Execute cleanup
New-CleanArchitecture -CleanupMap $ConfigCleanup -LogDirs $LogDirectories -Force:$Force

# Create config documentation
$configDoc = "# Clean Configuration Architecture" + [Environment]::NewLine +
[Environment]::NewLine +
"## Directory Structure" + [Environment]::NewLine +
[Environment]::NewLine +
"### config/" + [Environment]::NewLine +
"- app_config.json - Main application configuration" + [Environment]::NewLine +
"- examples/basic.json - Basic configuration template" + [Environment]::NewLine +
"- examples/advanced.json - Advanced configuration template" + [Environment]::NewLine +
"- examples/full.json - Full configuration template" + [Environment]::NewLine +
"- schemas/config_schema.json - Configuration validation schema" + [Environment]::NewLine +
[Environment]::NewLine +
"### logs/" + [Environment]::NewLine +
"- app.log - Application runtime logs" + [Environment]::NewLine +
"- error.log - Error and exception logs" + [Environment]::NewLine +
"- debug.log - Debug and development logs" + [Environment]::NewLine +
"- archive/ - Archived log files" + [Environment]::NewLine +
[Environment]::NewLine +
"## Benefits" + [Environment]::NewLine +
[Environment]::NewLine +
"1. Portability - All config stays in project directory" + [Environment]::NewLine +
"2. Clean Organization - Dedicated directories for each type" + [Environment]::NewLine +
"3. No Pollution - No files scattered in user space" + [Environment]::NewLine +
"4. Professional Structure - Enterprise-grade organization" + [Environment]::NewLine +
[Environment]::NewLine +
"## Migration Completed" + [Environment]::NewLine +
[Environment]::NewLine +
"Date: " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

$configDoc | Out-File -FilePath "docs/dev/CLEAN_CONFIG_ARCHITECTURE.md" -Encoding UTF8
Write-Host "Documentation created: docs/dev/CLEAN_CONFIG_ARCHITECTURE.md" -ForegroundColor Green

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Update code to use new config paths" -ForegroundColor White
Write-Host "2. Update log file references" -ForegroundColor White  
Write-Host "3. Test configuration loading" -ForegroundColor White
Write-Host "4. Enjoy the clean, portable architecture!" -ForegroundColor White
Write-Host ""