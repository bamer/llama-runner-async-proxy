#!/usr/bin/env python3
"""
Test specifically for proxy_manager module
"""
import sys
import logging
import traceback
import asyncio
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/test_proxy_manager.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def test_proxy_manager_import():
    """Test importing proxy_manager module"""
    logger.info("=== Testing proxy_manager import ===")
    
    try:
        # Try to import the proxy_manager module
        logger.info("Attempting to import from llama_runner.proxy_manager...")
        
        from llama_runner.proxy_manager import ProxyManager, get_proxy_manager
        
        logger.info("✅ Successfully imported proxy_manager module")
        logger.info(f"ProxyManager class: {ProxyManager}")
        logger.info(f"get_proxy_manager function: {get_proxy_manager}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to import proxy_manager: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def test_proxy_manager_initialization():
    """Test initializing ProxyManager (requires RunnerService mock)"""
    logger.info("=== Testing ProxyManager initialization ===")
    
    try:
        # Import required modules
        from llama_runner.proxy_manager import ProxyManager
        from llama_runner.config_loader import config_loader
        
        logger.info("Creating mock RunnerService...")
        
        # Create a simple mock RunnerService
        class MockRunnerService:
            def __init__(self):
                self.config = config_loader.get_config()
                
            def is_model_running(self, model_name):
                return False
                
            def get_runner_port(self, model_name):
                return None
                
            def request_runner_start(self, model_name):
                return asyncio.Future()
        
        # Create ProxyManager instance
        mock_runner_service = MockRunnerService()
        proxy_manager = ProxyManager(mock_runner_service)
        
        logger.info("✅ Successfully created ProxyManager instance")
        logger.info(f"ProxyManager app: {proxy_manager.app}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize ProxyManager: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def main():
    logger.info("🚀 Starting proxy_manager test")
    
    # Ensure logs directory exists
    Path('logs').mkdir(exist_ok=True)
    
    # Run the tests
    import_result = test_proxy_manager_import()
    init_result = False
    
    if import_result:
        init_result = test_proxy_manager_initialization()
    
    logger.info("\n=== TEST SUMMARY ===")
    logger.info(f"Proxy manager import test: {'✅ PASS' if import_result else '❌ FAIL'}")
    logger.info(f"Proxy manager initialization test: {'✅ PASS' if init_result else '❌ FAIL'}")
    
    return 0 if (import_result and init_result) else 1

if __name__ == "__main__":
    sys.exit(main())