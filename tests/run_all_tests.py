#!/usr/bin/env python
import sys
import os
import unittest

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Discover and run all tests
if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.discover("tests", pattern="test*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
