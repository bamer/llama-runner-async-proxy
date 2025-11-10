import logging
import asyncio
import sys
from pathlib import Path

# Configuration du logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_headless_service_manager_init():
    logger.info("🚀 Démarrage du test d'initialisation HeadlessServiceManager")
    
    try:
        logger.info("📥 Import des modules nécessaires...")
        from llama_runner.config_loader import load_config
        from llama_runner.headless_service_manager import HeadlessServiceManager
        logger.info("✅ Imports réussis")
        
        logger.info("🔄 Chargement de la configuration...")
        config = load_config()
        logger.info(f"✅ Configuration chargée avec {len(config)} clés")
        
        # Extrait les modèles de la configuration
        models_config = config.get('models', {})
        logger.info(f"📋 Nombre de modèles configurés: {len(models_config)}")
        
        logger.info("🔧 Initialisation HeadlessServiceManager...")
        hsm = HeadlessServiceManager(config, models_config)
        logger.info("✅ HeadlessServiceManager initialisé avec succès")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 SCRIPT DE DÉBOGAGE D'INITIALISATION DES SERVICES")
    logger.info(f"🐍 Python version: {sys.version}")
    logger.info(f"📁 Répertoire courant: {Path.cwd()}")
    
    try:
        success = asyncio.run(test_headless_service_manager_init())
        logger.info(f"✨ Test {'réussi' if success else 'échoué'}")
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        import traceback
        logger.error(traceback.format_exc())