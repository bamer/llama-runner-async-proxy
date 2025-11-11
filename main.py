#!/usr/bin/env python3
"""
headless_main.py - Entry point for headless service mode
Critical separation from GUI dependencies to ensure stable operation
"""

import sys
import logging
import argparse
import os
import signal
import asyncio
from pathlib import Path
import json

# Set UTF-8 encoding for stdout/stderr
try:
    if getattr(sys.stdout, "encoding", None) != "utf-8":
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        else:
            import io
            if hasattr(sys.stdout, "buffer"):
                sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
except Exception as e:
    logging.warning(f"Failed to set UTF-8 encoding for stdout: {e}")

try:
    if getattr(sys.stderr, "encoding", None) != "utf-8":
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
        else:
            import io
            if hasattr(sys.stderr, "buffer"):
                sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace", line_buffering=True)
except Exception as e:
    logging.warning(f"Failed to set UTF-8 encoding for stderr: {e}")

# Import ONLY headless-compatible modules
from llama_runner.config_loader import ensure_config_exists, load_config, load_models_config
from llama_runner.headless_service_manager import HeadlessServiceManager
from llama_runner.services.config_validator import validate_config, log_validation_results
from llama_runner.services.config_updater import update_config_smart

def setup_logging(log_level: str = "INFO"):
    """Configure logging for headless mode"""
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Clear existing handlers
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    
    # Set root logger level
    root_logger.setLevel(logging.DEBUG)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(name)s - %(message)s'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler
    file_handler = logging.FileHandler(os.path.join("logs", "headless.log"))
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    logging.info("Logging configured for headless mode")

async def shutdown_handler(hsm: HeadlessServiceManager):
    """Graceful shutdown handler"""
    logging.info("Shutdown requested, stopping services...")
    await hsm.stop_services()
    logging.info("All services stopped gracefully")

def signal_handler_factory(hsm: HeadlessServiceManager, loop: asyncio.AbstractEventLoop):
    """Factory for platform-agnostic signal handling"""
    async def handle_signal():
        await shutdown_handler(hsm)
        loop.stop()
    
    def _handler():
        asyncio.create_task(handle_signal())
    
    return _handler

def main():
    parser = argparse.ArgumentParser(description="Llama Runner Headless Service")
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Set the minimum logging level for console output."
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip configuration validation at startup."
    )
    parser.add_argument(
        "--update-config",
        action="store_true",
        help="Run smart config update (migrations, cleanup) before starting."
    )
    parser.add_argument(
        "--config",
        type=str,
        default="config/app_config.json",
        help="Path to the main configuration file."
    )
    parser.add_argument(
        "--models-config",
        type=str,
        default="config/models_config.json",
        help="Path to the models configuration file."
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Enable development mode with extra logging."
    )
    args = parser.parse_args()

    # Setup logging first
    setup_logging(args.log_level)
    
    try:
        logging.info("=== STARTING HEADLESS SERVICE ===")
        
        # Ensure config exists and load
        ensure_config_exists()
        
        if args.update_config:
            logging.info("Running smart config update...")
            update_config_smart(Path(args.config))
        
        # Load configurations
        app_config = load_config()
        models_config = load_models_config()
        
        # Validate configuration
        if not args.skip_validation:
            validation_errors = validate_config(dict(app_config))
            if not log_validation_results(validation_errors):
                logging.error("Configuration validation failed. Fix errors or use --skip-validation to proceed anyway.")
                sys.exit(1)
        
        logging.info("Configuration loaded and validated successfully")
        
        # Create service manager
        hsm = HeadlessServiceManager(app_config, models_config)
        
        # Setup event loop
        loop = asyncio.get_event_loop()
        
        # Setup signal handlers
        signal_handler = signal_handler_factory(hsm, loop)
        
        if sys.platform != 'win32':
            # Unix-like systems support signal handlers
            for sig in (signal.SIGINT, signal.SIGTERM):
                loop.add_signal_handler(sig, signal_handler)
        else:
            # Windows: use atexit and signal.signal
            import atexit
            atexit.register(lambda: asyncio.create_task(shutdown_handler(hsm)))
            
            def win_signal_handler(sig, frame):
                logging.info(f"Received signal {sig}, initiating shutdown")
                asyncio.create_task(shutdown_handler(hsm))
            
            signal.signal(signal.SIGINT, win_signal_handler)
            signal.signal(signal.SIGTERM, win_signal_handler)
        
        # Display service URLs
        logging.info("\n" + "="*60)
        logging.info("SERVICES ACCESSIBLES :")
        logging.info("="*60)
        logging.info(f"Ollama Proxy: http://127.0.0.1:11434/")
        logging.info(f"LM Studio Proxy: http://127.0.0.1:1234/")
        logging.info(f"Dashboard Web: http://127.0.0.1:8035/")
        logging.info(f"Metrics Server: http://127.0.0.1:8080/")
        logging.info("="*60 + "\n")
        
        # Start services
        logging.info("Starting all services...")
        # Schedule starting services in the event loop
        loop.create_task(hsm.start_services())
        
        # Run event loop
        logging.info("Headless service running. Press Ctrl+C to shutdown.")
        loop.run_forever()
        
    except Exception as e:
        logging.critical(f"Critical error in headless service: {e}", exc_info=True)
        sys.exit(1)
    finally:
        logging.info("Headless service shutting down")

if __name__ == '__main__':
    main()