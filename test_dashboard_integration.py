import asyncio
import sys
import os

# Ajouter le chemin du projet
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from llama_runner.config_loader import load_config, load_models_config
from llama_runner.headless_service_manager import HeadlessServiceManager

async def test_dashboard_integration():
    print("🔍 Test d'intégration du service Dashboard API...")
    
    # Charger les configurations
    try:
        app_config = load_config()
        models_config = load_models_config()
        print("✅ Configurations chargées")
    except Exception as e:
        print(f"❌ Erreur de chargement des configurations: {e}")
        return False
    
    # Initialiser le service manager
    try:
        hsm = HeadlessServiceManager(app_config, models_config)
        print("✅ HeadlessServiceManager initialisé")
        
        # Vérifier que les services sont correctement initialisés
        if hsm.dashboard_api_service is not None:
            print("✅ Service Dashboard API initialisé")
        else:
            print("❌ Service Dashboard API non initialisé")
            return False
            
        if hsm.metrics_collector is not None:
            print("✅ Metrics Collector initialisé")
        else:
            print("❌ Metrics Collector non initialisé")
            return False
            
        print("✅ Tous les services sont correctement intégrés")
        return True
        
    except Exception as e:
        print(f"❌ Erreur d'initialisation: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_dashboard_integration())
    if success:
        print("\n🎉 Test d'intégration réussi ! Le dashboard devrait maintenant fonctionner correctement.")
    else:
        print("\n❌ Échec du test d'intégration.")
