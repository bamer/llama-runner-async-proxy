import logging
import asyncio
from fastapi import FastAPI
from uvicorn import Config, Server

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_ollama_service():
    logger.info("🚀 Test du service Ollama proxy simplifié")
    
    try:
        logger.info("🔧 Création application FastAPI pour Ollama")
        app = FastAPI()
        
        @app.get("/health")
        async def health():
            return {"status": "ok", "service": "ollama-proxy-test"}
        
        @app.get("/api/tags")
        async def get_tags():
            return {
                "models": [
                    {
                        "name": "test-model:latest",
                        "model": "test-model",
                        "size": 1000000,
                        "digest": "test-digest"
                    }
                ]
            }
        
        @app.post("/api/generate")
        async def generate(request: dict):
            return {
                "model": request.get("model", "test-model"),
                "created_at": "2025-11-10T01:50:00Z",
                "response": "Ceci est une réponse de test du proxy Ollama",
                "done": True
            }
        
        logger.info("🔧 Configuration du serveur Ollama sur port 11434")
        config = Config(
            app=app,
            host="0.0.0.0",
            port=11434,
            log_level="debug"
        )
        
        server = Server(config)
        logger.info("▶️ Démarrage du serveur Ollama")
        
        server_task = asyncio.create_task(server.serve())
        logger.info("✅ Serveur Ollama démarré avec succès")
        
        # Attendre un peu pour laisser le temps au serveur de démarrer
        await asyncio.sleep(2)
        
        logger.info("🔍 Test des endpoints Ollama")
        import httpx
        async with httpx.AsyncClient() as client:
            # Test health
            response = await client.get("http://localhost:11434/health")
            logger.info(f"✅ Health: {response.status_code} - {response.json()}")
            
            # Test tags
            response = await client.get("http://localhost:11434/api/tags")
            logger.info(f"✅ Tags: {response.status_code} - {response.json()}")
            
            # Test generate
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={"model": "test-model", "prompt": "Bonjour"}
            )
            logger.info(f"✅ Generate: {response.status_code} - {response.json()}")
        
        # Arrêter le serveur
        logger.info("🛑 Arrêt du serveur Ollama")
        server.should_exit = True
        await server_task
        
        logger.info("🎉 Test Ollama réussi !")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur Ollama: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 TEST DU SERVICE OLLAMA PROXY")
    
    try:
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(test_ollama_service())
        logger.info(f"✨ Résultat Ollama: {'SUCCÈS' if success else 'ÉCHEC'}")
        loop.close()
    except Exception as e:
        logger.error(f"❌ Erreur fatale Ollama: {e}")
        import traceback
        logger.error(traceback.format_exc())