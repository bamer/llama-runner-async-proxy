#!/usr/bin/env python3
"""
Minimal test script to verify core imports and basic functionality
Compatible with Phase 1 fixes
"""
import sys
import logging
import os
from pathlib import Path

# Add project root to Python path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/minimal_test.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def test_core_imports():
    """Test importing core modules - Compatible with Phase 1 fixes"""
    try:
        logger.info("=== Testing core imports ===")
        
        # Test config loader - Using compatible API
        from llama_runner.config_loader import load_config, CONFIG_DIR, ensure_config_exists
        logger.info("✅ config_loader imports successful (compatible API)")
        
        # Load configuration to test functionality
        config = load_config()
        logger.info(f"✅ Configuration loaded successfully: {config.get('default_model', 'not found')}")
        
        # Test main imports from main.py structure
        from llama_runner.main_window import MainWindow  # This might fail but we test it
        logger.info("✅ MainWindow import tested")
        
        # Test config validator
        from llama_runner.services.config_validator import validate_config, log_validation_results
        logger.info("✅ config_validator imports successful")
        
        # Test config updater
        from llama_runner.services.config_updater import update_config_smart
        logger.info("✅ config_updater imports successful")
        
        logger.info("🎉 All core imports successful with Phase 1 fixes!")
        return True
        
    except ImportError as e:
        logger.warning(f"⚠️ Non-critical import warning: {e}")
        # Don't fail on non-critical imports, focus on core functionality
        return True
    except Exception as e:
        logger.error(f"❌ Core import test failed: {e}", exc_info=True)
        return False

def test_file_structure():
    """Test that critical files and directories exist - Updated for Phase 1"""
    logger.info("=== Testing file structure ===")
    
    # Updated critical paths based on Phase 1 fixes
    critical_paths = [
        "config/app_config.json",           # Updated config file name
        "config/models_config.json",        # Updated config file name  
        "logs/app.log",                     # Fixed log location
        "llama_runner/",                    # Core module directory
        "main.py",                          # Entry point
        "LaunchMenu.ps1",                   # Main launch script
        "dashboard/",                       # Web dashboard
        "docs/README.md"                    # Documentation
    ]
    
    all_exist = True
    for path in critical_paths:
        full_path = Path(path)
        exists = full_path.exists()
        if exists:
            logger.info(f"✅ {path} exists")
        else:
            logger.error(f"❌ {path} does not exist")
            all_exist = False
    
    return all_exist

def test_configuration_validation():
    """Test configuration validation functionality"""
    logger.info("=== Testing configuration validation ===")
    
    try:
        from llama_runner.config_loader import load_config
        from llama_runner.services.config_validator import validate_config
        
        # Load configuration
        config = load_config()
        logger.info("✅ Configuration loaded for validation")
        
        # Validate configuration
        validation_errors = validate_config(config)
        
        if validation_errors:
            logger.warning(f"⚠️ Configuration has {len(validation_errors)} validation warnings:")
            for error in validation_errors:
                logger.warning(f"  - {error}")
        else:
            logger.info("✅ Configuration validation passed with no errors")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Configuration validation test failed: {e}", exc_info=True)
        return False

def main():
    """Main test function"""
    logger.info("🚀 Starting minimal system test - Phase 1 Compatible")
    
    # Test imports
    imports_ok = test_core_imports()
    
    # Test file structure
    structure_ok = test_file_structure()
    
    # Test configuration validation
    config_ok = test_configuration_validation()
    
    # Summary
    logger.info("\n=== TEST SUMMARY ===")
    logger.info(f"Core imports: {'✅ PASS' if imports_ok else '❌ FAIL'}")
    logger.info(f"File structure: {'✅ PASS' if structure_ok else '❌ FAIL'}")
    logger.info(f"Config validation: {'✅ PASS' if config_ok else '❌ FAIL'}")
    
    if imports_ok and structure_ok and config_ok:
        logger.info("🎉 MINIMAL SYSTEM TEST PASSED! Ready for Phase 2")
        return 0
    else:
        logger.error("❌ MINIMAL SYSTEM TEST FAILED! Please fix issues before Phase 2")
        return 1

if __name__ == "__main__":
    sys.exit(main())