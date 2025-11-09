"""
Test script for enhanced config updater.

This script demonstrates the improved config updater with:
- Professional typing
- Comprehensive logging
- Debug output
- Edge case handling
"""
import json
import logging
import tempfile
from pathlib import Path
from llama_runner.config_updater import (
    update_config_smart,
    clean_empty_params,
    remove_deprecated_params,
    FLAG_PARAMS,
    DEPRECATED_PARAMS
)

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def test_clean_empty_params():
    """Test the clean_empty_params function."""
    logger.info("=" * 60)
    logger.info("Testing clean_empty_params function")
    logger.info("=" * 60)
    
    # Test params with mix of empty and valid values
    test_params = {
        "ctx_size": 4096,              # Valid value - keep
        "n_gpu_layers": 35,             # Valid value - keep
        "empty_string": "",             # Empty - remove
        "none_value": None,             # None - remove
        "empty_dict": {},               # Empty dict - remove
        "flash-attn": "",               # Flag parameter - keep even if empty
        "jinja": None,                  # Flag parameter - keep even if empty
        "zero_value": 0,                # Zero is valid - keep
        "false_value": False,           # False is valid - keep
    }
    
    logger.info(f"Input params: {test_params}")
    cleaned = clean_empty_params(test_params)
    logger.info(f"Cleaned params: {cleaned}")
    
    # Verify results
    assert "ctx_size" in cleaned
    assert "n_gpu_layers" in cleaned
    assert "empty_string" not in cleaned
    assert "none_value" not in cleaned
    assert "empty_dict" not in cleaned
    assert "flash-attn" in cleaned  # Flag param kept
    assert "jinja" in cleaned       # Flag param kept
    assert "zero_value" in cleaned  # Zero is valid
    assert "false_value" in cleaned # False is valid
    
    logger.info("✓ clean_empty_params test passed")
    return cleaned


def test_full_config_update():
    """Test the complete config update process."""
    logger.info("=" * 60)
    logger.info("Testing full config update")
    logger.info("=" * 60)
    
    # Create a temporary test config
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        test_config = {
            "models": {
                "test-model-1": {
                    "model_path": "C:\\models\\test.gguf",
                    "params": {
                        "ctx_size": 4096,
                        "n_gpu_layers": 35,
                        "empty_param": "",
                        "flash-attn": "",  # Flag param
                        "null_param": None
                    },
                    "auto_discovered": False
                },
                "test-model-2": {
                    "model_path": "C:\\models\\nonexistent.gguf",
                    "params": {
                        "ctx_size": 2048
                    },
                    "auto_discovered": True  # Will be cleaned up
                }
            },
            "default_runtime": "llama-server",
            "concurrentRunners": 1,
            "proxies": {
                "ollama": {"enabled": True}
            }
        }
        json.dump(test_config, f, indent=2)
        config_path = Path(f.name)
    
    logger.info(f"Created test config at: {config_path}")
    logger.info(f"Initial config: {json.dumps(test_config, indent=2)}")
    
    try:
        # Run the smart config update
        logger.info("Running smart config update...")
        updated_config = update_config_smart(config_path, force_backup=True)
        
        logger.info("=" * 60)
        logger.info("Updated config:")
        logger.info(json.dumps(updated_config, indent=2))
        logger.info("=" * 60)
        
        # Verify updates
        assert "config_version" in updated_config, "Config version should be added"
        logger.info(f"✓ Config version: {updated_config['config_version']}")
        
        # Check that model-2 was cleaned up (file doesn't exist)
        if "test-model-2" not in updated_config.get("models", {}):
            logger.info("✓ Auto-discovered missing model was cleaned up")
        
        # Check that empty params were cleaned (except flags)
        model1_params = updated_config.get("models", {}).get("test-model-1", {}).get("params", {})
        assert "empty_param" not in model1_params, "Empty param should be removed"
        assert "null_param" not in model1_params, "Null param should be removed"
        assert "flash-attn" in model1_params, "Flag param should be kept"
        logger.info("✓ Parameters cleaned correctly")
        
        # Check model_discovery section was added
        assert "model_discovery" in updated_config, "model_discovery should be added"
        logger.info("✓ model_discovery section added")
        
        # Check metrics section was added
        assert "metrics" in updated_config, "metrics should be added"
        logger.info("✓ metrics section added")
        
        logger.info("=" * 60)
        logger.info("✓ All config update tests passed!")
        logger.info("=" * 60)
        
    finally:
        # Cleanup
        if config_path.exists():
            config_path.unlink()
            logger.info(f"Cleaned up test file: {config_path}")
        
        # Clean up backup files
        backup_files = list(config_path.parent.glob(f"{config_path.stem}_backup_*.json"))
        for backup in backup_files:
            backup.unlink()
            logger.info(f"Cleaned up backup file: {backup}")


def test_flag_params():
    """Test that flag parameters are correctly identified."""
    logger.info("=" * 60)
    logger.info("Testing FLAG_PARAMS")
    logger.info("=" * 60)
    
    logger.info(f"Known flag parameters: {FLAG_PARAMS}")
    
    # These should be in FLAG_PARAMS
    expected_flags = ["flash-attn", "jinja", "no-perf", "mlock"]
    for flag in expected_flags:
        assert flag in FLAG_PARAMS, f"{flag} should be a flag parameter"
        logger.info(f"✓ {flag} is a flag parameter")
    
    logger.info("✓ FLAG_PARAMS test passed")


if __name__ == "__main__":
    try:
        logger.info("Starting enhanced config updater tests")
        logger.info("=" * 60)
        
        # Run tests
        test_flag_params()
        test_clean_empty_params()
        test_full_config_update()
        
        logger.info("=" * 60)
        logger.info("ALL TESTS PASSED ✓✓✓")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        raise
