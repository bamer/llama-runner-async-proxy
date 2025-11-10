import logging
import asyncio
from fastapi import FastAPI
from uvicorn import Config, Server

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def run_simple_server():
    logger.info("🚀 Démarrage serveur simple")
    
    try:
        # Créer une application FastAPI simple
        app = FastAPI()
        
        @app.get("/")
        async def root():
            return {"message": "Serveur simple fonctionnel!"}
        
        @app.get("/health")
        async def health():
            return {"status": "ok"}
        
        logger.info("🔧 Configuration du serveur...")
        config = Config(
            app=app,
            host="0.0.0.0",
            port=8000,
            log_level="debug"
        )
        
        server = Server(config)
        logger.info("▶️ Démarrage du serveur sur http://0.0.0.0:8000/")
        
        # Démarrer le serveur dans une tâche séparée
        server_task = asyncio.create_task(server.serve())
        
        # Attendre un peu pour laisser le temps au serveur de démarrer
        await asyncio.sleep(2)
        
        logger.info("✅ Serveur démarré avec succès!")
        
        # Tester le serveur avec une requête
        logger.info("🔍 Test de l'endpoint /health...")
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/health")
            logger.info(f"✅ Réponse /health: {response.status_code} - {response.json()}")
        
        logger.info("🛑 Arrêt du serveur...")
        server.should_exit = True
        await server_task
        
        logger.info("🎉 Test du serveur simple réussi!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du test du serveur: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 TEST DE SERVEUR SIMPLE FASTAPI/UVICORN")
    
    try:
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(run_simple_server())
        logger.info(f"✨ Résultat du test: {'SUCCÈS' if success else 'ÉCHEC'}")
        loop.close()
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        import traceback
        logger.error(traceback.format_exc())