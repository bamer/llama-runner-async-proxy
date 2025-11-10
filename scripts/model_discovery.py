#!/usr/bin/env python
"""
Script de découverte automatique des modèles GGUF dans le répertoire des modèles.
Ce script scanne le répertoire '..\\llama\\models' et ajoute tous les fichiers .gguf
à la configuration des modèles, en préservant les paramètres existants des modèles déjà configurés.
"""

import sys
import json
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/model_discovery.log')
    ]
)

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from llama_runner.config_loader import (
        discover_and_add_models,
        load_models_config,
        MODELS_CONFIG_FILE
    )
except ImportError as e:
    logging.error(f"❌ Error importing config_loader: {e}")
    logging.error("💡 CONSEIL: Vérifiez que le fichier config_loader.py est correctement configuré")
    sys.exit(1)

def main():
    """Fonction principale de découverte des modèles."""
    logging.info("=== DÉMARRAGE DÉCOUVERTE AUTOMATIQUE DES MODÈLES ===")
    
    try:
        # Découvrir les modèles dans le répertoire par défaut
        new_models, preserved = discover_and_add_models(
            model_directory="..\\llama\\models",
            auto_save=True
        )
        
        logging.info(f"✅ {new_models} nouveaux modèles ajoutés")
        logging.info(f"✅ {preserved} modèles existants préservés")
        
        # Charger et afficher la configuration mise à jour
        models_config = load_models_config()
        logging.info(f"\n📊 Configuration des modèles mise à jour:")
        logging.info(f"   Modèle par défaut: {models_config.get('default_model', 'non défini')}")
        
        models = models_config.get('models', {})
        logging.info(f"   Total des modèles: {len(models)}")
        
        for model_name, model_config in models.items():
            logging.info(f"   - {model_name}")
            logging.info(f"     📁 Chemin: {model_config.get('model_path')}")
            params = model_config.get('parameters', {})
            logging.info(f"     ⚙️  Paramètres: n_gpu_layers={params.get('n_gpu_layers', 'N/A')}, ctx_size={params.get('ctx_size', 'N/A')}")
        
        # Vérifier si des modèles ont été ajoutés
        if new_models > 0:
            logging.info("\n💡 CONSEILS:")
            logging.info("   - Redémarrez l'application pour que les nouveaux modèles soient pris en compte")
            logging.info("   - Vous pouvez modifier les paramètres des nouveaux modèles via le menu interactif")
            logging.info("   - Le premier modèle ajouté est automatiquement défini comme modèle par défaut")
        
        return 0
        
    except Exception as e:
        logging.error(f"❌ Erreur lors de la découverte des modèles: {e}")
        logging.exception("Détails de l'erreur:")
        return 1

if __name__ == "__main__":
    sys.exit(main())