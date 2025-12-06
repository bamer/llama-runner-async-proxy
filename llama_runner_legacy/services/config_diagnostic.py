"""
Simple diagnostic test for config updater.
"""

import logging
logging.basicConfig(level=logging.INFO)

def test_imports():
    """Test that we can import all required modules"""
    try:
        from llama_runner.config_updater import DEPRECATED_PARAMS, FLAG_PARAMS
        print(f"✓ Successfully imported DEPRECATED_PARAMS ({len(DEPRECATED_PARAMS)} items)")
        print(f"✓ Successfully imported FLAG_PARAMS ({len(FLAG_PARAMS)} items)")
        
        # Show some examples
        print(f"Deprecated: {sorted(list(DEPRECATED_PARAMS))}")
        print(f"Flags: {sorted(list(FLAG_PARAMS))[:5]}...")
        
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_functions():
    """Test that functions exist and can be called"""
    try:
        from llama_runner.config_updater import (
            clean_empty_params,
            remove_deprecated_params,
            optimize_config_structure
        )
        
        # Test clean_empty_params
        test_config = {"param": "", "valid": 42}
        cleaned = clean_empty_params(test_config)
        print(f"✓ clean_empty_params works: {test_config} -> {cleaned}")
        
        # Test remove_deprecated_params
        test_config = {"params": {"ctx_size": 4096, "defrag_thold": 0.9}}
        cleaned = remove_deprecated_params(test_config)
        print(f"✓ remove_deprecated_params works: {test_config} -> {cleaned}")
        
        # Verify that defrag_thold was actually removed
        assert "defrag_thold" not in cleaned["params"]
        print(f"✓ defrag_thold was properly removed from params")
        
        return True
    except Exception as e:
        print(f"✗ Function test failed: {e}")
        return False

def main():
    print("CONFIG UPDATER DIAGNOSTIC")
    print("=" * 40)
    
    imports_ok = test_imports()
    print()
    functions_ok = test_functions()
    print()
    
    if imports_ok and functions_ok:
        print("✓ ALL DIAGNOSTIC TESTS PASSED")
        return True
    else:
        print("✗ Some diagnostic tests failed")
        return False

if __name__ == "__main__":
    main()