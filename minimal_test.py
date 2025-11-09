#!/usr/bin/env python3
"""
Minimal test script to verify core imports and basic functionality
"""
import sys
import logging
import os
from pathlib import Path

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
    """Test importing core modules"""
    try:
        logger.info("=== Testing core imports ===")
        
        # Test config loader
        from llama_runner.config_loader import config_loader, config
        logger.info("✅ config_loader imported successfully")
        logger.debug(f"Config loaded: {config.get('default_model', 'not found')}")
        
        # Test proxy manager
        from llama_runner.proxy_manager import get_proxy_manager
        logger.info("✅ proxy_manager imported successfully")
        
        # Test runner service
        from llama_runner.services.runner_service import RunnerService
        logger.info("✅ runner_service imported successfully")
        
        # Test config validator
        from llama_runner.services.config_validator import validate_config
        logger.info("✅ config_validator imported successfully")
        
        logger.info("🎉 All core imports successful!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Core import test failed: {e}", exc_info=True)
        return False

def test_file_structure():
    """Test that critical files and directories exist"""
    logger.info("=== Testing file structure ===")
    
    critical_paths = [
        "config/config.json",
        "logs/app.log",
        "models/",
        "tools/",
        "llama_runner/",
        "docs/README.md"
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

def main():
    """Main test function"""
    logger.info("🚀 Starting minimal system test")
    
    # Test imports
    imports_ok = test_core_imports()
    
    # Test file structure
    structure_ok = test_file_structure()
    
    # Summary
    logger.info("\n=== TEST SUMMARY ===")
    logger.info(f"Core imports: {'✅ PASS' if imports_ok else '❌ FAIL'}")
    logger.info(f"File structure: {'✅ PASS' if structure_ok else '❌ FAIL'}")
    
    if imports_ok and structure_ok:
        logger.info("🎉 MINIMAL SYSTEM TEST PASSED!")
        return 0
    else:
        logger.error("❌ MINIMAL SYSTEM TEST FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())