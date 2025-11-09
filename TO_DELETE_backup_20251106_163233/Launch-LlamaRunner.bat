@echo off
REM ===============================================================================
REM 🚀 LlamaRunner Pro - Lanceur Principal (Batch)
REM Created by Bamer - Professional AI Proxy Suite Launcher
REM ===============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 LlamaRunner Pro                        ║
echo ║                  Professional AI Proxy Suite                  ║
echo ║                        by Bamer                                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Détecter le répertoire du script
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

REM Chemins des fichiers
set "VENV_PATH=%SCRIPT_DIR%\dev-venv"
set "PYTHON_PATH=%VENV_PATH%\Scripts\python.exe"
set "MAIN_SCRIPT=%SCRIPT_DIR%\main.py"
set "METRICS_SCRIPT=%SCRIPT_DIR%\llama_runner\metrics_server.py"
set "TEST_SCRIPT=%SCRIPT_DIR%\test_implementation_validation.py"
set "POWERSHELL_SCRIPT=%SCRIPT_DIR%\Launch-LlamaRunner.ps1"

REM Traiter les arguments
if "%1"=="-h" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="/h" goto :show_help
if "%1"=="/?" goto :show_help

if "%1"=="-install" goto :install_deps
if "%1"=="--install" goto :install_deps

if "%1"=="-test" goto :run_tests
if "%1"=="--test" goto :run_tests

if "%1"=="-proxy" goto :start_proxy
if "%1"=="--proxy" goto :start_proxy

if "%1"=="-webui" goto :start_webui
if "%1"=="--webui" goto :start_webui

if "%1"=="-metrics" goto :start_metrics
if "%1"=="--metrics" goto :start_metrics

if "%1"=="-dev" goto :start_dev
if "%1"=="--dev" goto :start_dev

if "%1"=="-headless" goto :start_headless
if "%1"=="--headless" goto :start_headless

REM Si PowerShell est disponible, déléguer au script PowerShell
where powershell >nul 2>&1
if !errorlevel! equ 0 (
    echo 🔄 Redirection vers PowerShell pour l'interface interactive...
    powershell -ExecutionPolicy Bypass -File "%POWERSHELL_SCRIPT%" %*
    goto :end
)

REM Sinon, mode menu simple
goto :interactive_menu

:show_help
echo 🎯 MODES DE LANCEMENT DISPONIBLES:
echo.
echo Options principales:
echo   -install         : Installation des dépendances Python
echo   -proxy           : Lance le proxy (LM Studio + Ollama)
echo   -webui           : Lance le proxy + interface web
echo   -metrics         : Lance proxy + web UI + dashboard métriques
echo   -dev             : Mode développement avec logs détaillés
echo   -headless        : Mode serveur sans interface graphique
echo   -test            : Lance les tests de validation
echo   -h, --help       : Affiche cette aide
echo.
echo Exemples d'utilisation:
echo   Launch-LlamaRunner.bat -install
echo   Launch-LlamaRunner.bat -proxy
echo   Launch-LlamaRunner.bat -metrics
echo   Launch-LlamaRunner.bat -test
echo.
echo 💡 Pour l'interface interactive complète, utilisez PowerShell:
echo   powershell -ExecutionPolicy Bypass -File Launch-LlamaRunner.ps1
goto :end

:install_deps
echo 📦 INSTALLATION DES DÉPENDANCES
echo.

REM Créer l'environnement virtuel s'il n'existe pas
if not exist "%VENV_PATH%" (
    echo 🏗️  Création de l'environnement virtuel...
    python -m venv "%VENV_PATH%"
    if !errorlevel! neq 0 (
        echo ❌ Échec de création de l'environnement virtuel
        goto :end
    )
)

REM Mettre à jour pip
echo 📈 Mise à jour de pip...
"%PYTHON_PATH%" -m pip install --upgrade pip

REM Installer les dépendances
echo 📚 Installation des dépendances...
"%PYTHON_PATH%" -m pip install -r requirements.txt

if !errorlevel! equ 0 (
    echo ✅ Installation terminée avec succès!
) else (
    echo ❌ Échec de l'installation des dépendances
)
goto :end

:run_tests
echo 🧪 LANCEMENT DES TESTS DE VALIDATION
echo.

if not exist "%PYTHON_PATH%" (
    echo ❌ Python non trouvé. Exécutez d'abord: Launch-LlamaRunner.bat -install
    goto :end
)

"%PYTHON_PATH%" "%TEST_SCRIPT%"
goto :end

:start_proxy
echo 🚀 DÉMARRAGE DU PROXY LLAMARUNNER
echo.

if not exist "%PYTHON_PATH%" (
    echo ❌ Python non trouvé. Exécutez d'abord: Launch-LlamaRunner.bat -install
    goto :end
)

echo 📡 LM Studio: http://localhost:1234
echo 🦙 Ollama: http://localhost:11434
echo.
echo ✅ Proxy démarré! Appuyez sur Ctrl+C pour arrêter
echo.

"%PYTHON_PATH%" "%MAIN_SCRIPT%" --config config.json --log-level INFO --lm-studio-port 1234 --ollama-port 11434
goto :end

:start_webui
echo 🌐 DÉMARRAGE DU PROXY + INTERFACE WEB
echo.

if not exist "%PYTHON_PATH%" (
    echo ❌ Python non trouvé. Exécutez d'abord: Launch-LlamaRunner.bat -install
    goto :end
)

echo 📡 LM Studio: http://localhost:1234
echo 🦙 Ollama: http://localhost:11434
echo 🌐 Interface Web: http://localhost:3000
echo.
echo ✅ Proxy démarré! Ouvrez votre navigateur sur http://localhost:3000
echo.

"%PYTHON_PATH%" "%MAIN_SCRIPT%" --config config.json --log-level INFO --lm-studio-port 1234 --ollama-port 11434 --web-ui
goto :end

:start_metrics
echo 📊 DÉMARRAGE DU SYSTÈME COMPLET (PROXY + WEB UI + MÉTRIQUES)
echo.

if not exist "%PYTHON_PATH%" (
    echo ❌ Python non trouvé. Exécutez d'abord: Launch-LlamaRunner.bat -install
    goto :end
)

echo 📊 Dashboard Métriques: http://localhost:8585
echo 🌐 Interface Web: http://localhost:3000
echo 📡 LM Studio: http://localhost:1234
echo 🦙 Ollama: http://localhost:11434
echo.
echo ✅ Système complet démarré! 
echo.
echo 📊 Ouvrez votre navigateur sur:
echo    - Dashboard: http://localhost:8585
echo    - Interface: http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arrêter tous les services
echo.

start "Dashboard Métriques" cmd /c "echo Démarrage du serveur de métriques... && timeout /t 3 && start http://localhost:8585"
timeout /t 2 >nul

"%PYTHON_PATH%" "%METRICS_SCRIPT%" &
set METRICS_PID=!errorlevel!

timeout /t 2 >nul
"%PYTHON_PATH%" "%MAIN_SCRIPT%" --config config.json --log-level INFO --lm-studio-port 1234 --ollama-port 11434 --web-ui --metrics-port 8585

REM Arrêter le serveur de métriques
if defined METRICS_PID taskkill /PID !METRICS_PID! /F >nul 2>&1
goto :end

:start_dev
echo 🔧 DÉMARRAGE EN MODE DÉVELOPPEMENT
echo.

if not exist "%PYTHON_PATH%" (
    echo ❌ Python non trouvé. Exécutez d'abord: Launch-LlamaRunner.bat -install
    goto :end
)

echo 📝 Logs détaillés activés
echo 📡 LM Studio: http://localhost:1234
echo 🦙 Ollama: http://localhost:11434
echo.
echo ✅ Mode développement démarré!
echo.

"%PYTHON_PATH%" "%MAIN_SCRIPT%" --config config.json --log-level DEBUG --lm-studio-port 1234 --ollama-port 11434
goto :end

:start_headless
echo 🖥️  DÉMARRAGE EN MODE HEADLESS
echo.

if not exist "%PYTHON_PATH%" (
    echo ❌ Python non trouvé. Exécutez d'abord: Launch-LlamaRunner.bat -install
    goto :end
)

echo 📡 LM Studio: http://localhost:1234
echo 🦙 Ollama: http://localhost:11434
echo.
echo ✅ Mode headless démarré!
echo.

"%PYTHON_PATH%" "%MAIN_SCRIPT%" --config config.json --log-level INFO --lm-studio-port 1234 --ollama-port 11434 --headless
goto :end

:interactive_menu
echo 🎯 SÉLECTIONNEZ LE MODE DE LANCEMENT:
echo.
echo 1. 🏃‍♂️ Proxy uniquement (LM Studio + Ollama)
echo 2. 🌐 Proxy + Interface Web
echo 3. 📊 Proxy + Web UI + Dashboard Métriques (Complet)
echo 4. 🔧 Mode Développement (avec logs détaillés)
echo 5. 🖥️  Mode Headless (serveur sans GUI)
echo 6. 🧪 Lancer les tests de validation
echo 7. 📦 Installer/Mise à jour des dépendances
echo 8. ❌ Quitter
echo.

:menu_choice
set /p choice="👉 Votre choix (1-8): "

if "%choice%"=="1" goto :start_proxy
if "%choice%"=="2" goto :start_webui
if "%choice%"=="3" goto :start_metrics
if "%choice%"=="4" goto :start_dev
if "%choice%"=="5" goto :start_headless
if "%choice%"=="6" goto :run_tests
if "%choice%"=="7" goto :install_deps
if "%choice%"=="8" goto :end

echo ❌ Choix invalide. Veuillez choisir un numéro entre 1 et 8.
goto :menu_choice

:end
echo.
echo 👋 Merci d'avoir utilisé LlamaRunner Pro!
echo 💡 Pour plus d'options, utilisez: Launch-LlamaRunner.bat --help
echo.
pause
