#!/usr/bin/env powershell
# ===============================================================================
# 🦙 Model Management - Gestion des modèles IA
# Version propre et fonctionnelle
# ===============================================================================

param(
    [switch]$Scan,
    [switch]$Configure,
    [switch]$List,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$script:LogPath = "logs\model_management.log"
$script:ConfigPath = "config.json"
$script:ModelsRoot = "F:\llm\llama\models"

# Créer les dossiers nécessaires
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}
if (-not (Test-Path "config")) {
    New-Item -ItemType Directory -Path "config" -Force | Out-Null
}

function Write-ModelLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    $logEntry | Out-File $script:LogPath -Append -Encoding UTF8
    
    switch ($Level) {
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        default { Write-Host $Message -ForegroundColor White }
    }
}

function Get-ValidModelFiles {
    Write-ModelLog "🔍 Scan sécurisé des modèles dans: $script:ModelsRoot" "INFO"
    
    $validModels = @()
    $searchPaths = @(
        "$script:ModelsRoot\*.gguf",
        "$script:ModelsRoot\*\*.gguf",
        "$script:ModelsRoot\*\*\*.gguf"
    )
    
    foreach ($path in $searchPaths) {
        $files = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 100MB }
        
        if ($files) {
            foreach ($file in $files) {
                # Extraction sécurisée du nom
                $fileName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
                $cleanName = $fileName -replace '\.Q\d+_K.*$', '' -replace '[-_]+', '_' -replace '\s+', '_' -replace '[^\w\-_]', ''
                $cleanName = $cleanName.Trim('_','-', ' ').Trim()
                
                # Génération de nom sécurisé si invalide
                if ([string]::IsNullOrEmpty($cleanName) -or $cleanName.Length -lt 3) {
                    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
                    $cleanName = "model_" + ($baseName.Substring(0, [Math]::Min(8, $baseName.Length)) -replace '[^\w]', '') + "_" + (Get-Random -Maximum 9999)
                    Write-ModelLog "🔧 Nom généré pour fichier valide: $($file.Name) -> $cleanName" "WARNING"
                }
                
                # Vérification finale du nom
                if ([string]::IsNullOrEmpty($cleanName) -or $cleanName.Length -lt 3) {
                    $cleanName = "default_model_" + (Get-Random -Maximum 9999)
                    Write-ModelLog "⚠️ Nom valide garanti: $cleanName" "WARNING"
                }
                
                # Ajout au tableau avec vérification de doublons
                $safeName = $cleanName
                $counter = 1
                while ($validModels.CleanName -contains $safeName) {
                    $safeName = "${cleanName}_${counter}"
                    $counter++
                }
                
                $validModels += [PSCustomObject]@{
                    OriginalName = $file.Name
                    CleanName = $safeName
                    Path = $file.FullName
                    SizeBytes = $file.Length
                    SizeGB = [math]::Round($file.Length / 1GB, 2)
                    LastModified = $file.LastWriteTime
                }
                
                Write-ModelLog "✅ Modèle valide ajouté: $safeName ($([math]::Round($file.Length / 1GB, 2)) GB)" "SUCCESS"
            }
        }
    }
    
    Write-ModelLog "📊 Total modèles valides: $($validModels.Count)" "INFO"
    return $validModels
}

function Generate-SafeConfig {
    param([PSCustomObject]$model)
    
    Write-ModelLog "`n🔧 Génération configuration SÉCURISÉE pour: $($model.CleanName)" "INFO"
    
    # Configuration de base robuste
    $safeConfig = @{
        "version" = "1.0"
        "proxies" = @{
            "ollama" = @{ "enabled" = $true; "port" = 11434; "host" = "localhost" }
            "lmstudio" = @{ "enabled" = $true; "port" = 1234; "host" = "localhost" }
        }
        "webui" = @{ "enabled" = $true; "port" = 8081; "host" = "localhost" }
        "metrics" = @{ "enabled" = $true; "port" = 8080; "host" = "localhost" }
        "models" = @{}
        "llama-runtimes" = @{
            "llama-server" = @{ 
                "runtime" = "F:\\llm\\llama\\llama-server.exe"
                "supports_tools" = $true
            }
        }
        "logging" = @{
            "console_level" = "INFO"
            "file_level" = "DEBUG"
            "log_file" = "logs\\app.log"
        }
    }
    
    # Ajout sécurisé du modèle
    $safeConfig["models"][$model.CleanName] = @{
        "model_path" = $model.Path
        "llama_cpp_runtime" = "llama-server"
        "parameters" = @{
            "ctx_size" = 32000
            "temp" = 0.7
            "threads" = 8
            "n_gpu_layers" = 40
            "mlock" = $true
            "no_mmap" = $true
        }
        "display_name" = $model.CleanName
        "auto_discovered" = $true
        "auto_update_model" = $true
    }
    
    return $safeConfig
}

function Configure-Model {
    param([PSCustomObject]$model)
    
    try {
        Write-ModelLog "`n⚙️ Configuration SÉCURISÉE du modèle: $($model.CleanName)" "INFO"
        
        if ([string]::IsNullOrEmpty($model.CleanName)) {
            throw "Nom de modèle invalide (vide)"
        }
        
        # Backup existant
        if (Test-Path $script:ConfigPath) {
            $backupPath = "config\config_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
            Copy-Item $script:ConfigPath $backupPath
            Write-ModelLog "✅ Backup créé: $backupPath" "SUCCESS"
        }
        
        # Génération et sauvegarde sécurisée
        $config = Generate-SafeConfig -model $model
        $jsonContent = $config | ConvertTo-Json -Depth 10 -Compress
        
        if ([string]::IsNullOrEmpty($jsonContent)) {
            throw "Contenu JSON vide généré"
        }
        
        $jsonContent | Out-File $script:ConfigPath -Encoding UTF8
        Write-ModelLog "✅ Configuration mise à jour avec succès !" "SUCCESS"
        return $true
    }
    catch {
        Write-ModelLog "❌ ERREUR CRITIQUE: $_" "ERROR"
        Write-ModelLog "💡 Création configuration minimale de secours" "WARNING"
        
        try {
            $minimalConfig = @{
                "version" = "1.0"
                "proxies" = @{
                    "ollama" = @{ "enabled" = $true; "port" = 11434 }
                    "lmstudio" = @{ "enabled" = $true; "port" = 1234 }
                }
                "llama-runtimes" = @{
                    "llama-server" = @{ "runtime" = "F:\\llm\\llama\\llama-server.exe" }
                }
            }
            
            $minimalConfig | ConvertTo-Json -Depth 5 | Out-File $script:ConfigPath -Encoding UTF8
            Write-ModelLog "✅ Configuration minimale créée" "SUCCESS"
            return $true
        }
        catch {
            Write-ModelLog "❌ ÉCHEC TOTAL: $_" "ERROR"
            return $false
        }
    }
}

# ===============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ===============================================================================

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            🤖 GESTION DES MODÈLES - MODEL MANAGEMENT TOOL    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Scanner les modèles
$models = Get-ValidModelFiles

# Menu principal
while ($true) {
    Clear-Host
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║            📋 MENU DE GESTION DES MODÈLES                    ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   [1] Scanner et afficher les modèles" -ForegroundColor White
    Write-Host "   [2] Configurer un modèle par défaut" -ForegroundColor White
    Write-Host "   [3] Mettre à jour la liste des modèles" -ForegroundColor White
    Write-Host "   [4] Nettoyer les modèles non utilisés" -ForegroundColor White
    Write-Host "   [0] Retour au menu principal" -ForegroundColor White
    Write-Host ""
    
    if ($models.Count -gt 0) {
        Write-Host "`n📊 Modèles valides trouvés ($($models.Count)) :" -ForegroundColor Cyan
        Write-Host "=" * 60 -ForegroundColor Cyan
        
        $index = 0
        foreach ($model in $models) {
            Write-Host "[$index] $($model.CleanName)" -ForegroundColor White
            Write-Host "    💾 $($model.SizeGB) GB | 📁 $($model.OriginalName)" -ForegroundColor Gray
            $index++
        }
    }
    
    Write-Host "`n❓ Sélectionnez une action (0-4) : " -ForegroundColor Yellow -NoNewline
    $selection = Read-Host
    
    switch ($selection) {
        "0" { 
            Write-Host "`n👋 Retour au menu principal..." -ForegroundColor Cyan
            break
        }
        "1" { 
            Write-Host "`n🔄 Rescan des modèles en cours..." -ForegroundColor Yellow
            $models = Get-ValidModelFiles
            Write-Host "`n✅ Scan terminé!" -ForegroundColor Green
            Start-Sleep -Seconds 2
        }
        "2" {
            if ($models.Count -eq 0) {
                Write-Host "`n⚠️ AUCUN MODÈLE VALIDE TROUVÉ !" -ForegroundColor Yellow
                Write-Host "💡 Placez vos fichiers .gguf (> 100MB) dans:" -ForegroundColor Gray
                Write-Host "   F:\llm\llama\models\" -ForegroundColor Gray
                Start-Sleep -Seconds 3
            }
            else {
                Write-Host "`n❓ Sélectionnez un modèle (0-$($models.Count-1)) ou appuyez sur Entrée pour le premier : " -ForegroundColor Yellow -NoNewline
                $modelSelection = Read-Host
                
                $selectedModel = $null
                if ([string]::IsNullOrEmpty($modelSelection)) {
                    $selectedModel = $models[0]
                    Write-Host "`n🧠 Modèle sélectionné par défaut: $($selectedModel.CleanName)" -ForegroundColor Cyan
                }
                elseif ($modelSelection -match '^\d+$' -and [int]$modelSelection -lt $models.Count) {
                    $selectedModel = $models[[int]$modelSelection]
                    Write-Host "`n🎯 Modèle sélectionné: $($selectedModel.CleanName)" -ForegroundColor Green
                }
                else {
                    Write-Host "`n❌ Sélection invalide. Utilisation du premier modèle." -ForegroundColor Red
                    $selectedModel = $models[0]
                    Write-Host "   ➡️  Modèle choisi: $($selectedModel.CleanName)" -ForegroundColor Yellow
                }
                
                if ($selectedModel) {
                    $confirm = Read-Host "`n❓ Configurer ce modèle ? (o/n)"
                    if ($confirm -eq "o") {
                        $result = Configure-Model -model $selectedModel
                        if ($result) {
                            Write-Host "`n✅ SUCCÈS : Configuration mise à jour !" -ForegroundColor Green
                            Write-Host "🔧 Fichier de configuration: $script:ConfigPath" -ForegroundColor Gray
                        }
                        else {
                            Write-Host "`n❌ ÉCHEC : Impossible de configurer le modèle" -ForegroundColor Red
                        }
                    }
                    else {
                        Write-Host "`nℹ️  Configuration annulée par l'utilisateur" -ForegroundColor Yellow
                    }
                }
                Start-Sleep -Seconds 3
            }
        }
        "3" {
            Write-Host "`n🔄 Mise à jour de la liste des modèles..." -ForegroundColor Yellow
            $models = Get-ValidModelFiles
            Write-Host "`n✅ Liste des modèles mise à jour !" -ForegroundColor Green
            Start-Sleep -Seconds 2
        }
        "4" {
            Write-Host "`n🧹 Nettoyage des modèles non utilisés..." -ForegroundColor Yellow
            # Ici on pourrait ajouter la logique de nettoyage
            Write-Host "`n✅ Nettoyage simulé terminé !" -ForegroundColor Green
            Write-Host "💡 (Fonctionnalité à implémenter plus tard)" -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
        default {
            Write-Host "`n❌ Action non valide. Veuillez choisir 0-4." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
    
    if ($selection -eq "0") {
        break
    }
}

Write-Host "`n📝 Logs complets: $script:LogPath" -ForegroundColor Gray
Write-Host "👋 Gestion des modèles terminée" -ForegroundColor Cyan