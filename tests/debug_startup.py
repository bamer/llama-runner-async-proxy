import sys
import logging
import os
from pathlib import Path

# Configuration du logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_file_exists(path):
    exists = os.path.exists(path)
    logger.info(f"🔍 Vérification fichier {path}: {'✅ EXISTE' if exists else '❌ N\'EXISTE PAS'}")
    return exists

def debug_imports():
    logger.info("🔧 DÉBUT DU DÉBOGAGE DES IMPORTS")
    
    # Vérifier les fichiers essentiels
    essential_files = [
        "main.py",
        "llama_runner/__init__.py",
        "llama_runner/config_loader.py",
        "llama_runner/headless_service_manager.py",
        "config/config.json"
    ]
    
    for file_path in essential_files:
        full_path = os.path.join(os.getcwd(), file_path.replace("/", os.sep))
        check_file_exists(full_path)
    
    # Essayer d'importer les modules un par un
    modules_to_test = [
        "llama_runner",
        "llama_runner.config_loader",
        "llama_runner.headless_service_manager",
        "llama_runner.services.config_validator",
        "llama_runner.services.config_updater"
    ]
    
    for module in modules_to_test:
        try:
            logger.info(f"📥 Tentative d'import de {module}")
            __import__(module)
            logger.info(f"✅ Import réussi de {module}")
        except Exception as e:
            logger.error(f"❌ Erreur d'import de {module}: {e}")
            import traceback
            logger.error(traceback.format_exc())

def debug_config_loading():
    logger.info("🔧 DÉBUT DU DÉBOGAGE DU CHARGEMENT DE CONFIGURATION")
    
    try:
        from llama_runner.config_loader import CONFIG_DIR, ensure_config_exists, load_config
        logger.info(f"📁 Dossier de configuration: {CONFIG_DIR}")
        
        # Vérifier l'existence du dossier config
        if not os.path.exists(CONFIG_DIR):
            logger.warning(f"⚠️  Le dossier {CONFIG_DIR} n'existe pas, création en cours...")
            os.makedirs(CONFIG_DIR, exist_ok=True)
        
        # Vérifier le fichier de config
        config_file = os.path.join(CONFIG_DIR, "config.json")
        check_file_exists(config_file)
        
        # Charger la config
        logger.info("🔄 Chargement de la configuration...")
        config = load_config()
        logger.info(f"✅ Configuration chargée avec succès: {len(config)} clés")
        logger.debug(f"🔧 Configuration complète: {config}")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du chargement de la configuration: {e}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    logger.info("🚀 DÉMARRAGE DU SCRIPT DE DÉBOGAGE")
    logger.info(f"📋 Répertoire courant: {os.getcwd()}")
    logger.info(f"🐍 Version Python: {sys.version}")
    
    debug_imports()
    debug_config_loading()
    
    logger.info("🏁 FIN DU SCRIPT DE DÉBOGAGE")