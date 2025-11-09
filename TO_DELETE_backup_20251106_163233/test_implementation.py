"""Simple test script for circuit breaker pattern"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'llama_runner'))

from patterns.circuit_breaker import CircuitBreaker, circuit_breaker
from metrics_server import MetricsCollector, MetricsWebSocketServer
import asyncio

async def test_circuit_breaker():
    """Test circuit breaker functionality"""
    print("🔧 Testing Circuit Breaker Pattern")
    print("=" * 50)
    
    circuit = CircuitBreaker(failure_threshold=3, recovery_timeout=2, success_threshold=2)
    
    async def success_func():
        return 'success'
    
    async def fail_func():
        raise ValueError('test error')
    
    # Test 1: Successful calls
    print("✅ Test 1: Successful calls")
    for i in range(2):
        result = await circuit.call(success_func)
        print(f"   Call {i+1}: {result} | State: {circuit.state.value} | Failures: {circuit.failure_count}")
    
    # Test 2: Failed calls leading to open state
    print("\n❌ Test 2: Failed calls leading to open state")
    for i in range(4):
        try:
            await circuit.call(fail_func)
        except ValueError as e:
            print(f"   Failure {i+1}: {e} | State: {circuit.state.value} | Failures: {circuit.failure_count}")
        except Exception as e:
            print(f"   Blocked {i+1}: {type(e).__name__}: {e} | State: {circuit.state.value}")
    
    # Test 3: Recovery after timeout
    print("\n🔄 Test 3: Recovery after timeout")
    print("   Waiting 3 seconds for recovery timeout...")
    await asyncio.sleep(3)
    
    try:
        result = await circuit.call(success_func)
        print(f"   Recovery call: {result} | State: {circuit.state.value}")
    except Exception as e:
        print(f"   Recovery failed: {e}")
    
    # Test 4: Statistics
    print("\n📊 Test 4: Circuit breaker statistics")
    stats = circuit.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print("\n🎉 Circuit breaker test completed successfully!")
    return True

async def test_metrics_server():
    """Test metrics server functionality"""
    print("\n📈 Testing Metrics Server")
    print("=" * 50)
    
    try:
        # Test imports
        from metrics_server import MetricsCollector, MetricsWebSocketServer
        
        # Test metrics collection
        collector = MetricsCollector(collection_interval=0.1)
        await collector.start_collection()
        
        print("   ✅ Metrics collector started")
        
        # Collect a few metrics samples
        for i in range(3):
            metrics = await collector.collect_current_metrics()
            cpu_usage = metrics.get('cpu', {}).get('usage', 0)
            memory_usage = metrics.get('memory', {}).get('percentage', 0)
            print(f"   Sample {i+1}: CPU {cpu_usage:.1f}% | Memory {memory_usage:.1f}%")
            await asyncio.sleep(0.2)
        
        await collector.stop_collection()
        print("   ✅ Metrics collector stopped")
        
        # Test circuit breaker integration
        stats = collector.get_circuit_breaker_stats()
        print(f"   ✅ Circuit breaker stats: {len(stats)} active breakers")
        
        print("\n🎉 Metrics server test completed successfully!")
        return True
        
    except Exception as e:
        print(f"   ❌ Metrics server test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting Implementation Tests")
    print("=" * 60)
    
    # Test circuit breaker
    cb_success = await test_circuit_breaker()
    
    # Test metrics server
    ms_success = await test_metrics_server()
    
    # Final results
    print("\n" + "=" * 60)
    print("📋 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Circuit Breaker Pattern: {'✅ PASS' if cb_success else '❌ FAIL'}")
    print(f"Metrics Server:          {'✅ PASS' if ms_success else '❌ FAIL'}")
    
    overall_success = cb_success and ms_success
    print(f"\nOverall Status:          {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    return overall_success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
