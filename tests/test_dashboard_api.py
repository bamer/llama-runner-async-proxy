import pytest
from unittest.mock import patch, MagicMock
import sys

# Add the project root to sys.path for imports
sys.path.insert(0, "/home/bamer/llama-runner-async-proxy")


def test_health_endpoint():
    """Test health endpoint returns proper status"""

    # Import the app now that we have the path set
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)

    # Act
    response = client.get("/api/v1/health")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"


def test_models_api_success():
    """Test successful models API endpoint returns proper model information"""

    # Mock the config loader
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {
            "models": [
                {"name": "test-model-1", "port": 8081, "active": True},
                {"name": "test-model-2", "port": 8082, "active": False},
            ]
        }

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act
        response = client.get("/api/v1/models")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) == 2

        # Check first model
        model1 = data["models"][0]
        assert model1["name"] == "test-model-1"
        assert model1["port"] == 8081
        assert model1["status"] == "running"

        # Check second model
        model2 = data["models"][1]
        assert model2["name"] == "test-model-2"
        assert model2["port"] == 8082
        assert model2["status"] == "stopped"


def test_models_api_empty_config():
    """Test models API handles missing configuration gracefully"""

    # Mock the config loader
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {}

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act
        response = client.get("/api/v1/models")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) == 0


def test_models_api_invalid_config():
    """Test models API handles invalid configuration gracefully"""

    # Mock the config loader
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {"models": "invalid"}

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act
        response = client.get("/api/v1/models")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) == 0


def test_dashboard_html_loads():
    """Test dashboard HTML page loads correctly and displays data properly"""

    # Mock the config loader to return valid models
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {
            "models": [
                {"name": "test-model-1", "port": 8081, "active": True},
                {"name": "test-model-2", "port": 8082, "active": False},
            ]
        }

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act - fetch the main page
        response = client.get("/")

        # Assert
        assert response.status_code == 200
        content = response.text

        # Check that the page contains expected content
        assert "Llama Runner Async Proxy Dashboard" in content
        assert "System Metrics" in content
        assert "Active Models" in content
        assert "Model Configuration" in content


def test_dashboard_html_empty_data():
    """Test dashboard HTML page handles empty data gracefully"""

    # Mock the config loader to return empty models
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {}

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act - fetch the main page
        response = client.get("/")

        # Assert
        assert response.status_code == 200
        content = response.text

        # Check that the page contains expected content even with empty data
        assert "Llama Runner Async Proxy Dashboard" in content
        assert "System Metrics" in content
        assert "Active Models" in content
        assert "Model Configuration" in content


def test_models_api_structure():
    """Test models API returns proper structure"""

    # Mock the config loader
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {
            "models": [
                {"name": "test-model-1", "port": 8081, "active": True},
                {"name": "test-model-2", "port": 8082, "active": False},
            ]
        }

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act
        response = client.get("/api/v1/models")

        # Assert
        assert response.status_code == 200
        data = response.json()

        # Check structure is correct (should have models key)
        assert isinstance(data, dict)
        assert "models" in data
        assert isinstance(data["models"], list)


def test_health_endpoint_structure():
    """Test health endpoint returns proper structure"""

    # Import the app now that we have the path set
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)

    # Act
    response = client.get("/api/v1/health")

    # Assert
    assert response.status_code == 200
    data = response.json()

    # Check structure is correct (should have status key)
    assert isinstance(data, dict)
    assert "status" in data
    assert isinstance(data["status"], str)


def test_models_endpoint_structure():
    """Test that models endpoint returns proper structure"""

    # Mock the config loader
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {
            "models": [
                {"name": "test-model-1", "port": 8081, "active": True},
                {"name": "test-model-2", "port": 8082, "active": False},
            ]
        }

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act
        response = client.get("/api/v1/models")

        # Assert
        assert response.status_code == 200
        data = response.json()

        # Check that it returns the expected structure
        assert "models" in data
        assert len(data["models"]) == 2


def test_empty_models_endpoint():
    """Test that empty models endpoint returns correct structure"""

    # Mock the config loader
    with patch("app.api.v1.endpoints.models.load_models_config") as mock_load_config:
        mock_load_config.return_value = {}

        # Import the app now that we have the path set
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)

        # Act
        response = client.get("/api/v1/models")

        # Assert
        assert response.status_code == 200
        data = response.json()

        # Check structure with empty models list
        assert "models" in data
        assert isinstance(data["models"], list)
        assert len(data["models"]) == 0
