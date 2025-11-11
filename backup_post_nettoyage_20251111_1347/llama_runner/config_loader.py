"""
Configuration loader module - VERSION COMPATIBLE
Correctifs pour compatibilité avec main.py et API stable
Préserve la robustesse tout en maintenant l'interface attendue
"""

import json
import shutil
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import datetime
import logging
import os
import hashlib
import platform
import socket

# Import constants and model discovery
from .constants import LLAMA_SERVER_ABSOLUTE_PATH, MODELS_ROOT_ABSOLUTE_PATH
from .model_discovery import update_models_config_with_discovered_models

# Configure logging immédiatement et de façon robuste
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/config_loader.log', encoding='utf-8', mode='a'),
        logging.StreamHandler()
    ]
)

PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"  # Correction : CONFIG_DIR doit pointer vers le dossier config/
APP_CONFIG_FILE = CONFIG_DIR / "app_config.json"  # Correction : fichier directement dans config/
MODELS_CONFIG_FILE = CONFIG_DIR / "models_config.json"  # Correction : fichier directement dans config/
LOGS_DIR = PROJECT_ROOT / "logs"

# Variables pour la compatibilité avec le code existant
CONFIG_FILE = str(APP_CONFIG_FILE)  # Ajout pour compatibilité avec config_repository.py
PROJECT_DIRECTORY = str(PROJECT_ROOT)  # Ajout pour compatibilité

# Variables globales pour la configuration chargée
_config = None
_models_config = None

def ensure_directories_exist_safe() -> bool:
    """Crée tous les répertoires nécessaires de façon sécurisée et robuste"""
    try:
        logging.info(f"✅ Vérification des répertoires nécessaires...")
        
        # Créer les répertoires principaux
        directories_to_create = [CONFIG_DIR, LOGS_DIR]
        for directory in directories_to_create:
            if not directory.exists():
                logging.info(f"✅ Création du répertoire : {directory}")
                directory.mkdir(parents=True, exist_ok=True)
                logging.info(f"✅ Répertoire créé avec succès : {directory}")
            else:
                logging.info(f"✅ Répertoire déjà existant : {directory}")
        
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
        logging.info("🔄 Chargement de la configuration applicative...")
        
        # S'assurer que les répertoires existent
        ensure_directories_exist_safe()
        
        # Charger ou créer la configuration
        if not APP_CONFIG_FILE.exists():
            logging.warning(f"⚠️ Fichier config applicative non trouvé : {APP_CONFIG_FILE}")
            default_config = create_default_app_config_safe()
            save_config_safe(APP_CONFIG_FILE, default_config)
            logging.info("✅ Configuration par défaut créée avec succès")
            return default_config
        
        logging.info(f"✅ Fichier config trouvé : {APP_CONFIG_FILE}")
        
        # Lire la configuration existante avec validation JSON stricte
        try:
            with open(APP_CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
            logging.info("✅ Configuration JSON chargée avec succès")
        except json.JSONDecodeError as e:
            logging.error(f"❌ Erreur parsing JSON config applicative : {str(e)}")
            default_config = create_default_app_config_safe()
            save_config_safe(APP_CONFIG_FILE, default_config)
            logging.info("✅ Configuration par défaut restaurée après erreur JSON")
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
        logging.info("🔄 Chargement de la configuration des modèles...")
        
        # S'assurer que les répertoires existent
        ensure_directories_exist_safe()
        
        # Charger ou créer la configuration
        if not MODELS_CONFIG_FILE.exists():
            logging.warning(f"⚠️ Fichier config modèles non trouvé : {MODELS_CONFIG_FILE}")
            default_config = create_default_models_config_safe()
            save_config_safe(MODELS_CONFIG_FILE, default_config)
            logging.info("✅ Configuration des modèles par défaut créée avec succès")
            return default_config
        
        logging.info(f"✅ Fichier config modèles trouvé : {MODELS_CONFIG_FILE}")
        
        # Lire la configuration existante avec validation JSON stricte
        try:
            with open(MODELS_CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
            logging.info("✅ Configuration JSON des modèles chargée avec succès")
        except json.JSONDecodeError as e:
            logging.error(f"❌ Erreur parsing JSON config modèles : {str(e)}")
            default_config = create_default_models_config_safe()
            save_config_safe(MODELS_CONFIG_FILE, default_config)
            logging.info("✅ Configuration des modèles par défaut restaurée après erreur JSON")
            return default_config
        
        # Valider et corriger la configuration
        config = validate_and_fix_models_config_safe(config)
        
        # Mettre à jour la configuration avec les modèles découverts automatiquement
        config = update_models_config_with_discovered_models(config)
        
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
            "port": 8000,  # Port corrigé pour éviter conflit avec dashboard
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
                "model_path": f"{MODELS_ROOT_ABSOLUTE_PATH}\\JanusCoderV-7B-i1-GGUF\\JanusCoderV-7B.i1-Q4_K_S.gguf",
                "llama_cpp_runtime": "llama-server",
                "parameters": {
                    "n_gpu_layers": 85,
                    "port": 8000  # Port corrigé
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
        logging.info(f"💾 Sauvegarde de la configuration vers : {config_path}")
        
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

def ensure_config_exists() -> bool:
    """API compatible - s'assure que les fichiers de configuration existent et retourne un booléen"""
    try:
        logging.info("🔄 Vérification de l'existence des fichiers de configuration...")
        
        # S'assurer que les répertoires existent
        if not ensure_directories_exist_safe():
            logging.error("❌ Échec de la création des répertoires nécessaires")
            return False
        
        # Vérifier si les fichiers existent
        app_config_exists = APP_CONFIG_FILE.exists()
        models_config_exists = MODELS_CONFIG_FILE.exists()
        
        logging.info(f"🔍 Fichier app_config.json existe : {app_config_exists}")
        logging.info(f"🔍 Fichier models_config.json existe : {models_config_exists}")
        
        if not app_config_exists or not models_config_exists:
            logging.info("🔄 Création des fichiers de configuration par défaut...")
            default_app_config = create_default_app_config_safe()
            default_models_config = create_default_models_config_safe()
            
            success = True
            if not app_config_exists:
                if save_config_safe(APP_CONFIG_FILE, default_app_config):
                    logging.info("✅ Fichier app_config.json créé avec succès")
                else:
                    logging.error("❌ Échec de la création du fichier app_config.json")
                    success = False
            
            if not models_config_exists:
                if save_config_safe(MODELS_CONFIG_FILE, default_models_config):
                    logging.info("✅ Fichier models_config.json créé avec succès")
                else:
                    logging.error("❌ Échec de la création du fichier models_config.json")
                    success = False
            
            if success:
                logging.info("✅ Fichiers de configuration créés avec succès")
                return True
            else:
                logging.error("❌ Échec de la création de certains fichiers de configuration")
                return False
        else:
            logging.info("✅ Les fichiers de configuration existent déjà")
            return True
            
    except Exception as e:
        logging.error(f"❌ Erreur vérification création configuration : {str(e)}")
        return False

def load_config() -> Dict[str, Any]:
    """API compatible - charge la configuration principale"""
    global _config
    if _config is None:
        _config = load_app_config_safe()
    return _config

def load_models_config() -> Dict[str, Any]:
    """API compatible - charge la configuration des modèles"""
    global _models_config
    if _models_config is None:
        _models_config = load_models_config_safe()
    return _models_config

def calculate_system_fingerprint(model_config: Dict[str, Any]) -> str:
    """
    Calculates a system fingerprint based on model configuration and system info.
    This is used for model identification and compatibility checks.
    """
    try:
        # Collect system information
        system_info = {
            "platform": platform.system(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "python_version": platform.python_version(),
            "hostname": socket.gethostname()
        }
        
        # Combine with model configuration
        fingerprint_data = {
            "model_config": model_config,
            "system_info": system_info,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        # Create hash
        fingerprint_str = json.dumps(fingerprint_data, sort_keys=True)
        fingerprint_hash = hashlib.sha256(fingerprint_str.encode('utf-8')).hexdigest()
        
        logging.debug(f"System fingerprint calculated: {fingerprint_hash[:16]}...")
        return fingerprint_hash
        
    except Exception as e:
        logging.error(f"❌ Error calculating system fingerprint: {e}")
        # Return a default fingerprint if calculation fails
        return "default_fingerprint_12345"

# 🔥 INITIALISATION SÉCURISÉE COMPATIBLE
try:
    logging.info("=== INITIALISATION COMPATIBLE CONFIG_LOADER ===")
    
    # Valider les chemins critiques
    validate_file_exists_safe(LLAMA_SERVER_ABSOLUTE_PATH, "llama-server.exe")
    validate_file_exists_safe(MODELS_ROOT_ABSOLUTE_PATH, "Répertoire des modèles")
    
    logging.info("✅ ConfigLoader initialisé avec succès - VERSION COMPATIBLE")
    
    # Export config objects for backward compatibility
    config = load_config()
    models_config = load_models_config()
    
except Exception as e:
    logging.error(f"❌ Erreur initialisation ConfigLoader : {str(e)}")

# Point d'entrée principal sécurisé
if __name__ == "__main__":
    try:
        logging.info("=== TEST COMPATIBLE CONFIG_LOADER ===")
        app_config = load_app_config_safe()
        models_config = load_models_config_safe()
        
        # Test system fingerprint
        test_model_config = models_config.get("models", {}).get("JanusCoderV-7B.i1-Q4_K_S", {})
        fingerprint = calculate_system_fingerprint(test_model_config)
        logging.info(f"✅ System fingerprint test: {fingerprint}")
        
        # Validation finale
        assert "proxies" in app_config, "Section proxies manquante"
        assert "models" in models_config, "Section models manquante"
        assert "default_model" in models_config, "Section default_model manquante"
        
        logging.info(f"✅ Test réussi - {len(models_config.get('models', {}))} modèles chargés")
        
    except Exception as e:
        logging.error(f"❌ Test échoué : {str(e)}")