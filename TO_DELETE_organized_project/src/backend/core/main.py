"""
LlamaRunner Pro - Backend Core Module

Main application entry point with separation of concerns:
- Application lifecycle management
- Service orchestration
- Configuration loading
- Error handling
"""

import asyncio
import sys
import argparse
import logging
from pathlib import Path

# Add src to Python path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.backend.services.config_service import ConfigService
from src.backend.services.proxy_service import ProxyService
from src.backend.monitoring.metrics_server import MetricsServer
from src.backend.services.service_manager import ServiceManager

def setup_logging(log_level: str = "INFO"):
    """Configure application logging"""
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('llamarunner.log')
        ]
    )

def main():
    """Main application entry point"""
    parser = argparse.ArgumentParser(description="LlamaRunner Pro - Professional AI Proxy Suite")
    parser.add_argument("--config", default="config.json", help="Configuration file path")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    parser.add_argument("--lm-studio-port", type=int, default=1234, help="LM Studio API port")
    parser.add_argument("--ollama-port", type=int, default=11434, help="Ollama API port")
    parser.add_argument("--metrics-port", type=int, default=8080, help="Metrics dashboard port")
    parser.add_argument("--webui-port", type=int, default=8081, help="Web UI port")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode")
    parser.add_argument("--web-ui", action="store_true", help="Enable web UI")
    parser.add_argument("--metrics", action="store_true", help="Enable metrics dashboard")
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.log_level)
    logger = logging.getLogger(__name__)
    
    logger.info("🚀 Starting LlamaRunner Pro...")
    
    async def run_app():
        try:
            # Initialize services
            config_service = ConfigService(args.config)
            config = await config_service.load_config()
            
            # Create service manager
            service_manager = ServiceManager()
            
            # Setup services
            proxy_service = ProxyService(
                lm_studio_port=args.lm_studio_port,
                ollama_port=args.ollama_port,
                config=config
            )
            
            services = {
                'proxy': proxy_service,
            }
            
            # Add metrics server if enabled
            if args.metrics:
                metrics_server = MetricsServer(
                    port=args.metrics_port
                )
                services['metrics'] = metrics_server
            
            # Start all services
            await service_manager.start_services(services)
            
            # Run application
            if args.headless:
                logger.info("🖥️  Running in headless mode")
                await service_manager.wait_for_shutdown()
            else:
                logger.info("🖼️  Running with GUI")
                # Import GUI only when needed
                from src.frontend.gui.main_window import MainWindow
                
                from PySide6.QtWidgets import QApplication
                app = QApplication(sys.argv)
                window = MainWindow(service_manager, config)
                window.show()
                sys.exit(app.exec())
                
        except Exception as e:
            logger.error(f"❌ Application failed to start: {e}")
            sys.exit(1)
    
    # Run the application
    asyncio.run(run_app())

if __name__ == "__main__":
    main()
