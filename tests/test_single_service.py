import logging
import asyncio
from fastapi import FastAPI
from uvicorn import Config, Server

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_single_service():
    logger.info("🚀 Test d'un service individuel")
    
    try:
        logger.info("🔧 Création application FastAPI simple")
        app = FastAPI()
        
        @app.get("/health")
        async def health():
            return {"status": "ok", "service": "test-single-service"}
        
        logger.info("🔧 Configuration du serveur sur port 8081")
        config = Config(
            app=app,
            host="0.0.0.0",
            port=8081,
            log_level="debug"
        )
        
        server = Server(config)
        logger.info("▶️ Démarrage du serveur")
        
        server_task = asyncio.create_task(server.serve())
        logger.info("✅ Serveur démarré avec succès")
        
        # Attendre un peu pour laisser le temps au serveur de démarrer
        await asyncio.sleep(2)
        
        logger.info("🔍 Test de l'endpoint /health")
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8081/health")
            logger.info(f"✅ Réponse: {response.status_code} - {response.json()}")
        
        # Arrêter le serveur
        logger.info("🛑 Arrêt du serveur")
        server.should_exit = True
        await server_task
        
        logger.info("🎉 Test réussi !")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 TEST DE SERVICE INDIVIDUEL")
    
    try:
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(test_single_service())
        logger.info(f"✨ Résultat: {'SUCCÈS' if success else 'ÉCHEC'}")
        loop.close()
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        import traceback
        logger.error(traceback.format_exc())