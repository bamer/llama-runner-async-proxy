#!/usr/bin/env python3
"""
Test specifically for config_loader module
"""
import sys
import logging
import traceback
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/test_config_loader.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def test_config_loader_import():
    """Test importing config_loader module"""
    logger.info("=== Testing config_loader import ===")
    
    try:
        # Try to import the config_loader module
        logger.info("Attempting to import from llama_runner.config_loader...")
        
        from llama_runner.config_loader import config_loader, config, ensure_config_exists, load_config
        
        logger.info("✅ Successfully imported config_loader module")
        logger.info(f"Config loader instance: {config_loader}")
        logger.info(f"Loaded config keys: {list(config.keys())[:5]}...")  # Show first 5 keys
        
        # Test config functions
        logger.info("Testing ensure_config_exists...")
        success, message = ensure_config_exists()
        logger.info(f"ensure_config_exists result: {success}, {message}")
        
        logger.info("Testing load_config...")
        test_config = load_config()
        logger.info(f"load_config result - default model: {test_config.get('default_model')}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to import/test config_loader: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def main():
    logger.info("🚀 Starting config_loader test")
    
    # Ensure logs directory exists
    Path('logs').mkdir(exist_ok=True)
    
    # Run the test
    result = test_config_loader_import()
    
    logger.info("\n=== TEST SUMMARY ===")
    logger.info(f"Config loader test: {'✅ PASS' if result else '❌ FAIL'}")
    
    return 0 if result else 1

if __name__ == "__main__":
    sys.exit(main())