"""Tests for config updater."""
import pytest
import json
import tempfile
from pathlib import Path
from llama_runner.config_updater import (
    get_config_version,
    migrate_v1_to_v2,
    apply_migrations,
    auto_cleanup_models,
    optimize_config_structure,
    CURRENT_CONFIG_VERSION
)

def test_get_config_version():
    """Test getting config version."""
    assert get_config_version({}) == 1
    assert get_config_version({"config_version": 2}) == 2

def test_migrate_v1_to_v2():
    """Test v1 to v2 migration."""
    v1_config = {
        "models": {},
        "runtimes": {"default": {"runtime": "llama-server"}}
    }
    
    v2_config = migrate_v1_to_v2(v1_config)
    
    assert v2_config["config_version"] == 2
    assert "model_discovery" in v2_config
    assert "metrics" in v2_config
    assert "llama-runtimes" in v2_config

def test_auto_cleanup_models():
    """Test cleanup of missing auto-discovered models."""
    config = {
        "models": {
            "model1": {
                "model_path": "/nonexistent/path.gguf",
                "auto_discovered": True
            },
            "model2": {
                "model_path": "/some/path.gguf",
                "auto_discovered": False  # Manual, should be kept
            }
        }
    }
    
    cleaned = auto_cleanup_models(config)
    
    # Auto-discovered missing model should be removed
    assert "model1" not in cleaned["models"]
    # Manual model should be kept even if missing
    assert "model2" in cleaned["models"]

def test_optimize_config_structure():
    """Test config structure optimization."""
    config = {
        "models": {
            "test_model": {
                "model_path": "/path/to/model.gguf"
                # Missing display_name and llama_cpp_runtime
            }
        },
        "empty_section": {},  # Should be removed
        "default_runtime": "default"
    }
    
    optimized = optimize_config_structure(config)
    
    # Empty section should be removed
    assert "empty_section" not in optimized
    
    # Model should have defaults added
    model = optimized["models"]["test_model"]
    assert "display_name" in model
    assert "llama_cpp_runtime" in model

def test_apply_migrations_creates_backup():
    """Test that migrations create backups."""
    with tempfile.TemporaryDirectory() as tmpdir:
        config_path = Path(tmpdir) / "config.json"
        v1_config = {
            "models": {},
            "concurrentRunners": 1
        }
        
        with open(config_path, 'w') as f:
            json.dump(v1_config, f)
        
        apply_migrations(v1_config, config_path)
        
        # Check backup was created
        backups = list(Path(tmpdir).glob("config_backup_*.json"))
        assert len(backups) == 1

def test_apply_migrations_updates_version():
    """Test that migration updates version correctly."""
    with tempfile.TemporaryDirectory() as tmpdir:
        config_path = Path(tmpdir) / "config.json"
        v1_config = {"models": {}}
        
        with open(config_path, 'w') as f:
            json.dump(v1_config, f)
        
        migrated = apply_migrations(v1_config, config_path)
        
        assert migrated["config_version"] == CURRENT_CONFIG_VERSION
