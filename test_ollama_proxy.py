import logging
import asyncio
from fastapi import FastAPI
from uvicorn import Config, Server

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def run_ollama_proxy_test():
    logger.info("🚀 Démarrage test proxy Ollama simplifié")
    
    try:
        # Créer une application FastAPI pour le proxy Ollama
        app = FastAPI()
        
        # Ajouter middleware CORS
        from fastapi.middleware.cors import CORSMiddleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        logger.info("🔧 Configuration des endpoints...")
        
        # Endpoint de health check simple
        @app.get("/health")
        async def health_check():
            logger.info("🔍 Health check appelé")
            return {"status": "ok", "service": "ollama_proxy_test"}
        
        # Endpoint de test pour les modèles
        @app.get("/api/tags")
        async def get_tags():
            logger.info("🔍 Endpoint /api/tags appelé")
            return {
                "models": [
                    {
                        "name": "test-model:latest",
                        "model": "test-model",
                        "size": 1000000,
                        "digest": "test-digest",
                        "details": {
                            "format": "gguf",
                            "family": "test",
                            "parameter_size": "1B",
                            "quantization_level": "Q4_0"
                        }
                    }
                ]
            }
        
        logger.info("🔧 Configuration du serveur Ollama proxy...")
        config = Config(
            app=app,
            host="0.0.0.0",
            port=11434,
            log_level="debug"
        )
        
        server = Server(config)
        logger.info("▶️ Démarrage du serveur Ollama proxy sur http://0.0.0.0:11434/")
        
        # Démarrer le serveur dans une tâche séparée
        server_task = asyncio.create_task(server.serve())
        
        # Attendre un peu pour laisser le temps au serveur de démarrer
        await asyncio.sleep(2)
        
        logger.info("✅ Serveur Ollama proxy démarré avec succès!")
        
        # Tester le serveur avec des requêtes
        logger.info("🔍 Test des endpoints...")
        import httpx
        async with httpx.AsyncClient() as client:
            # Test health check
            response = await client.get("http://localhost:11434/health")
            logger.info(f"✅ Health check: {response.status_code} - {response.json()}")
            
            # Test tags endpoint
            response = await client.get("http://localhost:11434/api/tags")
            logger.info(f"✅ /api/tags: {response.status_code} - {response.json()}")
        
        logger.info("🛑 Arrêt du serveur Ollama proxy...")
        server.should_exit = True
        await server_task
        
        logger.info("🎉 Test du proxy Ollama simplifié réussi!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du test du proxy Ollama: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 TEST DE PROXY OLLAMA SIMPLIFIÉ")
    
    try:
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(run_ollama_proxy_test())
        logger.info(f"✨ Résultat du test: {'SUCCÈS' if success else 'ÉCHEC'}")
        loop.close()
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        import traceback
        logger.error(traceback.format_exc())