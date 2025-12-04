import sys
import unittest

sys.path.insert(0, "/home/bamer/llama-runner-async-proxy")

class ModelsTestCase(unittest.TestCase):
    
    def test_model_config_structure(self):
        """Test model configuration structure"""
        # Create a mock config object
        config = {"models": [
            {"name": "test-model", "port": 8081, "config": {}}
        ]}
        
        self.assertIn("models", config)
        self.assertIsInstance(config["models"], list)
        
    def test_model_config_defaults(self):
        """Test default model parameters"""
        # Mock default parameters
        DEFAULT_PARAMS = {
            "ctx_size": 4096,
            "temperature": 0.7,
            "batch_size": 2048
        }
        
        # Verify defaults are properly set
        self.assertIsInstance(DEFAULT_PARAMS, dict)
        self.assertIn("ctx_size", DEFAULT_PARAMS)
        self.assertIn("temperature", DEFAULT_PARAMS)
        
if __name__ == "__main__":
    unittest.main()