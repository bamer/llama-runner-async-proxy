import logging
import asyncio
import sys
from pathlib import Path

# Configuration du logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def start_minimal_services():
    logger.info("🚀 Démarrage des services minimaux")
    
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
        
        logger.info("▶️ Démarrage des services...")
        await hsm.start_services()
        logger.info("✅ Services démarrés avec succès")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du démarrage: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 SCRIPT DE DÉMARRAGE MINIMAL DES SERVICES")
    logger.info(f"🐍 Python version: {sys.version}")
    logger.info(f"📁 Répertoire courant: {Path.cwd()}")
    
    try:
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(start_minimal_services())
        logger.info(f"✨ Démarrage {'réussi' if success else 'échoué'}")
        
        if success:
            logger.info("⏳ Maintien du service en cours d'exécution...")
            try:
                loop.run_forever()
            except KeyboardInterrupt:
                logger.info("🛑 Arrêt demandé par l'utilisateur")
            finally:
                loop.close()
                
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        import traceback
        logger.error(traceback.format_exc())