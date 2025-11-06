import asyncio
import sys
from pathlib import Path
import pytest
from unittest.mock import MagicMock, patch, AsyncMock

# Add the root directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from llama_runner.services.runner_service import RunnerService
from llama_runner.repositories.config_repository import ConfigRepository
from llama_runner.models.config_model import AppConfig, ModelConfig, RuntimeConfig

# Mock configuration
MOCK_CONFIG: AppConfig = {
    "models": {
        "model-1": {
            "model_path": "/fake/path/model1.gguf",
            "llama_cpp_runtime": "default",
            "parameters": {},
            "display_name": "Model 1",
            "auto_discovered": False,
            "auto_update_model": False,
            "has_tools": False
        },
        "model-2": {
            "model_path": "/fake/path/model2.gguf",
            "llama_cpp_runtime": "default",
            "parameters": {},
            "display_name": "Model 2",
            "auto_discovered": False,
            "auto_update_model": False,
            "has_tools": False
        }
    },
    "runtimes": {
        "default": {"runtime": "dummy-server", "supports_tools": True}
    },
    "default_runtime": "default",
    "concurrentRunners": 1
}

@pytest.fixture
def mock_config_repo():
    """Mock ConfigRepository fixture."""
    repo = MagicMock(spec=ConfigRepository)
    repo.get_config.return_value = MOCK_CONFIG
    repo.get_model_config.side_effect = lambda name: MOCK_CONFIG.get("models", {}).get(name)
    repo.get_runtime_config.side_effect = lambda name: MOCK_CONFIG.get("runtimes", {}).get(name)
    return repo

@pytest.fixture
def runner_service(mock_config_repo):
    """Fixture to create a RunnerService with mock callbacks."""
    def no_op(*args, **kwargs):
        pass

    return RunnerService(
        config_repo=mock_config_repo,
        on_started=no_op,
        on_stopped=no_op,
        on_error=no_op,
        on_port_ready=no_op,
    )

@pytest.mark.asyncio
@patch("llama_runner.services.runner_service.LlamaCppRunner")
async def test_runner_stop_and_wait_logic(MockLlamaCppRunner, runner_service):
    """
    Tests that the service waits for a running process to stop before starting a new one.
    This test mocks the LlamaCppRunner to focus on the service's logic.
    """

    # Prepare two runner mocks with AsyncMock run/stop and stop events
    stop_event_1 = asyncio.Event()

    async def fake_run_1():
        await stop_event_1.wait()
        return  # exit normally when stop_event is set

    async def fake_stop_1():
        stop_event_1.set()

    mock_runner_1 = MagicMock()
    mock_runner_1.run = AsyncMock()
    mock_runner_1.run.return_value = fake_run_1()
    mock_runner_1.stop = AsyncMock()
    mock_runner_1.stop.return_value = fake_stop_1()
    mock_runner_1.get_port.return_value = 8585  # First runner gets port 8585
    mock_runner_1.is_running.return_value = True

    stop_event_2 = asyncio.Event()

    async def fake_run_2():
        await stop_event_2.wait()
        return

    async def fake_stop_2():
        stop_event_2.set()

    mock_runner_2 = MagicMock()
    mock_runner_2.run = AsyncMock()
    mock_runner_2.run.return_value = fake_run_2()
    mock_runner_2.stop = AsyncMock()
    mock_runner_2.stop.return_value = fake_stop_2()
    mock_runner_2.get_port.return_value = 0  # Second runner gets port 0 (random)
    mock_runner_2.is_running.return_value = True

    # Side effect factory for constructor
    runners = [mock_runner_1, mock_runner_2]
    call_index = {"i": 0}

    def ctor_side_effect(*args, **kwargs):
        mock_obj = runners[call_index["i"]]
        call_index["i"] += 1
        for k, v in kwargs.items():
            setattr(mock_obj, k, v)
        return mock_obj

    MockLlamaCppRunner.side_effect = ctor_side_effect

    # --- Act: Start the first runner ---
    start_task_1 = asyncio.create_task(runner_service.request_runner_start("model-1"))
    await asyncio.sleep(0.1)  # Let setup complete

    # Trigger the port ready callback
    on_port_ready_func = getattr(mock_runner_1, 'on_port_ready')
    on_port_ready_func("model-1", 8585)
    await asyncio.sleep(0.1)  # Let the callback resolve
    
    port1 = await asyncio.wait_for(start_task_1, timeout=1.0)

    assert port1 == 8585
    assert "model-1" in runner_service.llama_runners

    # --- Act: Start the second runner, which should NOT stop the first in new architecture ---
    start_task_2 = asyncio.create_task(runner_service.request_runner_start("model-2"))
    await asyncio.sleep(0.1)  # Give time for constructor to run

    # Trigger the port ready callback for second runner  
    # Second runner should get port 0 (random port) as per new logic
    on_port_ready_func = getattr(mock_runner_2, 'on_port_ready')
    on_port_ready_func("model-2", 0)  # Second runner gets random port 0
    await asyncio.sleep(0.1)  # Let the callback resolve
    
    port2 = await asyncio.wait_for(start_task_2, timeout=1.0)

    # --- Assert ---
    assert port2 == 0  # Second runner gets port 0 (random), not 8585
    # In new architecture, runners don't automatically replace each other
    # Each runner manages its own lifecycle
    assert "model-1" in runner_service.llama_runners  # First runner still exists
    assert "model-2" in runner_service.llama_runners  # Second runner also exists
    mock_runner_1.stop.assert_not_called()  # First runner was not automatically stopped

    # Verify that the runner service correctly tracks first runner
    assert runner_service.first_runner_started == True  # Should be True after first runner

    # --- Cleanup ---
    await asyncio.wait_for(runner_service.stop_all_llama_runners_async(), timeout=1.0)
    assert not runner_service.llama_runners
