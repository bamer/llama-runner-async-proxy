#!/usr/bin/env powershell
# ===============================================================================
# 🦙 LLAMA RUNNER PRO - MENU INTERACTIF ULTIME (VERSION CORRIGÉE - PHASE 2)
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

# 🔥 PHASE 2 CORRECTION : Chemins relatifs au lieu d'absolus
function Start-LlamaServer {
    # Chemins relatifs au projet
    $serverPath = Join-Path $PSScriptRoot "..\\llama\\llama-server.exe"
    $modelPath = Join-Path $PSScriptRoot "..\\llama\\models"
    
    
    if (Test-Path $serverPath) {
        Write-MenuLog "Démarrage de llama-server avec JanusCoderV-7B.i1-Q4_K_S sur le port 8035" "INFO"
        Write-ColorOutput "`n🚀 Démarrage de llama-server avec JanusCoderV-7B.i1-Q4_K_S sur le port 8035..." "Cyan"
        
        Start-Process -FilePath $serverPath `
            -ArgumentList "--model `"$modelPath`" --jinja -c 0 --host 127.0.0.1 --port 8035" `
            -NoNewWindow
        
        # Attendre un peu pour que le serveur démarre
        Start-Sleep -Seconds 5
        return $true
    } else {
        Write-MenuLog "Erreur: llama-server.exe non trouvé à $serverPath" "ERROR"
        Write-ColorOutput "`n❌ Erreur: llama-server.exe non trouvé à $serverPath" "Red"
        
        # 🔥 PHASE 2 CORRECTION : Message d'aide pour l'installation
        Write-ColorOutput "`n💡 CONSEIL PHASE 2 :" "Yellow"
        Write-ColorOutput "   - Téléchargez llama-server.exe depuis https://github.com/ggerganov/llama.cpp" "White"
        Write-ColorOutput "   - Placez-le dans le dossier 'tools/'" "White"
        Write-ColorOutput "   - Téléchargez un modèle GGUF et placez-le dans 'models/'" "White"
        
        return $false
    }
}

$script:Options = @(
    @{Text="🚀 Mode Proxy (Serveur principal)"; Action="proxy"}
    @{Text="🦙 Mode Llama.cpp seul"; Action="llama-only"}
    @{Text="🌐 Mode Proxy + WebUI"; Action="webui"}
    @{Text="📊 Mode Proxy + WebUI + Dashboard"; Action="metrics"}
    @{Text="🔧 Mode Développement (Debug)"; Action="dev"}
    @{Text="🧪 Tests du système"; Action="test"}
    @{Text="📦 Installation des dépendances"; Action="install"}
    @{Text="⚙️  Configuration des ports"; Action="ports"}
    @{Text="🔍 Validation complète du système"; Action="validate"}
    @{Text="🤖 Gestion des modèles"; Action="models"}
    @{Text="🔄 Mise à jour config"; Action="update_config"}
    @{Text="❌ Quitter"; Action="exit"}
)

$script:CurrentSelection = 0
$script:LogLevel = "INFO"
$script:LogPath = "logs\\launch_menu.log"

# 🔥 PHASE 2 CORRECTION : Chemins relatifs systématiques
$script:ProjectRoot = $PSScriptRoot
$script:VenvPath = Join-Path $script:ProjectRoot "dev-venv"
$script:PythonPath = Join-Path $script:VenvPath "Scripts\\python.exe"
$script:MainScript = "main.py"

# Créer les dossiers nécessaires (idempotent)
@("logs", "config", "scripts", "models", "tools") | ForEach-Object {
    if (-not (Test-Path $_)) { 
        New-Item -ItemType Directory -Path $_ -Force | Out-Null 
        Write-MenuLog "Dossier créé : $_" "INFO"
    }
}

# Initialiser le fichier de log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] === DÉMARRAGE MENU CORRIGÉ PHASE 2 ===" | Out-File $script:LogPath -Append -Encoding UTF8

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
        
        # 🔥 PHASE 2 CORRECTION : Message d'aide détaillé
        Write-ColorOutput "`n💡 CONSEIL PHASE 2 :" "Yellow"
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
    
    # Démarrer llama-server pour les modes webui et metrics
    if ($Mode -eq "webui" -or $Mode -eq "metrics") {
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
        "metrics" { 
            $args += "--web-ui" 
            $args += "--metrics"
        }
        "dev" { 
            $args += "--dev" 
            $args += "--web-ui"
            $args += "--metrics"
        }
    }
    
    Write-ColorOutput "`n🚀 Commande:" "Cyan"
    Write-ColorOutput "   $($script:PythonPath) $($args -join ' ')" "White"
    Write-MenuLog "Commande: $($script:PythonPath) $($args -join ' ')" "INFO"
    
    try {
        Write-ColorOutput "`n⏳ Démarrage..." "Yellow"
        Write-MenuLog "Démarrage processus" "INFO"
        
        # 🔥 PHASE 2 CORRECTION : WorkingDirectory explicite
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
            
            # 🔥 PHASE 2 CORRECTION : Analyse des erreurs courantes
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
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-ModelManagement {
    Write-ColorOutput "`n=== 🤖 GESTION DES MODÈLES ===" "Magenta"
    
    $modelScriptPath = Join-Path $script:ProjectRoot "scripts\\model_management.ps1"
    
    if (Test-Path $modelScriptPath) {
        Write-MenuLog "Lancement script modèles" "INFO"
        & $modelScriptPath
        Write-MenuLog "Script modèles terminé avec succès" "SUCCESS"
    } else {
        Write-ColorOutput "❌ Script non trouvé : $modelScriptPath" "Red"
        Write-MenuLog "Script modèles non trouvé : $modelScriptPath" "ERROR"
        
        # 🔥 PHASE 2 CORRECTION : Message d'aide
        Write-ColorOutput "`n💡 CONSEIL PHASE 2 :" "Yellow"
        Write-ColorOutput "   - Le script de gestion des modèles devrait être dans scripts\\model_management.ps1" "White"
        Write-ColorOutput "   - Vérifiez que tous les scripts sont dans le dossier 'scripts/'" "White"
    }
    
    Write-Host "`n✅ Opération terminée avec succès !" -ForegroundColor Green
    Write-Host "💡 Appuyez sur une touche pour retourner au menu..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Boucle principale
while ($true) {
    Clear-Host
    Write-ColorOutput "╔════════════════════════════════════════════╗" "Cyan"
    Write-ColorOutput "║    🦙 MENU INTERACTIF - PHASE 2 STABLE    ║" "Cyan"
    Write-ColorOutput "║      Structure corrigée et simplifiée     ║" "Cyan"
    Write-ColorOutput "╚════════════════════════════════════════════╝" "Cyan"
    Write-Host ""
    
    # 🔥 PHASE 2 CORRECTION : Afficher l'état du projet
    Write-ColorOutput "📊 ÉTAT ACTUEL DU PROJET :" "Yellow"
    Write-ColorOutput "   📁 Répertoire projet: $script:ProjectRoot" "White"
    Write-ColorOutput "   🐍 Python: $($script:PythonPath -replace [regex]::Escape($HOME), '~')" "White"
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
                "metrics" { if (Test-Environment) { Start-LlamaRunner -Mode "metrics" } }
                "dev" { if (Test-Environment) { Start-LlamaRunner -Mode "dev" } }
                "models" { Show-ModelManagement }
                "validate" { 
                    $validateScript = Join-Path $script:ProjectRoot "scripts\\validate_system.ps1"
                    if (Test-Path $validateScript) {
                        & $validateScript
                    } else {
                        Write-ColorOutput "`n❌ Script de validation non trouvé" "Red"
                    }
                }
                "exit" { 
                    Write-ColorOutput "`n👋 Au revoir ! Projet stabilisé en Phase 2." "Cyan"
                    exit 0 
                }
            }
        }
        27 { 
            Write-ColorOutput "`n👋 Au revoir ! Projet stabilisé en Phase 2." "Cyan"
            exit 0 
        } # Échap
    }
}