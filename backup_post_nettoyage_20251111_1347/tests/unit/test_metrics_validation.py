"""Tests for metrics and validation."""
import pytest
from pathlib import Path
from llama_runner.services.metrics_collector import MetricsCollector, RunnerMetrics  # Corrigé pour la nouvelle structure
from llama_runner.services.config_validator import validate_config, ValidationError, log_validation_results  # Corrigé pour la nouvelle structure

def test_metrics_collector():
    """Test metrics collection."""
    metrics = MetricsCollector()
    
    # Test start recording
    metrics.record_start("test_model")
    assert metrics.get_active_count() == 1
    
    # Test ready recording
    metrics.record_ready("test_model", 8585)
    model_metrics = metrics.metrics["test_model"]
    assert model_metrics.start_count == 1
    assert model_metrics.is_active
    
    # Test stop recording
    metrics.record_stop("test_model")
    assert metrics.get_active_count() == 0
    assert model_metrics.stop_count == 1
    
    # Test error recording
    metrics.record_error("test_model", "Test error")
    assert model_metrics.error_count == 1
    
    # Test summary
    summary = metrics.get_summary()
    assert summary["total_models"] == 1
    assert summary["total_starts"] == 1
    assert summary["total_stops"] == 1
    assert summary["total_errors"] == 1

def test_config_validation_missing_model():
    """Test validation catches missing model path."""
    config = {
        "models": {
            "test_model": {
                "llama_cpp_runtime": "default",
                # missing model_path
            }
        },
        "llama-runtimes": {
            "default": {"runtime": "llama-server"}
        }
    }
    
    errors = validate_config(config)
    assert len(errors) > 0
    assert any(e.category == "model" and "model_path" in e.message for e in errors)

def test_config_validation_nonexistent_file():
    """Test validation catches non-existent model file."""
    config = {
        "models": {
            "test_model": {
                "model_path": "/nonexistent/path/model.gguf",
                "llama_cpp_runtime": "default"
            }
        },
        "llama-runtimes": {
            "default": {"runtime": "llama-server"}
        },
        "concurrentRunners": 2
    }
    
    errors = validate_config(config)
    assert len(errors) > 0
    assert any(e.severity == "error" and "not found" in e.message for e in errors)

def test_config_validation_invalid_concurrent_limit():
    """Test validation catches invalid concurrent runners limit."""
    config = {
        "models": {},
        "concurrentRunners": 0  # Invalid
    }
    
    errors = validate_config(config)
    assert any(e.category == "config" and "concurrentRunners" in e.message for e in errors)

def test_config_validation_high_concurrent_warning():
    """Test validation warns about high concurrent runners."""
    config = {
        "models": {},
        "concurrentRunners": 15  # Very high
    }
    
    errors = validate_config(config)
    assert any(e.severity == "warning" and "concurrentRunners" in e.message for e in errors)

def test_log_validation_results_no_errors():
    """Test logging with no errors."""
    assert log_validation_results([]) == True

def test_log_validation_results_warnings_only():
    """Test logging with only warnings."""
    warnings = [ValidationError("warning", "config", "Test warning")]
    assert log_validation_results(warnings) == True

def test_log_validation_results_with_errors():
    """Test logging with errors."""
    errors = [ValidationError("error", "model", "Test error")]
    assert log_validation_results(errors) == False