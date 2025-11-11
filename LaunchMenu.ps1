#!/usr/bin/env powershell
# ===============================================================================
# 🦙 LLAMA RUNNER PRO - MENU DE LANCEMENT BASIQUE (VERSION SIMPLIFIÉE)
# ===============================================================================

# Correction CRITIQUE : Définir le répertoire de travail au démarrage
Set-Location -Path $PSScriptRoot

# Correction CRITIQUE : Activer le virtual environment
if (Test-Path ".\\dev-venv\\Scripts\\Activate.ps1") {
    & ".\\dev-venv\\Scripts\\Activate.ps1"
    Write-Host "✅ Virtual environment activé" -ForegroundColor Green
} else {
    Write-Host "⚠️ Virtual environment non trouvé" -ForegroundColor Yellow
}

# Correction CRITIQUE : Définir les variables d'environnement UTF-8 et CUDA
$env:PYTHONIOENCODING = "utf-8"
$env:CUDA_VISIBLE_DEVICES = "0"
$env:LLAMA_SET_ROWS = "1"

# 🔥 FONCTION DE LANCEMENT DE LLAMA SERVER (pour mode llama-only)
function Start-LlamaServer {
    # Chemins relatifs au projet
    $serverPath = Join-Path $PSScriptRoot "..\\llama\\llama-server.exe"
    $modelsBasePath = Join-Path $PSScriptRoot "..\\models"  # Dossier racine des modèles
    
    if (Test-Path $serverPath) {
        Write-MenuLog "Démarrage de llama-server avec modèles depuis $modelsBasePath" "INFO"
        Write-ColorOutput "`n🚀 Démarrage de llama-server avec modèles depuis $modelsBasePath..." "Cyan"
        
        # Utiliser le modèle par défaut depuis la configuration
        $defaultModel = Get-DefaultModelFromConfig
        if (-not $defaultModel) {
            $defaultModel = "JanusCoderV-7B.i1-Q4_K_S"
        }
        
        # 🔥 CORRECTION : Trouver le fichier modèle correct avec la nouvelle structure
        $modelInfo = Get-ModelInfoFromConfig $defaultModel
        if (-not $modelInfo) {
            Write-MenuLog "Erreur: Modèle '$defaultModel' non trouvé dans la configuration" "ERROR"
            Write-ColorOutput "`n❌ Erreur: Modèle '$defaultModel' non trouvé dans la configuration" "Red"
            return $false
        }
        
        $modelPath = $modelInfo.model_path
        $fullModelPath = Resolve-ModelPath $modelPath
        
        if (-not $fullModelPath) {
            Write-MenuLog "Erreur: Impossible de résoudre le chemin du modèle: $modelPath" "ERROR"
            Write-ColorOutput "`n❌ Erreur: Impossible de résoudre le chemin du modèle: $modelPath" "Red"
            return $false
        }
        
        Write-MenuLog "Chemin complet du modèle: $fullModelPath" "INFO"
        Write-ColorOutput "   📁 Modèle: $fullModelPath" "White"
        
        if (Test-Path $fullModelPath) {
            $args = "--model `"$fullModelPath`" --jinja -c 0 --host 127.0.0.1 --port 8035"
            
            # Ajouter les paramètres spécifiques du modèle si disponibles
            if ($modelInfo.parameters) {
                if ($modelInfo.parameters.n_gpu_layers) {
                    $args += " --n-gpu-layers $($modelInfo.parameters.n_gpu_layers)"
                }
                if ($modelInfo.parameters.ctx_size) {
                    $args += " --ctx-size $($modelInfo.parameters.ctx_size)"
                }
            }
            
            Write-MenuLog "Arguments du serveur: $args" "INFO"
            Write-ColorOutput "   ⚙️  Arguments: $args" "White"
            
            Start-Process -FilePath $serverPath `
                -ArgumentList $args `
                -NoNewWindow
            
            # Attendre un peu pour que le serveur démarre
            Start-Sleep -Seconds 5
            return $true
        } else {
            Write-MenuLog "Erreur: Fichier modèle non trouvé: $fullModelPath" "ERROR"
            Write-ColorOutput "`n❌ Erreur: Fichier modèle non trouvé: $fullModelPath" "Red"
            
            # 🔥 CORRECTION : Message d'aide pour la structure correcte
            Write-ColorOutput "`n💡 CONSEIL STRUCTURE MODÈLES :" "Yellow"
            Write-ColorOutput "   Votre structure de répertoires doit être :" "White"
            Write-ColorOutput "   F:\\llm\\" "White"
            Write-ColorOutput "   ├── llama\\" "White"
            Write-ColorOutput "   │   └── llama-server.exe" "White"
            Write-ColorOutput "   └── models\\" "White"
            Write-ColorOutput "       └── JanusCoderV-7B-i1-GGUF\\" "White"
            Write-ColorOutput "           └── JanusCoderV-7B.i1-Q4_K_S.gguf" "White"
            
            return $false
        }
    } else {
        Write-MenuLog "Erreur: llama-server.exe non trouvé à $serverPath" "ERROR"
        Write-ColorOutput "`n❌ Erreur: llama-server.exe non trouvé à $serverPath" "Red"
        
        # 🔥 CORRECTION : Message d'aide pour l'installation
        Write-ColorOutput "`n💡 CONSEIL PHASE 4 :" "Yellow"
        Write-ColorOutput "   - Téléchargez llama-server.exe depuis https://github.com/ggerganov/llama.cpp" "White"
        Write-ColorOutput "   - Placez-le dans '..\\llama\\'" "White"
        Write-ColorOutput "   - Téléchargez les modèles GGUF et placez-les dans '..\\models\\<nom-du-modèle>\'" "White"
        
        return $false
    }
}

function Resolve-ModelPath {
    param([string]$relativePath)
    
    try {
        # Résoudre le chemin relatif par rapport au répertoire du script
        $basePath = Join-Path $PSScriptRoot $relativePath
        
        # Normaliser le chemin (remplacer \\ par \ et résoudre les ..)
        $normalizedPath = [System.IO.Path]::GetFullPath($basePath)
        
        Write-MenuLog "Résolution chemin: '$relativePath' → '$normalizedPath'" "DEBUG"
        return $normalizedPath
    }
    catch {
        Write-MenuLog "Erreur résolution chemin '$relativePath': $_" "ERROR"
    }
}

function Get-DefaultModelFromConfig {
    try {
        $modelsConfigPath = Join-Path $script:ProjectRoot "config\\models_config.json"
        if (Test-Path $modelsConfigPath) {
            $modelsConfig = Get-Content $modelsConfigPath -Raw | ConvertFrom-Json
            return $modelsConfig.default_model
        }
    } catch {
        Write-MenuLog "Erreur lecture config modèles: $_" "ERROR"
    }
    return $null
}

function Get-ModelInfoFromConfig {
    param([string]$modelName)
    
    try {
        $modelsConfigPath = Join-Path $script:ProjectRoot "config\\models_config.json"
        if (Test-Path $modelsConfigPath) {
            $modelsConfig = Get-Content $modelsConfigPath -Raw | ConvertFrom-Json
            $models = $modelsConfig.models
            
            if ($models.PSObject.Properties.Name -contains $modelName) {
                return $models.$modelName
            }
        }
    } catch {
        Write-MenuLog "Erreur récupération info modèle '$modelName': $_" "ERROR"
    }
    return $null
}

# Options simplifiées - Seulement les modes de lancement
$script:Options = @(
    @{Text="🚀 Mode Proxy (Serveur principal)"; Action="proxy"}
    @{Text="🦙 Mode Llama.cpp seul"; Action="llama-only"}
    @{Text="🌐 Mode Proxy + WebUI"; Action="webui"}
    @{Text="🔧 Mode Développement (Debug)"; Action="dev"}
    @{Text="🔍 Validation complète du système"; Action="validate"}
    @{Text="❌ Quitter"; Action="exit"}
)

$script:CurrentSelection = 0
$script:LogLevel = "INFO"
$script:LogPath = "logs\\launch_menu.log"

# 🔥 CORRECTION : Chemins relatifs systématiques
$script:ProjectRoot = $PSScriptRoot
$script:VenvPath = Join-Path $script:ProjectRoot "dev-venv"
$script:PythonPath = Join-Path $script:VenvPath "Scripts\\python.exe"
$script:MainScript = "main.py"

# Créer les dossiers nécessaires (idempotent)
@("logs", "config", "scripts", "models", "tools", "..\\llama", "..\\models") | ForEach-Object {
    $path = Join-Path $script:ProjectRoot $_
    if (-not (Test-Path $path)) { 
        New-Item -ItemType Directory -Path $path -Force | Out-Null 
        Write-MenuLog "Dossier créé : $_" "INFO"
    }
}

# Initialiser le fichier de log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] === DÉMARRAGE MENU SIMPLIFIÉ ===" | Out-File $script:LogPath -Append -Encoding UTF8

function Write-MenuLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] [$Level] $Message" | Out-File $script:LogPath -Append -Encoding UTF8
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Environment {
    Write-MenuLog "=== Test environnement ===" "INFO"
    Write-ColorOutput "`n=== TEST DE L'ENVIRONNEMENT ===" "Yellow"
    
    # Vérifier Python
    if (-not (Test-Path $script:PythonPath)) {
        Write-ColorOutput "`n❌ Python non trouvé: $script:PythonPath" "Red"
        Write-MenuLog "Python non trouvé: $script:PythonPath" "ERROR"
        
        # 🔥 CORRECTION : Message d'aide détaillé
        Write-ColorOutput "`n💡 CONSEIL PHASE 4 :" "Yellow"
        Write-ColorOutput "   - Créez un virtual environment : python -m venv dev-venv" "White"
        Write-ColorOutput "   - Activez-le : dev-venv\\Scripts\\Activate.ps1" "White"
        Write-ColorOutput "   - Installez les dépendances : pip install -r requirements.txt" "White"
        
        return $false
    }
    
    # Tester Python
    try {
        $pythonVersion = & $script:PythonPath --version 2>&1
        Write-ColorOutput "`n🐍 Python: OK - $pythonVersion" "Green"
        Write-MenuLog "Python OK: $pythonVersion" "SUCCESS"
        
        # Vérifier les variables d'environnement
        Write-ColorOutput "`n⚙️ Variables d'environnement:" "Cyan"
        Write-ColorOutput "   PYTHONIOENCODING: $($env:PYTHONIOENCODING)" "White"
        Write-ColorOutput "   CUDA_VISIBLE_DEVICES: $($env:CUDA_VISIBLE_DEVICES)" "White"
        Write-ColorOutput "   LLAMA_SET_ROWS: $($env:LLAMA_SET_ROWS)" "White"
        
        return $true
    } catch {
        Write-ColorOutput "`n❌ Python non accessible: $_" "Red"
        Write-MenuLog "Erreur Python: $_" "ERROR"
        return $false
    }
}

function Start-LlamaRunner {
    param([string]$Mode)
    
    # Démarrer llama-server pour les modes webui
    if ($Mode -eq "webui" -or $Mode -eq "dev") {
        if (-not (Start-LlamaServer)) {
            Write-ColorOutput "`n⚠️ Attention: llama-server n'a pas pu démarrer" "Yellow"
            Write-MenuLog "llama-server failed to start" "WARNING"
            
            # Demander confirmation pour continuer
            $choice = Read-Host "`n❓ Voulez-vous continuer sans llama-server ? (O/N)"
            if ($choice -notmatch "^[OoYy]$") {
                Write-ColorOutput "`n⏹️ Démarrage annulé par l'utilisateur" "Yellow"
                return
            }
        }
    }
    
    Write-MenuLog "=== Démarrage mode: $Mode ===" "INFO"
    Write-ColorOutput "`n=== DÉMARRAGE LLAMA RUNNER ===" "Yellow"
    Write-ColorOutput "🎯 Mode: $Mode" "Cyan"
    
    $args = @(
        $script:MainScript,
        "--log-level", $script:LogLevel
    )
    
    switch ($Mode) {
        "proxy" { $args += "--headless" }
        "webui" { $args += "--web-ui" }
        "dev" { 
            $args += "--dev" 
            $args += "--web-ui"
        }
    }
    
    Write-ColorOutput "`n🚀 Commande:" "Cyan"
    Write-ColorOutput "   $($script:PythonPath) $($args -join ' ')" "White"
    Write-MenuLog "Commande: $($script:PythonPath) $($args -join ' ')" "INFO"
    
    try {
        Write-ColorOutput "`n⏳ Démarrage..." "Yellow"
        Write-MenuLog "Démarrage processus" "INFO"
        
        # 🔥 CORRECTION : WorkingDirectory explicite
        $process = Start-Process -FilePath $script:PythonPath `
            -ArgumentList $args `
            -WorkingDirectory $script:ProjectRoot `
            -NoNewWindow `
            -Wait `
            -PassThru
        
        $exitCode = $process.ExitCode
        Write-MenuLog "Processus terminé avec code: $exitCode" "INFO"
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "`n✅ Succès !" "Green"
        } else {
            Write-ColorOutput "`n❌ Erreur: code $exitCode" "Red"
            
            # 🔥 CORRECTION : Analyse des erreurs courantes
            if ($exitCode -eq 1) {
                Write-ColorOutput "`n💡 CONSEILS DE DÉBOGAGE :" "Yellow"
                Write-ColorOutput "   - Vérifiez les logs dans logs\\app.log" "White"
                Write-ColorOutput "   - Testez la configuration : .\\scripts\\validate_system.ps1" "White"
                Write-ColorOutput "   - Mettez à jour la config : .\\scripts\\port_config.ps1" "White"
            }
        }
    } catch {
        Write-ColorOutput "`n❌ Erreur démarrage: $_" "Red"
        Write-MenuLog "Erreur démarrage: $_" "ERROR"
    }
    
    Write-Host "`n✅ Opération terminée avec succès !" -ForegroundColor Green
    Write-Host "💡 Appuyez sur une touche pour retourner au menu..." -ForegroundColor Cyan
}

# Boucle principale
while ($true) {
    Clear-Host
    Write-ColorOutput "╔════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║     🦙 MENU DE LANCEMENT BASIQUE         ║" "Cyan"
    Write-ColorOutput "║        Toutes les configurations         ║" "Cyan"
    Write-ColorOutput "║        se font via le dashboard          ║" "Cyan"
    Write-ColorOutput "╚════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
    
    # Afficher l'état du projet
    Write-ColorOutput "📊 ÉTAT ACTUEL DU PROJET :" "Yellow"
    Write-ColorOutput "   📁 Répertoire projet: $script:ProjectRoot" "White"
    Write-ColorOutput "   🐍 Python: $($script:PythonPath -replace [regex]::Escape($HOME), '~')" "White"
    
    $defaultModel = Get-DefaultModelFromConfig
    if ($defaultModel) {
        Write-ColorOutput "   🤖 Modèle par défaut: $defaultModel" "White"
    } else {
        Write-ColorOutput "   ⚠️  Aucun modèle par défaut configuré" "Yellow"
    }
    
    Write-Host ""
    
    for ($i = 0; $i -lt $Options.Count; $i++) {
        $prefix = if ($i -eq $CurrentSelection) { "  > " } else { "    " }
        $color = if ($i -eq $CurrentSelection) { "White" } else { "Gray" }
        Write-Host "$prefix$($Options[$i].Text)" -ForegroundColor $color
    }
    
    $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    switch ($key.VirtualKeyCode) {
        38 { if ($CurrentSelection -gt 0) { $CurrentSelection-- } }
        40 { if ($CurrentSelection -lt ($Options.Count - 1)) { $CurrentSelection++ } }
        13 {
            $action = $Options[$CurrentSelection].Action
            switch ($action) {
                "proxy" { if (Test-Environment) { Start-LlamaRunner -Mode "proxy" } }
                "llama-only" { Start-LlamaServer }
                "webui" { if (Test-Environment) { Start-LlamaRunner -Mode "webui" } }
                "dev" { if (Test-Environment) { Start-LlamaRunner -Mode "dev" } }
                "validate" { 
                    $validateScript = Join-Path $script:ProjectRoot "scripts\\validate_system.ps1"
                    if (Test-Path $validateScript) {
                        & $validateScript
                    } else {
                        Write-ColorOutput "`n❌ Script de validation non trouvé" "Red"
                    }
                }
                "exit" { 
                    Write-ColorOutput "`n👋 Au revoir !" "Cyan"
                    exit 0 
                }
            }
        }
        27 { 
            Write-ColorOutput "`n👋 Au revoir !" "Cyan"
            exit 0 
        } # Échap
    }
}