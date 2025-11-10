import logging
import asyncio
import sys
import traceback
from pathlib import Path
from typing import Dict, Any, Optional

# Configuration du logging détaillé
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/debug_full_startup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

async def debug_full_startup():
    logger.info("🚀 DÉMARRAGE COMPLET AVEC DÉBOGAGE DÉTAILLÉ")
    logger.info(f"🐍 Python version: {sys.version}")
    logger.info(f"📁 Répertoire courant: {Path.cwd()}")
    
    try:
        # Étape 1: Charger la configuration
        logger.info("🔧 ÉTAPE 1: Chargement de la configuration...")
        from llama_runner.config_loader import load_config, config_loader
        config = load_config()
        logger.info(f"✅ Configuration chargée avec {len(config)} clés")
        logger.debug(f"🔧 Configuration complète: {config}")
        
        # Étape 2: Initialiser le service manager
        logger.info("🔧 ÉTAPE 2: Initialisation du HeadlessServiceManager...")
        from llama_runner.headless_service_manager import HeadlessServiceManager
        
        models_config = config.get('models', {})
        logger.info(f"📋 Nombre de modèles configurés: {len(models_config)}")
        
        # Initialisation avec logs détaillés
        hsm = HeadlessServiceManager(config, models_config)
        logger.info("✅ HeadlessServiceManager initialisé avec succès")
        
        # Étape 3: Démarrer les services progressivement
        logger.info("🔧 ÉTAPE 3: Démarrage des services...")
        await hsm.start_services()
        logger.info("✅ Tous les services démarrés avec succès")
        
        logger.info("🎉 DÉMARRAGE COMPLET RÉUSSI !")
        logger.info("🌐 Services accessibles:")
        logger.info("   • Ollama Proxy: http://localhost:11434")
        logger.info("   • LM Studio Proxy: http://localhost:1234")
        logger.info("   • WebUI: http://localhost:8081")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ ERREUR FATALE LORS DU DÉMARRAGE: {e}")
        logger.error("📋 TRACEBACK COMPLÈTE:")
        logger.error(traceback.format_exc())
        
        # Essayer de récupérer plus d'informations sur l'erreur
        if hasattr(e, '__dict__'):
            logger.error(f"🔧 Détails de l'erreur: {e.__dict__}")
        
        return False

async def keep_alive():
    """Garder le service en vie avec des logs périodiques"""
    logger.info("⏳ Service en cours d'exécution...")
    try:
        while True:
            logger.info("💓 Service toujours actif...")
            await asyncio.sleep(30)
    except asyncio.CancelledError:
        logger.info("🛑 Service arrêté proprement")

if __name__ == "__main__":
    logger.info("🏁 SCRIPT DE DÉBOGAGE COMPLET DU DÉMARRAGE")
    
    try:
        # Créer le dossier logs si nécessaire
        Path("logs").mkdir(exist_ok=True)
        
        loop = asyncio.get_event_loop()
        
        # Démarrer le service principal
        startup_task = loop.create_task(debug_full_startup())
        
        # Garder le service en vie
        keep_alive_task = loop.create_task(keep_alive())
        
        # Attente des tâches
        done, pending = loop.run_until_complete(asyncio.wait(
            [startup_task, keep_alive_task],
            return_when=asyncio.FIRST_COMPLETED
        ))
        
        # Annuler les tâches restantes
        for task in pending:
            task.cancel()
            try:
                loop.run_until_complete(task)
            except asyncio.CancelledError:
                pass
        
        # Résultat du démarrage
        startup_success = startup_task.result() if not startup_task.cancelled() else False
        logger.info(f"✨ RÉSULTAT FINAL: {'SUCCÈS' if startup_success else 'ÉCHEC'}")
        
    except Exception as e:
        logger.error(f"❌ ERREUR FATALE GLOBALE: {e}")
        logger.error(traceback.format_exc())
    finally:
        try:
            loop.close()
        except:
            pass