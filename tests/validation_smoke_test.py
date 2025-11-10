#!/usr/bin/env python3
"""
Validation Smoke Test - Phase 1 Sauvetage
Ce test vérifie les corrections apportées dans la phase 1 :
1. Chemins de configuration unifiés
2. Conflits de ports résolus
3. Structure des logs correcte
4. Imports fonctionnels
"""

import json
import os
import logging
import sys
from pathlib import Path
import unittest
import importlib
import pkgutil

# Ajoute le répertoire racine au PYTHONPATH pour les imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

class ValidationSmokeTest(unittest.TestCase):
    
    def setUp(self):
        """Préparation avant chaque test"""
        self.project_root = project_root
        self.config_dir = self.project_root / "config"
        self.logs_dir = self.project_root / "logs"
        
    def test_config_files_exist(self):
        """Vérifie que les fichiers de configuration existent"""
        app_config_path = self.config_dir / "app_config.json"
        models_config_path = self.config_dir / "models_config.json"
        
        self.assertTrue(app_config_path.exists(), f"Fichier de config manquant : {app_config_path}")
        self.assertTrue(models_config_path.exists(), f"Fichier de config manquant : {models_config_path}")
        
    def test_config_paths_are_absolute(self):
        """Vérifie que les chemins dans les configurations sont absolus"""
        with open(self.config_dir / "app_config.json", 'r', encoding='utf-8') as f:
            app_config = json.load(f)
        
        with open(self.config_dir / "models_config.json", 'r', encoding='utf-8') as f:
            models_config = json.load(f)
        
        # Vérifie le chemin du runtime
        runtime_path = app_config.get("runtimes", {}).get("llama-server", {}).get("runtime", "")
        self.assertTrue(runtime_path.startswith("F:/"), f"Chemin relatif détecté : {runtime_path}")
        
        # Vérifie le chemin du modèle
        model_path = models_config.get("models", {}).get("JanusCoderV-7B.i1-Q4_K_S", {}).get("model_path", "")
        self.assertTrue(model_path.startswith("F:/"), f"Chemin relatif détecté : {model_path}")
        
    def test_ports_no_conflict(self):
        """Vérifie qu'il n'y a pas de conflit de ports"""
        with open(self.config_dir / "models_config.json", 'r', encoding='utf-8') as f:
            models_config = json.load(f)
        
        default_port = models_config.get("default_parameters", {}).get("port", 0)
        model_port = models_config.get("models", {}).get("JanusCoderV-7B.i1-Q4_K_S", {}).get("parameters", {}).get("port", 0)
        
        # Le port du modèle devrait être 8000 (anciennement 8035)
        self.assertEqual(model_port, 8000, f"Port incorrect pour le modèle : attendu 8000, obtenu {model_port}")
        
        # Le port par défaut devrait aussi être 8000
        self.assertEqual(default_port, 8000, f"Port par défaut incorrect : attendu 8000, obtenu {default_port}")
        
    def test_logs_directory_structure(self):
        """Vérifie que la structure des logs est correcte"""
        self.assertTrue(self.logs_dir.exists(), "Dossier logs manquant")
        
        # Vérifie que app.log a été déplacé dans logs/
        app_log_path = self.logs_dir / "app.log"
        self.assertTrue(app_log_path.exists(), f"app.log non trouvé dans {self.logs_dir}")
        
        # Vérifie que app.log n'est plus dans config/
        old_app_log_path = self.config_dir / "app.log"
        self.assertFalse(old_app_log_path.exists(), f"app.log encore présent dans {self.config_dir}")
        
    def test_main_imports(self):
        """Vérifie que les imports dans main.py fonctionnent"""
        try:
            # Teste si le module llama_runner existe
            import importlib.util
            spec = importlib.util.find_spec("llama_runner")
            self.assertIsNotNone(spec, "Module llama_runner introuvable")
            
            # Teste les imports spécifiques
            from llama_runner.config_loader import CONFIG_DIR, ensure_config_exists, load_config
            from llama_runner.services.config_validator import validate_config, log_validation_results
            from llama_runner.services.config_updater import update_config_smart
            
            self.assertTrue(True, "Imports dans main.py fonctionnels")
            
        except ImportError as e:
            self.fail(f"ImportError dans main.py : {e}")
        except Exception as e:
            self.fail(f"Erreur lors de l'import : {e}")
            
    def test_logging_setup(self):
        """Vérifie que le logging est correctement configuré"""
        try:
            # Teste la configuration du logging
            import logging
            from pathlib import Path
            
            # Configure un logger de test
            test_logger = logging.getLogger("validation_test")
            test_logger.setLevel(logging.DEBUG)
            
            # Vérifie que le dossier logs existe
            logs_dir = Path("logs")
            self.assertTrue(logs_dir.exists(), "Dossier logs n'existe pas")
            
            # Teste la création d'un fichier de log
            test_log_path = logs_dir / "validation_test.log"
            if test_log_path.exists():
                # Force la fermeture de tous les handlers existants
                for handler in logging.root.handlers[:]:
                    handler.close()
                logging.shutdown()
                test_log_path.unlink(missing_ok=True)
                
            file_handler = logging.FileHandler(str(test_log_path))
            file_handler.setLevel(logging.DEBUG)
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(name)s - %(message)s')
            file_handler.setFormatter(formatter)
            test_logger.addHandler(file_handler)
            
            test_logger.info("Test de logging réussi")
            
            # Force la fermeture du handler avant de vérifier le fichier
            file_handler.flush()
            file_handler.close()
            logging.shutdown()
            
            # Vérifie que le fichier a été créé
            self.assertTrue(test_log_path.exists(), "Fichier de log non créé")
            
            # Nettoie proprement
            if test_log_path.exists():
                os.remove(str(test_log_path))
                
        except Exception as e:
            self.fail(f"Erreur dans la configuration du logging : {e}")

if __name__ == '__main__':
    print("🚀 Démarrage Validation Smoke Test - Phase 1")
    print("=" * 60)
    
    # Configure logging pour le test
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("logs/validation_test.log"),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    unittest.main(verbosity=2)