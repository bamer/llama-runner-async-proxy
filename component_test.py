#!/usr/bin/env python3
"""
Component test script - tests individual components of the system
"""
import sys
import logging
import asyncio
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/component_test.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

async def test_ollama_proxy():
    """Test Ollama proxy functionality"""
    logger.info("=== Testing Ollama Proxy ===")
    
    try:
        from llama_runner.headless_service_manager import HeadlessServiceManager
        from llama_runner.config_loader import load_config
        
        config = load_config()
        hsm = HeadlessServiceManager(config, config.get('models', {}))
        
        logger.info("Starting Ollama proxy service...")
        await hsm._start_ollama_proxy()
        
        # Wait a bit for the service to start
        time.sleep(2)
        
        # Test the endpoint
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get('http://localhost:11434/')
            logger.info(f"Ollama proxy response status: {response.status_code}")
            if response.status_code == 200:
                logger.info("✅ Ollama proxy test passed")
                return True
            else:
                logger.error(f"❌ Ollama proxy test failed: {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"❌ Ollama proxy test failed: {e}")
        return False

async def test_lmstudio_proxy():
    """Test LM Studio proxy functionality"""
    logger.info("=== Testing LM Studio Proxy ===")
    
    try:
        from llama_runner.headless_service_manager import HeadlessServiceManager
        from llama_runner.config_loader import load_config
        
        config = load_config()
        hsm = HeadlessServiceManager(config, config.get('models', {}))
        
        logger.info("Starting LM Studio proxy service...")
        await hsm._start_lmstudio_proxy()
        
        # Wait a bit for the service to start
        time.sleep(2)
        
        # Test the endpoint
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get('http://localhost:1234/health')
            logger.info(f"LM Studio proxy response status: {response.status_code}")
            if response.status_code == 200:
                logger.info("✅ LM Studio proxy test passed")
                return True
            else:
                logger.error(f"❌ LM Studio proxy test failed: {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"❌ LM Studio proxy test failed: {e}")
        return False

async def run_all_tests():
    """Run all component tests"""
    logger.info("🚀 Starting component tests")
    
    # Ensure logs directory exists
    Path('logs').mkdir(exist_ok=True)
    
    # Run tests
    ollama_result = await test_ollama_proxy()
    lmstudio_result = await test_lmstudio_proxy()
    
    # Summary
    logger.info("\n=== TEST SUMMARY ===")
    logger.info(f"Ollama proxy test: {'✅ PASS' if ollama_result else '❌ FAIL'}")
    logger.info(f"LM Studio proxy test: {'✅ PASS' if lmstudio_result else '❌ FAIL'}")
    
    return ollama_result and lmstudio_result

if __name__ == "__main__":
    try:
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Test failed with unexpected error: {e}")
        sys.exit(1)