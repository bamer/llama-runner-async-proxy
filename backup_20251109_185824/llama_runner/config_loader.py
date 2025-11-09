import json
import shutil
from pathlib import Path
from typing import Any, Dict, Optional
import datetime

# Définition claire du répertoire de configuration
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / "config"

# Créer le répertoire de configuration s'il n'existe pas
if not CONFIG_DIR.exists():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✅ Created config directory at {CONFIG_DIR}")

# Configuration par défaut corrigée avec le bon modèle par défaut
DEFAULT_CONFIG = {
    "default_model": "JanusCoderV-7B.i1-Q4_K_S",
    "proxies": {
        "ollama": {
            "enabled": True,
            "port": 11434
        },
        "lmstudio": {
            "enabled": True,
            "port": 1234,
            "api_key": None
        }
    },
    "llama-runtimes": {
        "llama-server": {
            "runtime": "F:\\llm\\llama\\llama-server.exe"
        }
    },
    "webui": {
        "enabled": True,
        "port": 8081,
        "host": "0.0.0.0"
    },
    "metrics": {
        "enabled": True,
        "port": 8080,
        "host": "0.0.0.0"
    },
    "audio": {
        "runtimes": {},
        "models": {
            "whisper-tiny": {
                "model_path": "tiny",
                "runtime": None,
                "parameters": {
                    "device": "cpu",
                    "compute_type": "int8",
                    "threads": 4,
                    "language": None,
                    "beam_size": 5
                }
            }
        }
    },
    "models": {
        "JanusCoderV-7B.i1-Q4_K_S": {
            "model_path": "F:\\llm\\llama\\models\\JanusCoderV-7B-i1-GGUF\\JanusCoderV-7B.i1-Q4_K_S.gguf",
            "llama_cpp_runtime": "llama-server",
            "parameters": {
                "ctx_size": 32000,
                "temp": 0.7,
                "batch_size": 1024,
                "ubatch_size": 512,
                "threads": 10,
                "mlock": True,
                "no_mmap": True,
                "flash_attn": "on",
                "n_gpu_layers": 85,
                "jinja": True,
                "port": 8035,
                "host": "127.0.0.1"
            },
            "display_name": "JanusCoderV-7B.i1-Q4_K_S",
            "auto_discovered": False,
            "auto_update_model": False
        }
    },
    "default_runtime": "llama-server",
    "concurrentRunners": 1,
    "logging": {
        "prompt_logging_enabled": False
    },
    "runtimes": {
        "llama-server": {
            "runtime": "F:\\llm\\llama\\llama-server.exe",
            "supports_tools": True
        }
    }
}

class ConfigLoader:
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or str(CONFIG_DIR / "config.json")
        self.config = self._load_config()
    
    def _backup_existing_config(self):
        """Crée une sauvegarde de la configuration existante avant de la remplacer"""
        config_path = Path(self.config_path)
        if config_path.exists():
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = config_path.parent / f"config_backup_{timestamp}.json"
            try:
                shutil.copy2(config_path, backup_path)
                print(f"✅ Backup created: {backup_path}")
                return str(backup_path)
            except Exception as e:
                print(f"⚠️ Failed to create backup: {e}")
        return None

    def _load_config(self) -> Dict[str, Any]:
        """Charge la configuration depuis le fichier ou utilise la configuration par défaut"""
        config_path = Path(self.config_path)
        
        # Si le fichier n'existe pas, créer une configuration par défaut
        if not config_path.exists():
            print(f"⚠️  Configuration file not found at {config_path}")
            print("   Creating default configuration...")
            return self._create_default_config()
        
        # Charger la configuration existante
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                
            # Vérifier et ajouter les sections manquantes
            if "default_model" not in config:
                config["default_model"] = DEFAULT_CONFIG["default_model"]
                print("⚠️  Added missing 'default_model' to configuration")
            
            # Vérifier que le modèle par défaut existe dans la configuration
            if "models" in config and config["default_model"] not in config["models"]:
                print(f"⚠️  Default model '{config['default_model']}' not found in models")
                print("   Setting default model to first available model")
                if config["models"]:
                    config["default_model"] = next(iter(config["models"]))
                else:
                    # Si aucun modèle n'est configuré, utiliser la configuration par défaut
                    print("   No models configured, using default model configuration")
                    config["models"] = DEFAULT_CONFIG["models"].copy()
                    config["default_model"] = DEFAULT_CONFIG["default_model"]
            
            return config
        except Exception as e:
            print(f"❌ Error loading configuration: {e}")
            print("   Creating backup and falling back to default configuration")
            
            # Créer une sauvegarde de la configuration corrompue
            self._backup_existing_config()
            
            # Retourner une configuration par défaut
            return self._create_default_config()

    def _create_default_config(self) -> Dict[str, Any]:
        """Crée une configuration par défaut et l'enregistre"""
        config_path = Path(self.config_path)
        
        # Créer le répertoire s'il n'existe pas
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Écrire la configuration par défaut
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_CONFIG, f, indent=4, ensure_ascii=False)
        
        print(f"✅ Created default configuration at {config_path}")
        return DEFAULT_CONFIG.copy()

    def get_config(self) -> Dict[str, Any]:
        """Retourne la configuration chargée"""
        return self.config

    def save_config(self, config: Dict[str, Any]):
        """Sauvegarde la configuration dans le fichier"""
        config_path = Path(self.config_path)
        
        # Créer une sauvegarde de la configuration existante
        self._backup_existing_config()
        
        # Écrire la nouvelle configuration
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        
        print(f"✅ Configuration saved to {config_path}")

# Instance globale pour un accès facile
config_loader = ConfigLoader()
config = config_loader.get_config()