import logging
import asyncio
import sys
from pathlib import Path

# Configuration du logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def start_services_step_by_step():
    logger.info("🚀 Démarrage des services étape par étape")
    
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
        
        logger.info("══════════════════════════════════════════════════════")
        logger.info("🔧 ÉTAPE 1 : Démarrage Ollama Proxy")
        logger.info("══════════════════════════════════════════════════════")
        
        # Démarrage Ollama proxy uniquement
        if hsm.ollama_proxy and hsm.llama_runner_manager:
            logger.info("▶️ Démarrage Ollama proxy server...")
            try:
                from fastapi import FastAPI
                from uvicorn import Config, Server
                
                ollama_app = FastAPI()
                ollama_app.state.get_runner_port_callback = hsm.llama_runner_manager.get_runner_port
                ollama_app.state.request_runner_start_callback = hsm.llama_runner_manager.request_runner_start
                ollama_app.state.llama_runner_manager = hsm.llama_runner_manager
                
                config = Config(
                    app=ollama_app,
                    host="0.0.0.0",
                    port=11434,
                    log_level="debug"
                )
                server = Server(config)
                hsm.ollama_server = server
                
                # Crée une tâche pour le serveur
                server_task = asyncio.create_task(server.serve())
                logger.info("✅ Ollama Proxy server démarré sur http://0.0.0.0:11434/")
                
                # Attends un peu pour voir si le serveur démarre correctement
                await asyncio.sleep(2)
                
                # Vérifie si la tâche est toujours en cours
                if not server_task.done():
                    logger.info("✅ Ollama Proxy server fonctionne correctement")
                    server_task.cancel()  # Annule la tâche pour passer à l'étape suivante
                    await server_task
                    logger.info("🛑 Ollama Proxy server arrêté pour test")
                else:
                    logger.error("❌ Ollama Proxy server a échoué au démarrage")
                    return False
                    
            except Exception as e:
                logger.error(f"❌ Erreur lors du démarrage Ollama proxy: {e}")
                import traceback
                logger.error(traceback.format_exc())
                return False
        
        logger.info("══════════════════════════════════════════════════════")
        logger.info("🔧 ÉTAPE 2 : Démarrage LM Studio Proxy")
        logger.info("══════════════════════════════════════════════════════")
        
        # Démarrage LM Studio proxy uniquement
        if hsm.lmstudio_proxy and hsm.llama_runner_manager:
            logger.info("▶️ Démarrage LM Studio proxy server...")
            try:
                from fastapi import FastAPI
                from uvicorn import Config, Server
                
                lmstudio_app = FastAPI()
                lmstudio_app.state.all_models_config = models_config
                lmstudio_app.state.get_runner_port_callback = hsm.llama_runner_manager.get_runner_port
                lmstudio_app.state.runtimes_config = config.get("llama-runtimes", {})
                lmstudio_app.state.request_runner_start_callback = hsm.llama_runner_manager.request_runner_start
                lmstudio_app.state.is_model_running_callback = hsm.llama_runner_manager.is_llama_runner_running
                lmstudio_app.state.proxy_thread_instance = hsm.lmstudio_proxy
                lmstudio_app.state.llama_runner_manager = hsm.llama_runner_manager
                
                config = Config(
                    app=lmstudio_app,
                    host="0.0.0.0",
                    port=1234,
                    log_level="debug"
                )
                server = Server(config)
                hsm.lmstudio_server = server
                
                # Crée une tâche pour le serveur
                server_task = asyncio.create_task(server.serve())
                logger.info("✅ LM Studio Proxy server démarré sur http://0.0.0.0:1234/")
                
                # Attends un peu pour voir si le serveur démarre correctement
                await asyncio.sleep(2)
                
                # Vérifie si la tâche est toujours en cours
                if not server_task.done():
                    logger.info("✅ LM Studio Proxy server fonctionne correctement")
                    server_task.cancel()  # Annule la tâche pour passer à l'étape suivante
                    await server_task
                    logger.info("🛑 LM Studio Proxy server arrêté pour test")
                else:
                    logger.error("❌ LM Studio Proxy server a échoué au démarrage")
                    return False
                    
            except Exception as e:
                logger.error(f"❌ Erreur lors du démarrage LM Studio proxy: {e}")
                import traceback
                logger.error(traceback.format_exc())
                return False
        
        logger.info("══════════════════════════════════════════════════════")
        logger.info("🔧 ÉTAPE 3 : Démarrage WebUI Service")
        logger.info("══════════════════════════════════════════════════════")
        
        # Démarrage WebUI service
        logger.info("▶️ Démarrage Llama Runner WebUI service...")
        try:
            from fastapi import FastAPI
            from uvicorn import Config, Server
            from fastapi.responses import HTMLResponse
            
            webui_app = FastAPI()
            
            @webui_app.get("/", response_class=HTMLResponse)
            async def webui_root():
                return "<h1>Test WebUI</h1><p>Service fonctionnel</p>"
            
            config = Config(
                app=webui_app,
                host="0.0.0.0",
                port=8081,
                log_level="debug"
            )
            server = Server(config)
            hsm.webui_server = server
            
            # Crée une tâche pour le serveur
            server_task = asyncio.create_task(server.serve())
            logger.info("✅ Llama Runner WebUI service démarré sur http://0.0.0.0:8081/")
            
            # Attends un peu pour voir si le serveur démarre correctement
            await asyncio.sleep(2)
            
            # Vérifie si la tâche est toujours en cours
            if not server_task.done():
                logger.info("✅ WebUI service fonctionne correctement")
                server_task.cancel()  # Annule la tâche
                await server_task
                logger.info("🛑 WebUI service arrêté")
            else:
                logger.error("❌ WebUI service a échoué au démarrage")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erreur lors du démarrage WebUI service: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
        
        logger.info("🎉 Tous les services ont démarré correctement dans les tests étape par étape!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur globale: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 SCRIPT DE DÉBOGAGE DÉTAILLÉ DU DÉMARRAGE DES SERVICES")
    logger.info(f"🐍 Python version: {sys.version}")
    logger.info(f"📁 Répertoire courant: {Path.cwd()}")
    
    try:
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(start_services_step_by_step())
        logger.info(f"✨ Test d'étape par étape {'réussi' if success else 'échoué'}")
        loop.close()
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        import traceback
        logger.error(traceback.format_exc())