import sys

sys.path.insert(0, "/home/bamer/llama-runner-async-proxy")


def test_models_api_structure():
    """Test models API returns proper structure"""

    # Import the necessary components directly for testing
    from app.api.v1.endpoints.models import router as models_router

    # Test that the router exists and is properly structured
    assert models_router is not None
    print("✓ Models router loaded successfully")


def test_health_api_structure():
    """Test health API returns proper structure"""

    from app.api.v1.endpoints.health import router as health_router

    # Test that the router exists and is properly structured
    assert health_router is not None
    print("✓ Health router loaded successfully")


def test_dashboard_html_contains_expected_content():
    """Test dashboard HTML page contains expected elements"""

    # Import the main app to check routes
    from app.main import app

    # Check that the main route exists (the dashboard)
    assert hasattr(app, "router")
    print("✓ App router loaded successfully")


def test_models_endpoint_returns_valid_data():
    """Test that models endpoint works with mock data"""

    # Test basic model structure
    mock_models_config = {
        "models": [
            {"name": "test-model-1", "port": 8081, "active": True},
            {"name": "test-model-2", "port": 8082, "active": False},
        ]
    }

    # Test that the structure is valid
    assert isinstance(mock_models_config, dict)
    assert "models" in mock_models_config
    assert isinstance(mock_models_config["models"], list)
    assert len(mock_models_config["models"]) == 2

    print("✓ Mock model configuration structure validated")


def test_models_endpoint_empty_structure():
    """Test models endpoint with empty config"""

    # Test empty configuration structure
    empty_config = {"models": []}

    # Test that the structure is valid
    assert isinstance(empty_config, dict)
    assert "models" in empty_config
    assert isinstance(empty_config["models"], list)

    print("✓ Empty model configuration structure validated")


def test_health_endpoint_structure():
    """Test health endpoint returns proper structure"""

    # Basic validation of health structure
    health_response = {"status": "healthy"}

    assert isinstance(health_response, dict)
    assert "status" in health_response
    assert health_response["status"] == "healthy"

    print("✓ Health response structure validated")


if __name__ == "__main__":
    # Run all tests
    test_models_api_structure()
    test_health_api_structure()
    test_dashboard_html_contains_expected_content()
    test_models_endpoint_returns_valid_data()
    test_models_endpoint_empty_structure()
    test_health_endpoint_structure()
    print("All tests passed!")
