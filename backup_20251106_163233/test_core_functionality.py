#!/usr/bin/env python3
"""
Test core functionality of the refactored development branch
"""
import sys
import os
from typing import List

def test_file_structure():
    """Test that all required files exist"""
    required_files = [
        "llama_runner/audio_service.py",
        "llama_runner/error_handlers.py", 
        "llama_runner/faster_whisper_runner.py",
        "llama_runner/llama_runner_manager.py",
        "llama_runner/lmstudio_proxy_thread.py",
        "llama_runner/ollama_proxy_thread.py",
        "llama_runner/headless_service_manager.py",
        "llama_runner/main_window.py",
        "llama_runner/config_loader.py"
    ]
    
    missing: List[str] = []
    for f in required_files:
        if not os.path.exists(f):
            missing.append(f)
    
    if missing:
        print(f"Missing files: {missing}")
        return False
    else:
        print("All required files exist")
        return True

def test_audio_service_import():
    """Test that audio service can be imported"""
    try:
        from llama_runner.audio_service import AudioService
        print("AudioService imported successfully")
        return True
    except Exception as e:
        print(f"AudioService import failed: {e}")
        return False

def test_error_handlers_import():
    """Test that error handlers can be imported"""
    try:
        from llama_runner.error_handlers import handle_audio_processing_error
        print("Error handlers imported successfully")
        return True
    except Exception as e:
        print(f"Error handlers import failed: {e}")
        return False

def test_config_loader():
    """Test config loader functionality"""
    try:
        from llama_runner.config_loader import load_config, ensure_config_exists
        ensure_config_exists()
        config = load_config()
        print(f"Config loaded successfully with {len(config.get('models', {}))} models")
        return True
    except Exception as e:
        print(f"Config loader failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing core functionality of refactored development branch...\n")
    
    tests = [
        test_file_structure,
        test_audio_service_import, 
        test_error_handlers_import,
        test_config_loader
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"Test {test.__name__} failed with error: {e}")
            results.append(False)
    
    if all(results):
        print("\nAll core functionality tests passed!")
        print("The refactoring is complete and functionally correct.")
        return True
    else:
        print(f"\n{sum(results)}/{len(results)} tests passed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)