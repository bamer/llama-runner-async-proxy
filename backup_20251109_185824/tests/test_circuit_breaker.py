import asyncio
import time
import pytest
from unittest.mock import AsyncMock, MagicMock
from llama_runner.patterns.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
    CircuitBreakerManager,
    circuit_breaker,
    circuit_manager,
    get_model_circuit,
    get_api_circuit,
    get_database_circuit
)

class TestCircuitBreaker:
    """Test cases for CircuitBreaker class"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.circuit = CircuitBreaker(
            failure_threshold=3,
            recovery_timeout=2,
            success_threshold=2
        )
    
    async def test_successful_calls_pass_through(self):
        """Test that successful calls pass through when circuit is closed"""
        async def success_func():
            return "success"
        
        result = await self.circuit.call(success_func)
        assert result == "success"
        assert self.circuit.state == CircuitState.CLOSED
        assert self.circuit.successful_calls == 1
    
    async def test_failures_transition_to_open(self):
        """Test that failures eventually transition to open state"""
        async def fail_func():
            raise ValueError("test error")
        
        # First failure
        with pytest.raises(ValueError):
            await self.circuit.call(fail_func)
        
        assert self.circuit.state == CircuitState.CLOSED
        assert self.circuit.failure_count == 1
        
        # Second failure
        with pytest.raises(ValueError):
            await self.circuit.call(fail_func)
        
        assert self.circuit.failure_count == 2
        
        # Third failure - should transition to OPEN
        with pytest.raises(ValueError):
            await self.circuit.call(fail_func)
        
        assert self.circuit.state == CircuitState.OPEN
        assert self.circuit.failure_count == 3
    
    async def test_circuit_blocked_in_open_state(self):
        """Test that calls are blocked when circuit is open"""
        # Force circuit to open
        self.circuit._transition_to_open("test setup")
        
        async def any_func():
            return "should not reach here"
        
        with pytest.raises(CircuitBreakerError):
            await self.circuit.call(any_func)
    
    async def test_recovery_timeout_in_half_open(self):
        """Test recovery timeout and transition to half-open"""
        # Force circuit to open
        self.circuit._transition_to_open("test setup")
        
        # Wait for recovery timeout
        await asyncio.sleep(2.1)
        
        # Should now allow calls (half-open state)
        async def success_func():
            return "success"
        
        # This should not raise CircuitBreakerError
        result = await self.circuit.call(success_func)
        assert result == "success"
        assert self.circuit.state == CircuitState.HALF_OPEN
    
    async def test_half_open_recovery(self):
        """Test that circuit recovers from half-open on success threshold"""
        # Force circuit to half-open state
        self.circuit._transition_to_half_open("test setup")
        
        async def success_func():
            return "success"
        
        # Two successes should transition back to closed
        await self.circuit.call(success_func)
        assert self.circuit.state == CircuitState.HALF_OPEN
        assert self.circuit.success_count == 1
        
        await self.circuit.call(success_func)
        assert self.circuit.state == CircuitState.CLOSED
        assert self.circuit.failure_count == 0
    
    async def test_half_open_failure_returns_to_open(self):
        """Test that failure in half-open returns to open state"""
        # Force circuit to half-open state
        self.circuit._transition_to_half_open("test setup")
        
        async def fail_func():
            raise ValueError("test error")
        
        # Failure should return to open
        with pytest.raises(ValueError):
            await self.circuit.call(fail_func)
        
        assert self.circuit.state == CircuitState.OPEN
    
    async def test_custom_exception_types(self):
        """Test circuit breaker with custom exception types"""
        circuit = CircuitBreaker(expected_exception=ValueError)
        
        async def custom_error_func():
            raise ValueError("custom error")
        
        async def generic_error_func():
            raise RuntimeError("generic error")
        
        # Custom exception should trigger circuit breaker
        with pytest.raises(ValueError):
            await circuit.call(custom_error_func)
        
        assert circuit.failure_count == 1
        
        # Generic exception should also trigger circuit breaker but as unexpected
        with pytest.raises(RuntimeError):
            await circuit.call(generic_error_func)
        
        assert circuit.failure_count == 2
    
    async def test_statistics_tracking(self):
        """Test that statistics are properly tracked"""
        async def success_func():
            return "success"
        
        async def fail_func():
            raise ValueError("error")
        
        # Two successful calls
        await self.circuit.call(success_func)
        await self.circuit.call(success_func)
        
        stats = self.circuit.get_stats()
        assert stats["total_calls"] == 2
        assert stats["successful_calls"] == 2
        assert stats["failed_calls"] == 0
        assert stats["success_rate"] == 100.0
        
        # Two failed calls
        with pytest.raises(ValueError):
            await self.circuit.call(fail_func)
        with pytest.raises(ValueError):
            await self.circuit.call(fail_func)
        
        stats = self.circuit.get_stats()
        assert stats["total_calls"] == 4
        assert stats["successful_calls"] == 2
        assert stats["failed_calls"] == 2
        assert stats["success_rate"] == 50.0
    
    def test_manual_reset(self):
        """Test manual reset functionality"""
        # Force circuit to open state
        self.circuit._transition_to_open("test setup")
        
        assert self.circuit.state == CircuitState.OPEN
        
        # Manual reset should return to closed
        self.circuit.reset()
        
        assert self.circuit.state == CircuitState.CLOSED
        assert self.circuit.failure_count == 0
        assert self.circuit.success_count == 0
        assert self.circuit.last_failure_time is None

class TestCircuitBreakerManager:
    """Test cases for CircuitBreakerManager class"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.manager = CircuitBreakerManager()
    
    async def test_get_or_create_circuit(self):
        """Test getting and creating circuit breakers by name"""
        circuit1 = self.manager.get_circuit("test1")
        circuit2 = self.manager.get_circuit("test1")  # Should get same instance
        
        assert circuit1 is circuit2
        
        circuit3 = self.manager.get_circuit("test2")
        assert circuit3 is not circuit1
    
    async def test_circuit_configuration(self):
        """Test circuit configuration overrides"""
        circuit = self.manager.get_circuit(
            "test",
            failure_threshold=10,
            recovery_timeout=30
        )
        
        assert circuit.failure_threshold == 10
        assert circuit.recovery_timeout == 30
        assert circuit.success_threshold == 3  # default
    
    async def test_named_circuit_calls(self):
        """Test calling functions through named circuit breakers"""
        async def test_func():
            return "test result"
        
        result = await self.manager.call("test_circuit", test_func)
        assert result == "test result"
        
        assert "test_circuit" in self.manager.circuit_breakers
    
    async def test_get_all_stats(self):
        """Test getting statistics for all circuit breakers"""
        self.manager.get_circuit("circuit1")
        self.manager.get_circuit("circuit2")
        
        stats = self.manager.get_all_stats()
        assert "circuit1" in stats
        assert "circuit2" in stats
        assert stats["circuit1"]["state"] == "closed"
        assert stats["circuit2"]["state"] == "closed"
    
    def test_reset_functionality(self):
        """Test reset functionality"""
        circuit = self.manager.get_circuit("test_circuit")
        circuit._transition_to_open("test setup")
        
        assert circuit.state == CircuitState.OPEN
        
        self.manager.reset_circuit("test_circuit")
        assert circuit.state == CircuitState.CLOSED
        
        # Create another circuit and reset all
        self.manager.get_circuit("circuit2")
        self.manager.reset_all()
        
        for circuit in self.manager.circuit_breakers.values():
            assert circuit.state == CircuitState.CLOSED

class TestCircuitBreakerDecorator:
    """Test cases for circuit_breaker decorator"""
    
    async def test_decorator_functionality(self):
        """Test that decorator properly wraps functions"""
        @circuit_breaker(failure_threshold=2, recovery_timeout=1)
        async def test_func(x, y):
            return x + y
        
        result = await test_func(1, 2)
        assert result == 3
        
        # Check that circuit breaker is attached
        assert hasattr(test_func, 'circuit_breaker')
        assert hasattr(test_func, 'get_circuit_stats')
        assert hasattr(test_func, 'reset_circuit')
        
        stats = test_func.get_circuit_stats()
        assert stats["total_calls"] == 1
        assert stats["successful_calls"] == 1
    
    async def test_decorator_failure_handling(self):
        """Test decorator with failures"""
        call_count = 0
        
        @circuit_breaker(failure_threshold=2, recovery_timeout=1)
        async def failing_func():
            nonlocal call_count
            call_count += 1
            raise ValueError("failing")
        
        # First failure
        with pytest.raises(ValueError):
            await failing_func()
        
        # Second failure - should open circuit
        with pytest.raises(ValueError):
            await failing_func()
        
        assert call_count == 2
        
        # Third call should be blocked
        with pytest.raises(CircuitBreakerError):
            await failing_func()
    
    def test_convenience_functions(self):
        """Test convenience functions for pre-defined circuits"""
        model_circuit = get_model_circuit("test_model")
        api_circuit = get_api_circuit("test_api")
        db_circuit = get_database_circuit()
        
        assert isinstance(model_circuit, CircuitBreaker)
        assert isinstance(api_circuit, CircuitBreaker)
        assert isinstance(db_circuit, CircuitBreaker)
        
        # Check specific configurations
        assert model_circuit.failure_threshold == 3
        assert model_circuit.recovery_timeout == 30
        
        assert api_circuit.failure_threshold == 5
        assert api_circuit.recovery_timeout == 60
        
        assert db_circuit.failure_threshold == 2
        assert db_circuit.recovery_timeout == 120

class TestCircuitBreakerIntegration:
    """Integration tests for circuit breaker with real scenarios"""
    
    async def test_unreliable_service_protection(self):
        """Test circuit breaker protecting an unreliable service"""
        call_count = 0
        
        class UnreliableService:
            def __init__(self):
                self.circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=1)
            
            async def process_request(self, data):
                """Service that fails intermittently"""
                call_count += 1
                
                if call_count % 2 == 0:  # Fail every other call
                    raise ConnectionError("Service unavailable")
                
                return f"processed_{data}"
        
        service = UnreliableService()
        
        # Alternating success/failure pattern
        # Call 1: success
        result = await service.circuit.call(service.process_request, "data1")
        assert result == "processed_data1"
        
        # Call 2: failure
        with pytest.raises(ConnectionError):
            await service.circuit.call(service.process_request, "data2")
        
        # Call 3: success
        result = await service.circuit.call(service.process_request, "data3")
        assert result == "processed_data3"
        
        # Call 4: failure
        with pytest.raises(ConnectionError):
            await service.circuit.call(service.process_request, "data4")
        
        # Call 5: failure
        with pytest.raises(ConnectionError):
            await service.circuit.call(service.process_request, "data5")
        
        # Call 6: failure - should open circuit
        with pytest.raises(ConnectionError):
            await service.circuit.call(service.process_request, "data6")
        
        # Circuit should be open now, blocking further calls
        with pytest.raises(CircuitBreakerError):
            await service.circuit.call(service.process_request, "data7")
    
    async def test_performance_impact_measurement(self):
        """Test measuring performance impact of circuit breaker"""
        circuit = CircuitBreaker()
        
        async def fast_func():
            await asyncio.sleep(0.001)  # 1ms delay
            return "fast"
        
        async def slow_func():
            await asyncio.sleep(0.1)  # 100ms delay
            return "slow"
        
        # Measure performance
        start_time = time.time()
        await circuit.call(fast_func)
        fast_duration = time.time() - start_time
        
        start_time = time.time()
        await circuit.call(slow_func)
        slow_duration = time.time() - start_time
        
        # Circuit breaker should add minimal overhead
        assert fast_duration < 0.01  # Less than 10ms overhead
        assert slow_duration >= 0.1  # Actual function time preserved

if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
