#!/usr/bin/env python3

import requests
import sys
from urllib.parse import urljoin

# Test if the dashboard is accessible
def test_dashboard():
    base_url = "http://localhost:8081"
    
    try:
        response = requests.get(base_url)
        if response.status_code == 200:
            print("✅ Dashboard is accessible at http://localhost:8081")
            print(f"Response length: {len(response.text)} characters")
            return True
        else:
            print(f"❌ Dashboard returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to dashboard: {e}")
        return False

if __name__ == "__main__":
    success = test_dashboard()
    sys.exit(0 if success else 1)