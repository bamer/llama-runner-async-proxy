"""
Final validation of the enhanced config updater system.
Complete test of all functionalities.
"""

import logging
from llama_runner.config_updater import (
    DEPRECATED_PARAMS, 
    FLAG_PARAMS, 
    clean_empty_params,
    remove_deprecated_params,
    optimize_config_structure
)


def setup_logging():
    """Setup logging for validation"""
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)


def test_deprecated_params():
    """Test that deprecated parameters are properly defined"""
    logger = logging.getLogger(__name__)
    
    logger.info("Testing DEPRECATED_PARAMS...")
    
    # Verify that defrag-thold and dt are marked as deprecated
    assert "defrag-thold" in DEPRECATED_PARAMS
    assert "dt" in DEPRECATED_PARAMS
    
    logger.info(f"Found {len(DEPRECATED_PARAMS)} deprecated parameters")
    
    return True


def test_flag_params():
    """Test that flag parameters are properly defined"""
    logger = logging.getLogger(__name__)
    
    logger.info("Testing FLAG_PARAMS...")
    
    # Verify some important flags
    important_flags = ["flash-attn", "jinja", "mlock", "no-mmap", "no-kv-offload"]
    for flag in important_flags:
        assert flag in FLAG_PARAMS
    
    logger.info(f"Found {len(FLAG_PARAMS)} flag parameters")
    
    return True


def test_clean_empty_params():
    """Test the empty parameters cleaning function"""
    logger = logging.getLogger(__name__)
    
    logger.info("Testing clean_empty_params...")
    
    # Test with normal empty parameters
    test_config = {
        "ctx_size": 4096,
        "threads": 4,
        "empty_param": "",
        "null_param": None,
        "zero_param": 0,
        "flash_attn": "",
        "jinja": "",
    }
    
    original_count = len(test_config)
    cleaned_config = clean_empty_params(test_config)
    cleaned_count = len(cleaned_config)
    
    logger.info(f"Config size: {original_count} -> {cleaned_count}")
    
    # Verify results
    assert "empty_param" not in cleaned_config
    assert "null_param" not in cleaned_config
    assert "flash_attn" in cleaned_config
    assert "jinja" in cleaned_config
    
    return True


def test_remove_deprecated_params():
    """Test the deprecated parameters removal"""
    logger = logging.getLogger(__name__)
    
    logger.info("Testing remove_deprecated_params...")
    
    test_config = {
        "ctx_size": 4096,
        "threads": 4,
        "defrag_thold": 0.9,
        "dt": 512,
        "gpu_layers": 20,
    }
    
    original_count = len(test_config)
    cleaned_config = remove_deprecated_params(test_config)
    cleaned_count = len(cleaned_config)
    
    logger.info(f"Config size: {original_count} -> {cleaned_count}")
    
    # Verify results
    assert "defrag_thold" not in cleaned_config
    assert "dt" not in cleaned_config
    assert "gpu_layers" in cleaned_config
    
    return True


def test_optimize_config_structure():
    """Test config structure optimization"""
    logger = logging.getLogger(__name__)
    
    logger.info("Testing optimize_config_structure...")
    
    test_config = {
        "models": {
            "test_model": {
                "model_path": "/path/to/model.gguf",
                "ctx_size": 4096,
                "threads": 4,
                "empty_param": "",
                "defrag_thold": 0.9,
            }
        },
        "global_model_parameters": {
            "temperature": 0.7,
            "top_p": 0.9,
        },
        "empty_section": {},
    }
    
    optimized_config = optimize_config_structure(test_config)
    
    # Verify structure is preserved
    assert "models" in optimized_config
    assert "test_model" in optimized_config["models"]
    
    # Verify parameter cleaning
    model_params = optimized_config["models"]["test_model"]
    assert "empty_param" not in model_params
    assert "defrag_thold" not in model_params
    
    return True


def main():
    """Main validation function"""
    logger = setup_logging()
    
    logger.info("=" * 60)
    logger.info("CONFIG UPDATER ENHANCED - FINAL VALIDATION")
    logger.info("=" * 60)
    
    tests = [
        ("Deprecated Parameters", test_deprecated_params),
        ("Flag Parameters", test_flag_params), 
        ("Empty Params Cleaning", test_clean_empty_params),
        ("Deprecated Params Removal", test_remove_deprecated_params),
        ("Config Structure Optimization", test_optimize_config_structure),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            logger.info(f"\n--- {test_name} ---")
            test_func()
            passed += 1
            logger.info(f"PASSED")
        except Exception as e:
            failed += 1
            logger.error(f"FAILED: {e}")
    
    logger.info("\n" + "=" * 60)
    logger.info(f"VALIDATION COMPLETED: {passed} passed, {failed} failed")
    logger.info("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    if success:
        print("ALL TESTS PASSED - Config updater is ready!")
    else:
        print("Some tests failed - review needed")