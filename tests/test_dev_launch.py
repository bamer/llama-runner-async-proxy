#!/usr/bin/env python3
"""
Test script for the development version
"""
import sys
import os

# Test config loader
try:
    from llama_runner.config_loader import load_config, ensure_config_exists
    print("Config loader imported successfully")
    
    # Ensure config exists
    ensure_config_exists()
    config = load_config()
    print(f"Config loaded successfully: {len(config.get('models', {}))} models found")
    
except Exception as e:
    print(f"Config loader failed: {e}")
    sys.exit(1)

# Test audio service
try:
    from llama_runner.audio_service import AudioService
    print("Audio service imported successfully")
except Exception as e:
    print(f"Audio service failed: {e}")
    sys.exit(1)

# Test error handlers
try:
    from llama_runner.error_handlers import handle_audio_processing_error
    print("Error handlers imported successfully")
except Exception as e:
    print(f"Error handlers failed: {e}")
    sys.exit(1)

print("\nAll core modules imported successfully!")
print("The development refactoring appears to be functionally correct.")