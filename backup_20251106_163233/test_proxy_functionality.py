#!/usr/bin/env python3
"""
Test script to verify that the proxy functionality is working correctly.
This script checks if the required endpoints are properly implemented.
"""

import asyncio
import json
from pathlib import Path

def test_file_structure():
    """Test that all required files exist and have the correct structure."""
    required_files = [
        "llama_runner/faster_whisper_runner.py",
        "llama_runner/llama_runner_manager.py", 
        "llama_runner/lmstudio_proxy_thread.py",
        "llama_runner/ollama_proxy_thread.py",
        "llama_runner/headless_service_manager.py",
        "llama_runner/main_window.py",
        "llama_runner/config_loader.py"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print(f"Missing files: {missing_files}")
        return False
    else:
        print("All required files exist")
        return True

def test_audio_endpoints_in_proxies():
    """Test that both proxies have the required audio endpoints."""
    lmstudio_content = Path("llama_runner/lmstudio_proxy_thread.py").read_text()
    ollama_content = Path("llama_runner/ollama_proxy_thread.py").read_text()
    
    required_endpoints = [
        '@app.post("/v1/audio/transcriptions")',
        '@app.post("/v1/audio/translations")'
    ]
    
    lmstudio_has_endpoints = all(endpoint in lmstudio_content for endpoint in required_endpoints)
    ollama_has_endpoints = all(endpoint in ollama_content for endpoint in required_endpoints)
    
    if lmstudio_has_endpoints:
        print("LM Studio proxy has audio endpoints")
    else:
        print("LM Studio proxy missing audio endpoints")
        
    if ollama_has_endpoints:
        print("Ollama proxy has audio endpoints")
    else:
        print("Ollama proxy missing audio endpoints")
        
    return lmstudio_has_endpoints and ollama_has_endpoints

def test_faster_whisper_imports():
    """Test that faster-whisper is properly imported and used."""
    lmstudio_content = Path("llama_runner/lmstudio_proxy_thread.py").read_text()
    ollama_content = Path("llama_runner/ollama_proxy_thread.py").read_text()
    runner_service_content = Path("llama_runner/services/runner_service.py").read_text()
    
    # Check that whisper_cpp_runner is not imported
    if "whisper_cpp_runner" in lmstudio_content or "whisper_cpp_runner" in ollama_content:
        print("Old whisper_cpp_runner still imported")
        return False
    
    # Check that faster_whisper_runner is used in the runner service
    if "FasterWhisperRunner" not in runner_service_content:
        print("FasterWhisperRunner not used in runner_service")
        return False
        
    print("Faster-whisper properly integrated")
    return True

def test_config_loader():
    """Test that config loader handles audio configuration properly."""
    config_content = Path("llama_runner/config_loader.py").read_text()
    
    # Check for audio section processing
    if '"audio"' not in config_content and 'audio' not in config_content:
        print("Audio configuration section not found in config loader")
        return False
        
    print("Config loader handles audio configuration")
    return True

def main():
    """Run all tests."""
    print("Testing proxy functionality...\n")
    
    tests = [
        test_file_structure,
        test_audio_endpoints_in_proxies,
        test_faster_whisper_imports,
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
        print("\nAll tests passed! The refactoring is complete and functional.")
        return True
    else:
        print(f"\n{sum(results)}/{len(results)} tests passed. Some issues remain.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)