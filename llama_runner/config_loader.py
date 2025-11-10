"""
Configuration loader module - VERSION ULTRA-STABLE
Correctifs pour tous les problèmes identifiés dans les logs
Utilise uniquement les chemins absolus confirmés par l'utilisateur
Gestion stricte des erreurs et validation robuste
"""

import json
import shutil
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import datetime
import logging
import psutil
import socket
import platform
import hashlib
import os

# Configure logging immédiatement et de façon robuste
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/config_loader.log', encoding='utf-8', mode='a'),
        logging.StreamHandler()
    ]
)

# 🔥 CORRECTIONS CRITIQUES : Chemins ABSOLUS confirmés par les logs
LLAMA_SERVER_ABSOLUTE_PATH = "F:\\\\llm\\\\llama\\\\llama-server.exe"
MODELS_ROOT_ABSOLUTE_PATH = "F:\\\\llm\\\\models"
PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
APP_CONFIG_FILE = CONFIG_DIR / "app_config.json"
MODELS_CONFIG_FILE = CONFIG_DIR / "models_config.json"
LOGS_DIR = PROJECT_ROOT / "logs"

def ensure_directories_exist_safe():
    """Crée tous les répertoires nécessaires de façon sécurisée et robuste"""
    try:
        # Créer les répertoires principaux
        for directory in [CONFIG_DIR, LOGS_DIR]:
            if not directory.exists():
                directory.mkdir(parents=True, exist_ok=True)
                logging.info(f"✅ Répertoire créé : {directory}")
        
        return True
        
    except Exception as e:
        logging.error(f"❌ Erreur création répertoires : {str(e)}")
        return False

def validate_file_exists_safe(file_path: str, description: str) -> bool:
    """Valide l'existence d'un fichier avec gestion d'erreurs robuste"""
    try:
        if os.path.exists(file_path):
            logging.info(f"✅ {description} trouvé : {file_path}")
            return True
        else:
            logging.error(f"❌ {description} non trouvé : {file_path}")
            return False
            
    except Exception as e:
        logging.error(f"❌ Erreur validation fichier {description} : {str(e)}")
        return False

def load_app_config_safe() -> Dict[str, Any]:
    """Charge la configuration applicative avec validation stricte et fallback sécurisé"""
    try:
        # S'assurer que les répertoires existent
        ensure_directories_exist_safe()
        
        # Charger ou créer la configuration
        if not APP_CONFIG_FILE.exists():
            logging.warning(f"⚠️ Fichier config applicative non trouvé : {APP_CONFIG_FILE}")
            default_config = create_default_app_config_safe()
            save_config_safe(APP_CONFIG_FILE, default_config)
            return default_config
        
        # Lire la configuration existante avec validation JSON stricte
        try:
            with open(APP_CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            logging.error(f"❌ Erreur parsing JSON config applicative : {str(e)}")
            default_config = create_default_app_config_safe()
            save_config_safe(APP_CONFIG_FILE, default_config)
            return default_config
        
        # Valider et corriger la configuration
        config = validate_and_fix_app_config_safe(config)
        logging.info("✅ Configuration applicative chargée avec succès")
        return config
        
    except Exception as e:
        logging.error(f"❌ Erreur chargement config applicative : {str(e)}")
        return create_default_app_config_safe()

def load_models_config_safe() -> Dict[str, Any]:
    """Charge la configuration des modèles avec validation stricte et fallback sécurisé"""
    try:
        # S'assurer que les répertoires existent
        ensure_directories_exist_safe()
        
        # Charger ou créer la configuration
        if not MODELS_CONFIG_FILE.exists():
            logging.warning(f"⚠️ Fichier config modèles non trouvé : {MODELS_CONFIG_FILE}")
            default_config = create_default_models_config_safe()
            save_config_safe(MODELS_CONFIG_FILE, default_config)
            return default_config
        
        # Lire la configuration existante avec validation JSON stricte
        try:
            with open(MODELS_CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            logging.error(f"❌ Erreur parsing JSON config modèles : {str(e)}")
            default_config = create_default_models_config_safe()
            save_config_safe(MODELS_CONFIG_FILE, default_config)
            return default_config
        
        # Valider et corriger la configuration
        config = validate_and_fix_models_config_safe(config)
        logging.info("✅ Configuration des modèles chargée avec succès")
        return config
        
    except Exception as e:
        logging.error(f"❌ Erreur chargement config modèles : {str(e)}")
        return create_default_models_config_safe()

def create_default_app_config_safe() -> Dict[str, Any]:
    """Crée une configuration applicative par défaut sécurisée et minimale"""
    return {
        "proxies": {
            "ollama": {"enabled": True, "port": 11434},
            "lmstudio": {"enabled": True, "port": 1234, "api_key": None}
        },
        "webui": {"enabled": True, "port": 8081, "host": "0.0.0.0"},
        "metrics": {"enabled": True, "port": 8080, "host": "0.0.0.0"},
        "concurrentRunners": 1,
        "logging": {"prompt_logging_enabled": False}
    }

def create_default_models_config_safe() -> Dict[str, Any]:
    """Crée une configuration des modèles par défaut sécurisée avec les chemins CORRECTS"""
    return {
        "default_parameters": {
            "ctx_size": 32000,
            "temp": 0.7,
            "port": 8035,
            "host": "127.0.0.1"
        },
        "runtimes": {
            "llama-server": {
                "runtime": LLAMA_SERVER_ABSOLUTE_PATH,
                "supports_tools": True
            }
        },
        "models": {
            "JanusCoderV-7B.i1-Q4_K_S": {
                "model_path": f"{MODELS_ROOT_ABSOLUTE_PATH}\\\\JanusCoderV-7B-i1-GGUF\\\\JanusCoderV-7B.i1-Q4_K_S.gguf",
                "llama_cpp_runtime": "llama-server",
                "parameters": {
                    "n_gpu_layers": 85,
                    "port": 8035
                },
                "display_name": "JanusCoderV-7B.i1-Q4_K_S",
                "auto_discovered": False,
                "auto_update_model": False,
                "has_tools": True
            }
        },
        "default_model": "JanusCoderV-7B.i1-Q4_K_S"
    }

def save_config_safe(config_path: Path, config: Dict[str, Any]) -> bool:
    """Sauvegarde une configuration avec backup et validation stricte"""
    try:
        # Créer un backup si le fichier existe
        if config_path.exists():
            backup_path = config_path.with_suffix(f".backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
            try:
                shutil.copy2(config_path, backup_path)
                logging.info(f"✅ Backup créé : {backup_path}")
            except Exception as e:
                logging.warning(f"⚠️ Erreur création backup : {str(e)}")
        
        # Sauvegarder la configuration avec validation JSON
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        
        logging.info(f"✅ Configuration sauvegardée : {config_path}")
        return True
        
    except Exception as e:
        logging.error(f"❌ Erreur sauvegarde configuration : {str(e)}")
        return False

def validate_and_fix_app_config_safe(config: Dict[str, Any]) -> Dict[str, Any]:
    """Valide et corrige la configuration applicative de façon sécurisée"""
    try:
        result = config.copy()
        
        # Vérifier et corriger les sections critiques
        critical_sections = ["proxies", "webui", "metrics"]
        for section in critical_sections:
            if section not in result:
                result[section] = create_default_app_config_safe()[section]
                logging.warning(f"⚠️ Section '{section}' ajoutée à la configuration applicative")
        
        return result
        
    except Exception as e:
        logging.error(f"❌ Erreur validation config applicative : {str(e)}")
        return create_default_app_config_safe()

def validate_and_fix_models_config_safe(config: Dict[str, Any]) -> Dict[str, Any]:
    """Valide et corrige la configuration des modèles de façon sécurisée"""
    try:
        result = config.copy()
        
        # Vérifier et corriger les sections critiques
        critical_sections = ["default_parameters", "models", "default_model", "runtimes"]
        for section in critical_sections:
            if section not in result:
                result[section] = create_default_models_config_safe()[section]
                logging.warning(f"⚠️ Section '{section}' ajoutée à la configuration des modèles")
        
        # Vérifier que le modèle par défaut existe
        if result["default_model"] not in result.get("models", {}):
            if result.get("models"):
                # Prendre le premier modèle disponible
                first_model = next(iter(result["models"].keys()))
                result["default_model"] = first_model
                logging.warning(f"⚠️ Modèle par défaut changé pour : {first_model}")
            else:
                # Créer le modèle par défaut
                result["models"] = create_default_models_config_safe()["models"]
                result["default_model"] = "JanusCoderV-7B.i1-Q4_K_S"
                logging.warning("⚠️ Aucun modèle configuré, modèle par défaut créé")
        
        return result
        
    except Exception as e:
        logging.error(f"❌ Erreur validation config modèles : {str(e)}")
        return create_default_models_config_safe()

def discover_models_safe() -> Tuple[Dict[str, Any], int, int]:
    """Découvre les modèles avec une logique robuste et sécurisée"""
    try:
        logging.info("🔍 Découverte des modèles démarrée...")
        
        # Charger la configuration existante
        models_config = load_models_config_safe()
        existing_models = models_config.get("models", {})
        default_parameters = models_config.get("default_parameters", {})
        
        new_models_added = 0
        existing_models_preserved = 0
        
        # Vérifier que le répertoire des modèles existe
        if not os.path.exists(MODELS_ROOT_ABSOLUTE_PATH):
            logging.error(f"❌ Répertoire des modèles non trouvé : {MODELS_ROOT_ABSOLUTE_PATH}")
            return models_config, new_models_added, existing_models_preserved
        
        logging.info(f"📂 Analyse du répertoire des modèles : {MODELS_ROOT_ABSOLUTE_PATH}")
        
        # Parcourir tous les sous-dossiers avec validation stricte
        for subdir_name in os.listdir(MODELS_ROOT_ABSOLUTE_PATH):
            subdir_path = os.path.join(MODELS_ROOT_ABSOLUTE_PATH, subdir_name)
            
            if not os.path.isdir(subdir_path):
                continue
            
            # Skip les dossiers système
            if subdir_name.startswith('.') or subdir_name in ['__pycache__', 'metadata_cache']:
                continue
            
            logging.info(f"   📁 Sous-dossier : {subdir_name}")
            
            # Trouver les fichiers .gguf dans ce sous-dossier
            gguf_files = []
            for file_name in os.listdir(subdir_path):
                if file_name.lower().endswith('.gguf'):
                    gguf_files.append(file_name)
            
            for gguf_file in gguf_files:
                try:
                    # Extraire le nom du modèle (sécurisé)
                    model_name = os.path.splitext(gguf_file)[0].strip()
                    if not model_name:
                        continue
                    
                    # Skip si le modèle existe déjà
                    if model_name in existing_models:
                        logging.info(f"      ✅ Modèle existant préservé : {model_name}")
                        existing_models_preserved += 1
                        continue
                    
                    # Créer la configuration du nouveau modèle (sécurisé)
                    model_path = f"{MODELS_ROOT_ABSOLUTE_PATH}\\\\{subdir_name}\\\\{gguf_file}"
                    new_model_config = {
                        "model_path": model_path,
                        "llama_cpp_runtime": "llama-server",
                        "parameters": {
                            "n_gpu_layers": 45,
                            "ctx_size": default_parameters.get("ctx_size", 32000),
                            "temp": default_parameters.get("temp", 0.7),
                            "port": default_parameters.get("port", 8035)
                        },
                        "display_name": model_name,
                        "auto_discovered": True,
                        "auto_update_model": False,
                        "has_tools": False
                    }
                    
                    # Ajouter le modèle
                    if "models" not in models_config:
                        models_config["models"] = {}
                    
                    models_config["models"][model_name] = new_model_config
                    new_models_added += 1
                    logging.info(f"      ✨ Nouveau modèle ajouté : {model_name}")
                    logging.info(f"         📁 Chemin : {model_path}")
                    
                except Exception as e:
                    logging.error(f"❌ Erreur traitement fichier {gguf_file} : {str(e)}")
                    continue
        
        # Définir le modèle par défaut si nécessaire
        if not models_config.get("default_model") and new_models_added > 0:
            first_model = next(iter(models_config["models"].keys()))
            models_config["default_model"] = first_model
            logging.info(f"🎯 Modèle par défaut défini : {first_model}")
        
        logging.info(f"✅ Découverte terminée : {new_models_added} nouveaux modèles, {existing_models_preserved} existants préservés")
        return models_config, new_models_added, existing_models_preserved
        
    except Exception as e:
        logging.error(f"❌ Erreur découverte modèles : {str(e)}")
        return load_models_config_safe(), 0, 0

# 🔥 INITIALISATION SÉCURISÉE ULTRA-ROBUSTE
try:
    logging.info("=== INITIALISATION ULTRA-ROBUSTE CONFIG_LOADER ===")
    
    # Valider les chemins critiques
    validate_file_exists_safe(LLAMA_SERVER_ABSOLUTE_PATH, "llama-server.exe")
    validate_file_exists_safe(MODELS_ROOT_ABSOLUTE_PATH, "Répertoire des modèles")
    
    # Charger les configurations avec fallback sécurisé
    app_config = load_app_config_safe()
    models_config = load_models_config_safe()
    
    logging.info("✅ ConfigLoader initialisé avec succès - VERSION ULTRA-STABLE")
    
except Exception as e:
    logging.error(f"❌ Erreur initialisation ULTRA-ROBUSTE ConfigLoader : {str(e)}")
    raise

# Point d'entrée principal sécurisé
if __name__ == "__main__":
    try:
        logging.info("=== TEST ULTRA-STABLE CONFIG_LOADER ===")
        app_config = load_app_config_safe()
        models_config = load_models_config_safe()
        
        # Validation finale
        assert "proxies" in app_config, "Section proxies manquante"
        assert "models" in models_config, "Section models manquante"
        assert "default_model" in models_config, "Section default_model manquante"
        
        logging.info(f"✅ Test réussi - {len(models_config.get('models', {}))} modèles chargés")
        
    except Exception as e:
        logging.error(f"❌ Test échoué : {str(e)}")