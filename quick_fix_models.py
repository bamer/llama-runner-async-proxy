#!/usr/bin/env python3
"""
Quick fix to remove missing models from config
"""
import json
import os

config_path = "config/app_config.json"

# Load config
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)

# Models to remove (from validation errors)
missing_models = [
    "Magistral-Small-2509-Q4_K_M",
    "OpenAI-20B-NEO-CODE-DI-Uncensored-Q5_1", 
    "Qwen3-Coder-30B-A3B-Instruct-Q4_K_M",
    "Q8_0_Qwen3-14B-128K-Q8_0",
    "gpt-oss-20b-Q4_K_S",
    "gpt-oss-20b-MXFP4"
]

print(f"Loaded config with {len(config.get('models', {}))} models")

# Check which models actually exist
models_to_remove = []
for model_name, model_info in list(config.get('models', {}).items()):
    model_path = model_info.get('model_path', '')
    if model_path and not os.path.exists(model_path):
        print(f"Model file not found: {model_path}")
        models_to_remove.append(model_name)
    else:
        print(f"✓ Model exists: {model_name}")

# Remove missing models
removed_count = 0
for model_name in models_to_remove:
    if model_name in config.get('models', {}):
        del config['models'][model_name]
        removed_count += 1
        print(f"Removed missing model: {model_name}")

print(f"Removed {removed_count} missing models")

# Also fix runtime names to be consistent
for model_name, model_info in config.get('models', {}).items():
    if model_info.get('llama_cpp_runtime') == 'default':
        model_info['llama_cpp_runtime'] = 'llama-server'

# Save updated config
with open(config_path, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print(f"Saved updated config with {len(config.get('models', {}))} models")
print("✅ Quick fix complete - system should now launch without validation errors")