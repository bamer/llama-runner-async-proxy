import sys
import logging
import argparse
import os
import signal
import asyncio
import qasync  # type: ignore
from pathlib import Path

# Set UTF-8 encoding for stdout/stderr to handle Unicode characters
try:
    if getattr(sys.stdout, "encoding", None) != "utf-8":
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")  # type: ignore
        else:
            import io
            if hasattr(sys.stdout, "buffer"):
                sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
except Exception:
    pass

try:
    if getattr(sys.stderr, "encoding", None) != "utf-8":
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")  # type: ignore
        else:
            import io
            if hasattr(sys.stderr, "buffer"):
                sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace", line_buffering=True)
except Exception:
    pass

from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QCoreApplication
from PySide6.QtGui import QIcon

from llama_runner.config_loader import CONFIG_DIR, ensure_config_exists, load_config
from llama_runner.main_window import MainWindow
from llama_runner.headless_service_manager import HeadlessServiceManager
from llama_runner.services.config_validator import validate_config, log_validation_results  # Correction import
from llama_runner.services.config_updater import update_config_smart  # Correction import

def main():
    parser = argparse.ArgumentParser(description="Llama Runner application.")
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Set the minimum logging level for console output."
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run the application in headless mode (no GUI)."
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
        default="config/config.json",  # 🔥 CORRECTION CRITIQUE : Chemin vers config/config.json
        help="Path to the configuration file."
    )
    parser.add_argument(
        "--web-ui",
        action="store_true",
        help="Enable the web UI interface."
    )
    parser.add_argument(
        "--metrics",
        action="store_true",
        help="Enable the metrics dashboard."
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Enable development mode with extra logging."
    )
    args = parser.parse_args()

    ensure_config_exists()
    
    config_path = Path(CONFIG_DIR)/"config.json"
    if args.update_config:
        try:
            logging.info("Running smart config update...")
            update_config_smart(config_path)
        except Exception as e:
            logging.error(f"Config update failed: {e}")
            sys.exit(1)
    
    loaded_config = load_config()
    
    if not args.skip_validation:
        validation_errors = validate_config(dict(loaded_config))
        if not log_validation_results(validation_errors):
            logging.error("Configuration validation failed. Fix errors or use --skip-validation to proceed anyway.")
            sys.exit(1)

    # --- Logging Setup ---
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    if root_logger.hasHandlers():
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(name)s - %(message)s')
    console_handler = logging.StreamHandler(sys.stdout)
    console_log_level = getattr(logging, args.log_level.upper(), logging.INFO)
    console_handler.setLevel(console_log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # 🔥 CORRECTION CRITIQUE : Logs dans le dossier logs/ au lieu de ./config/
    if not os.path.exists("logs"):
        os.makedirs("logs")
    app_log_file_path = os.path.join("logs", "app.log")  # Chemin correct pour les logs
    
    try:
        app_file_handler = logging.FileHandler(app_log_file_path)
        app_file_handler.setLevel(logging.DEBUG)
        app_file_handler.setFormatter(formatter)
        root_logger.addHandler(app_file_handler)
        logging.info(f"App file logging to: {app_log_file_path}")
    except Exception as e:
        logging.error(f"Failed to create app file handler for {app_log_file_path}: {e}")
    # --- End Logging Setup ---

    # CORRECTION : Mode headless pour tous les modes serveur
    headless_mode = args.headless or args.web_ui or args.metrics or args.dev

    if sys.platform.startswith('linux') and not os.environ.get('DISPLAY') and not os.environ.get('WAYLAND_DISPLAY'):
        logging.warning("No display environment detected. Forcing headless mode.")
        headless_mode = True

    app = QCoreApplication.instance()
    if app is None:
        if headless_mode:
            app = QCoreApplication(sys.argv)
        else:
            app = QApplication(sys.argv)

    if not headless_mode and isinstance(app, QApplication):
        try:
            app.setWindowIcon(QIcon('app_icon.png'))
        except FileNotFoundError:
            logging.warning("App icon not found, proceeding without it.")

    try:
        loop = qasync.QEventLoop(app)
        asyncio.set_event_loop(loop)
    except Exception as e:
        logging.warning(f"Could not set up qasync event loop: {e}, falling back to default")

    exit_code = 0
    try:
        async def run_app():
            shutdown_event = asyncio.Event()
            
            if headless_mode:
                models_config = loaded_config.get("models", {})
                hsm = HeadlessServiceManager(loaded_config, models_config)

                async def shutdown_handler():
                    logging.info("Shutdown requested, stopping services...")
                    await hsm.stop_services()
                    shutdown_event.set()
                    app.quit()

                def signal_handler():
                    asyncio.create_task(shutdown_handler())

                try:
                    loop = asyncio.get_running_loop()
                    if sys.platform != 'win32':
                      loop.add_signal_handler(signal.SIGINT, signal_handler)
                except NotImplementedError:
                    logging.warning("Signal handlers not supported on this platform")
                except Exception as e:
                    logging.warning(f"Could not set up signal handler: {e}")

                # Start services and wait for shutdown signal
                await hsm.start_services()
                
                # AFFICHAGE DES URLS BASÉ SUR LA CONFIGURATION (sans emojis)
                logging.info("\n" + "="*60)
                logging.info("SERVICES ACCESSIBLES :")
                logging.info("="*60)
                
                # Proxies existants
                logging.info(f"Ollama Proxy: http://127.0.0.1:11434/")
                logging.info(f"LM Studio Proxy: http://127.0.0.1:1234/")
                logging.info("="*60 + "\n")

                await shutdown_event.wait()
            else:
                main_window = MainWindow()

                async def shutdown_handler():
                    logging.info("Shutdown requested, stopping services...")
                    main_window.close()
                    shutdown_event.set()
                    app.quit()

                def signal_handler():
                    asyncio.create_task(shutdown_handler())

                try:
                    loop = asyncio.get_running_loop()
                    if sys.platform != 'win32':
                        loop.add_signal_handler(signal.SIGINT, signal_handler)
                except NotImplementedError:
                    logging.warning("Signal handlers not supported on this platform")
                except Exception as e:
                    logging.warning(f"Could not set up signal handler: {e}")

                main_window.show()
                main_window.start_services()
                await shutdown_event.wait()

        asyncio.run(run_app())

    except Exception as e:
        logging.critical(f"An unhandled error occurred in main: {e}", exc_info=True)
        exit_code = 1
    finally:
        logging.info(f"Application exited with code {exit_code}.")
        sys.exit(exit_code)

if __name__ == '__main__':
    main()