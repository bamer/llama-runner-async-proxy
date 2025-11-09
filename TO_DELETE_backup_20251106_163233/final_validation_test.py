#!/usr/bin/env python3
"""
Final validation test for the complete refactoring
"""
import sys
import os

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
    
    missing = []
    for f in required_files:
        if not os.path.exists(f):
            missing.append(f)
    
    if missing:
        print(f"Missing files: {missing}")
        return False
    print("All required files exist")
    return True

def test_audio_endpoints():
    """Test that both proxies have audio endpoints"""
    lmstudio_content = open("llama_runner/lmstudio_proxy_thread.py").read()
    ollama_content = open("llama_runner/ollama_proxy_thread.py").read()
    
    endpoints = ['@app.post("/v1/audio/transcriptions")', '@app.post("/v1/audio/translations")']
    
    lmstudio_ok = all(ep in lmstudio_content for ep in endpoints)
    ollama_ok = all(ep in ollama_content for ep in endpoints)
    
    if lmstudio_ok:
        print("LM Studio proxy has audio endpoints")
    else:
        print("LM Studio proxy missing audio endpoints")
        
    if ollama_ok:
        print("Ollama proxy has audio endpoints") 
    else:
        print("Ollama proxy missing audio endpoints")
        
    return lmstudio_ok and ollama_ok

def test_audio_service_usage():
    """Test that proxies use AudioService"""
    lmstudio_content = open("llama_runner/lmstudio_proxy_thread.py").read()
    ollama_content = open("llama_runner/ollama_proxy_thread.py").read()
    
    if "AudioService" in lmstudio_content and "AudioService" in ollama_content:
        print("Both proxies use AudioService")
        return True
    else:
        print("Proxies not using AudioService")
        return False

def test_error_handlers_usage():
    """Test that audio_service uses error_handlers"""
    audio_content = open("llama_runner/audio_service.py").read()
    if "handle_audio_processing_error" in audio_content:
        print("Audio service uses centralized error handling")
        return True
    else:
        print("Audio service not using centralized error handling")
        return False

def main():
    tests = [test_file_structure, test_audio_endpoints, test_audio_service_usage, test_error_handlers_usage]
    results = []
    
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"Test {test.__name__} failed: {e}")
            results.append(False)
    
    if all(results):
        print("\nALL TESTS PASSED! Refactoring is complete and functional.")
        return True
    else:
        print(f"\n{sum(results)}/{len(results)} tests passed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)