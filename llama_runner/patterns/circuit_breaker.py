import asyncio
import time
import logging
from enum import Enum
from typing import Any, Callable, Awaitable, Optional
from functools import wraps

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Blocking calls
    HALF_OPEN = "half_open"  # Testing if service recovered

class CircuitBreakerError(Exception):
    """Raised when circuit breaker is open"""
    def __init__(self, message: str = "Circuit breaker is open"):
        super().__init__(message)

class CircuitBreaker:
    """
    Circuit breaker pattern implementation for resilience
    
    States:
    - CLOSED: Normal operation, all calls pass through
    - OPEN: Calls are blocked, failing fast
    - HALF_OPEN: Testing if service recovered, limited calls allowed
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        success_threshold: int = 3,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.expected_exception = expected_exception
        
        # State tracking
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[float] = None
        self.state = CircuitState.CLOSED
        
        # Call tracking
        self.total_calls = 0
        self.successful_calls = 0
        self.failed_calls = 0
        
    def _log_state_transition(self, old_state: CircuitState, new_state: CircuitState, reason: str = ""):
        """Log state transitions for debugging"""
        logger.debug(f"Circuit breaker state change: {old_state.value} -> {new_state.value} ({reason})")
        
    def _update_stats(self, success: bool):
        """Update call statistics"""
        self.total_calls += 1
        if success:
            self.successful_calls += 1
        else:
            self.failed_calls += 1
            
    def _can_attempt_call(self) -> bool:
        """Check if a call can be attempted"""
        if self.state == CircuitState.CLOSED:
            return True
            
        if self.state == CircuitState.HALF_OPEN:
            return True
            
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has passed
            if self.last_failure_time and \
               (time.time() - self.last_failure_time) >= self.recovery_timeout:
                self._transition_to_half_open("Recovery timeout elapsed")
                return True
            return False
            
        return False
        
    def _transition_to_open(self, reason: str = ""):
        """Transition to OPEN state"""
        old_state = self.state
        self.state = CircuitState.OPEN
        self.last_failure_time = time.time()
        self.success_count = 0
        self._log_state_transition(old_state, self.state, reason)
        
    def _transition_to_half_open(self, reason: str = ""):
        """Transition to HALF_OPEN state"""
        old_state = self.state
        self.state = CircuitState.HALF_OPEN
        self.success_count = 0
        self._log_state_transition(old_state, self.state, reason)
        
    def _transition_to_closed(self, reason: str = ""):
        """Transition to CLOSED state"""
        old_state = self.state
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self._log_state_transition(old_state, self.state, reason)
        
    async def call(self, func: Callable[..., Awaitable[Any]], *args, **kwargs) -> Any:
        """
        Execute a function through the circuit breaker
        
        Args:
            func: Async function to execute
            *args, **kwargs: Arguments to pass to the function
            
        Returns:
            The result of the function call
            
        Raises:
            CircuitBreakerError: If circuit breaker is open
            Any: Exceptions from the wrapped function
        """
        if not self._can_attempt_call():
            raise CircuitBreakerError(
                f"Circuit breaker is {self.state.value}. "
                f"Failure threshold: {self.failure_threshold}, "
                f"Recovery timeout: {self.recovery_timeout}s"
            )
            
        try:
            # Execute the function
            start_time = time.time()
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Success handling
            self.failure_count = 0
            
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    self._transition_to_closed("Success threshold reached")
            elif self.state == CircuitState.CLOSED:
                self.success_count += 1
                
            self._update_stats(success=True)
            
            # Log successful call in debug mode
            logger.debug(f"Circuit breaker call succeeded in {execution_time:.3f}s")
            
            return result
            
        except self.expected_exception as e:
            # Expected failure handling
            self.success_count = 0
            self.failure_count += 1
            
            self._update_stats(success=False)
            
            # Check if we should transition to open
            if self.failure_count >= self.failure_threshold:
                self._transition_to_open(f"Failure threshold exceeded ({self.failure_count})")
                
            logger.warning(
                f"Circuit breaker call failed: {e}. "
                f"Failure count: {self.failure_count}/{self.failure_threshold}"
            )
            
            # Re-raise the original exception
            raise
            
        except Exception as e:
            # Unexpected exception handling
            self.success_count = 0
            self.failure_count += 1
            
            self._update_stats(success=False)
            
            # Always transition to open for unexpected exceptions
            self._transition_to_open(f"Unexpected exception: {type(e).__name__}")
            
            logger.error(
                f"Circuit breaker unexpected error: {e}. "
                f"Transitioning to OPEN state"
            )
            
            raise
            
    def get_stats(self) -> dict:
        """Get circuit breaker statistics"""
        return {
            "state": self.state.value,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout,
            "success_threshold": self.success_threshold,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "success_rate": (self.successful_calls / self.total_calls * 100) if self.total_calls > 0 else 0,
            "last_failure_time": self.last_failure_time,
            "time_since_last_failure": time.time() - self.last_failure_time if self.last_failure_time else None
        }
        
    def reset(self):
        """Reset circuit breaker to initial state"""
        old_state = self.state
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.total_calls = 0
        self.successful_calls = 0
        self.failed_calls = 0
        self._log_state_transition(old_state, self.state, "Manual reset")

def circuit_breaker(
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    success_threshold: int = 3,
    expected_exception: type = Exception
):
    """
    Decorator for implementing circuit breaker pattern
    
    Usage:
        @circuit_breaker(failure_threshold=3, recovery_timeout=30)
        async def unstable_function():
            # Function that might fail
            pass
    """
    def decorator(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        circuit_breaker_instance = CircuitBreaker(
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            success_threshold=success_threshold,
            expected_exception=expected_exception
        )
        
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            return await circuit_breaker_instance.call(func, *args, **kwargs)
            
        # Attach circuit breaker instance for monitoring
        wrapper.circuit_breaker = circuit_breaker_instance
        wrapper.get_circuit_stats = circuit_breaker_instance.get_stats
        wrapper.reset_circuit = circuit_breaker_instance.reset
        
        return wrapper
        
    return decorator

class CircuitBreakerManager:
    """Manager for multiple circuit breakers"""
    
    def __init__(self):
        self.circuit_breakers: dict[str, CircuitBreaker] = {}
        self.default_config = {
            "failure_threshold": 5,
            "recovery_timeout": 60,
            "success_threshold": 3
        }
        
    def get_circuit(self, name: str, **config_overrides) -> CircuitBreaker:
        """Get or create a circuit breaker by name"""
        if name not in self.circuit_breakers:
            config = {**self.default_config, **config_overrides}
            self.circuit_breakers[name] = CircuitBreaker(**config)
            
        return self.circuit_breakers[name]
        
    def call(self, circuit_name: str, func: Callable[..., Awaitable[Any]], *args, **kwargs) -> Any:
        """Call function through named circuit breaker"""
        circuit = self.get_circuit(circuit_name)
        return asyncio.create_task(circuit.call(func, *args, **kwargs))
        
    def get_all_stats(self) -> dict:
        """Get statistics for all circuit breakers"""
        return {
            name: circuit.get_stats()
            for name, circuit in self.circuit_breakers.items()
        }
        
    def reset_circuit(self, name: str):
        """Reset a specific circuit breaker"""
        if name in self.circuit_breakers:
            self.circuit_breakers[name].reset()
            
    def reset_all(self):
        """Reset all circuit breakers"""
        for circuit in self.circuit_breakers.values():
            circuit.reset()

# Global circuit breaker manager
circuit_manager = CircuitBreakerManager()

# Convenience function for easy usage
def get_circuit(name: str, **config) -> CircuitBreaker:
    """Get a circuit breaker by name"""
    return circuit_manager.get_circuit(name, **config)

# Pre-defined circuit breakers for common services
def get_model_circuit(model_name: str) -> CircuitBreaker:
    """Get circuit breaker for model operations"""
    return get_circuit(f"model_{model_name}", failure_threshold=3, recovery_timeout=30)

def get_api_circuit(service_name: str) -> CircuitBreaker:
    """Get circuit breaker for API calls"""
    return get_circuit(f"api_{service_name}", failure_threshold=5, recovery_timeout=60)

def get_database_circuit() -> CircuitBreaker:
    """Get circuit breaker for database operations"""
    return get_circuit("database", failure_threshold=2, recovery_timeout=120)
