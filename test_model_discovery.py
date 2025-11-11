#!/usr/bin/env python3
"""Test script for model discovery."""

from llama_runner.config_loader import load_models_config

if __name__ == "__main__":
    config = load_models_config()
    models = config.get("models", {})
    print(f"Nombre de modèles chargés: {len(models)}")
    for name in list(models.keys())[:5]:  # Afficher les 5 premiers
        print(f" - {name}: {models[name]['model_path']}")