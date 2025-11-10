import logging
import asyncio
from fastapi import FastAPI
from uvicorn import Config, Server
from typing import Dict, Any, Callable, Optional, Awaitable

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Mock classes pour simuler notre structure réelle
class MockRunnerManager:
    def __init__(self):
        self.running_models = {}
    
    def get_runner_port(self, model_name: str) -> Optional[int]:
        logger.debug(f"🔍 get_runner_port appelé pour {model_name}")
        return self.running_models.get(model_name, 8035)
    
    async def request_runner_start(self, model_name: str) -> int:
        logger.debug(f"🚀 request_runner_start appelé pour {model_name}")
        if model_name not in self.running_models:
            self.running_models[model_name] = 8035
        return self.running_models[model_name]
    
    def is_llama_runner_running(self, model_name: str) -> bool:
        return model_name in self.running_models

class MockProxyServer:
    def __init__(self, runner_manager: MockRunnerManager):
        self.runner_manager = runner_manager
        self._runner_ready_futures = {}
    
    async def start(self):
        logger.info("🔧 Mock proxy server démarré")

async def run_realistic_proxy_test():
    logger.info("🚀 Démarrage test proxy réaliste")
    
    try:
        # Créer les mocks
        logger.info("🔧 Création des mocks...")
        mock_runner_manager = MockRunnerManager()
        mock_proxy_server = MockProxyServer(mock_runner_manager)
        
        # Créer une application FastAPI réaliste
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
        
        logger.info("🔧 Configuration des endpoints réaliste...")
        
        # Endpoint de health check
        @app.get("/health")
        async def health_check():
            logger.info("🔍 Health check appelé")
            return {
                "status": "healthy",
                "service": "realistic_proxy_test",
                "running_models": len(mock_runner_manager.running_models)
            }
        
        # Endpoint pour les modèles
        @app.get("/api/v0/models")
        async def get_models():
            logger.info("🔍 Endpoint /api/v0/models appelé")
            return {
                "object": "list",
                "data": [
                    {
                        "id": "test-model",
                        "object": "model",
                        "created": 1677649963,
                        "owned_by": "organization-owner",
                        "display_name": "Test Model",
                        "context_length": 2048,
                        "supports_stream": True,
                        "supports_tools": False,
                        "supports_vision": False
                    }
                ]
            }
        
        # Endpoint pour les chat completions
        @app.post("/api/v0/chat/completions")
        async def chat_completions(request: Dict[str, Any]):
            logger.info("💬 Endpoint chat/completions appelé")
            model_name = request.get("model", "test-model")
            logger.debug(f"🔍 Modèle demandé: {model_name}")
            
            # Simuler le démarrage du runner si nécessaire
            if model_name not in mock_runner_manager.running_models:
                logger.info(f"🔄 Démarrage du runner pour {model_name}")
                port = await mock_runner_manager.request_runner_start(model_name)
                logger.info(f"✅ Runner démarré pour {model_name} sur le port {port}")
            
            return {
                "id": "chatcmpl-123",
                "object": "chat.completion",
                "created": 1677649963,
                "model": model_name,
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Je suis un modèle test fonctionnel!"
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 15,
                    "total_tokens": 25
                }
            }
        
        # Configurer le state de l'application comme dans notre code réel
        logger.info("🔧 Configuration du state de l'application...")
        app.state.get_runner_port_callback = mock_runner_manager.get_runner_port
        app.state.request_runner_start_callback = mock_runner_manager.request_runner_start
        app.state.is_model_running_callback = mock_runner_manager.is_llama_runner_running
        app.state.proxy_thread_instance = mock_proxy_server
        app.state.llama_runner_manager = mock_runner_manager
        app.state.all_models_config = {
            "test-model": {
                "model_path": "models/test-model.gguf",
                "llama_cpp_runtime": "test-runtime",
                "parameters": {
                    "ctx_size": 2048,
                    "temp": 0.7,
                    "n_gpu_layers": 0,
                    "port": 8035,
                    "host": "127.0.0.1"
                },
                "display_name": "Test Model",
                "auto_discovered": False,
                "auto_update_model": False,
                "has_tools": False
            }
        }
        
        logger.info("🔧 Configuration du serveur réaliste...")
        config = Config(
            app=app,
            host="0.0.0.0",
            port=1234,
            log_level="debug"
        )
        
        server = Server(config)
        logger.info("▶️ Démarrage du serveur réaliste sur http://0.0.0.0:1234/")
        
        # Démarrer le serveur dans une tâche séparée
        server_task = asyncio.create_task(server.serve())
        
        # Attendre un peu pour laisser le temps au serveur de démarrer
        await asyncio.sleep(2)
        
        logger.info("✅ Serveur réaliste démarré avec succès!")
        
        # Tester le serveur avec des requêtes réalistes
        logger.info("🔍 Test des endpoints réalistes...")
        import httpx
        async with httpx.AsyncClient() as client:
            # Test health check
            response = await client.get("http://localhost:1234/health")
            logger.info(f"✅ Health check: {response.status_code} - {response.json()}")
            
            # Test models endpoint
            response = await client.get("http://localhost:1234/api/v0/models")
            logger.info(f"✅ /api/v0/models: {response.status_code} - {response.json()}")
            
            # Test chat completions
            response = await client.post(
                "http://localhost:1234/api/v0/chat/completions",
                json={
                    "model": "test-model",
                    "messages": [{"role": "user", "content": "Bonjour!"}],
                    "stream": False
                }
            )
            logger.info(f"✅ /api/v0/chat/completions: {response.status_code} - {response.json()}")
        
        logger.info("🛑 Arrêt du serveur réaliste...")
        server.should_exit = True
        await server_task
        
        logger.info("🎉 Test du proxy réaliste réussi!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du test du proxy réaliste: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("🏁 TEST DE PROXY RÉALISTE")
    
    try:
        loop = asyncio.get_event_loop()
        success = loop.run_until_complete(run_realistic_proxy_test())
        logger.info(f"✨ Résultat du test: {'SUCCÈS' if success else 'ÉCHEC'}")
        loop.close()
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        import traceback
        logger.error(traceback.format_exc())