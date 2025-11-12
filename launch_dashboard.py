#!/usr/bin/env python3
"""
Lance le backend Python et le dashboard Vue.js simultanément
"""

import subprocess
import sys
import os
import signal
import threading
import time
import logging
from pathlib import Path
import shutil # Pour shutil.which

# Configuration
BACKEND_SCRIPT = "main.py"
DASHBOARD_DIR = "dashboard"

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DashboardLauncher:
    def __init__(self):
        self.backend_process = None
        self.dashboard_process = None
        self.running = True
        # Tenter de trouver npm automatiquement
        self.npm_cmd = self._find_npm()

    def _find_npm(self):
        """Tente de localiser l'exécutable npm"""
        # 1. Essayer de trouver npm via shutil.which (recherche dans PATH)
        npm_path = shutil.which("npm")
        if npm_path:
            logger.info(f"✅ npm trouvé via PATH: {npm_path}")
            return npm_path

        # 2. Essayer de trouver npm via la commande 'where npm' (Windows)
        try:
            result = subprocess.run(["where", "npm"], capture_output=True, text=True, check=True)
            npm_path = result.stdout.strip().split('\n')[0]  # Prendre le premier résultat
            if npm_path and Path(npm_path).exists():
                logger.info(f"✅ npm trouvé via 'where': {npm_path}")
                return npm_path
        except (subprocess.CalledProcessError, IndexError):
            logger.debug("npm non trouvé via 'where npm'")

        # 3. Si npm n'est pas trouvé, retourner None
        logger.warning("⚠️ npm n'a pas été trouvé dans le PATH ou via 'where'.")
        return None

    def start_backend(self):
        """Démarre le backend Python"""
        try:
            logger.info("Démarrage du backend Python...")
            
            # Commande pour lancer le backend
            cmd = [sys.executable, BACKEND_SCRIPT, "--log-level", "INFO"]
            
            # Lancer le processus
            self.backend_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=os.getcwd()  # Utiliser le répertoire courant
            )
            
            logger.info("Backend démarré avec succès")
            
            # Lire les logs en continu
            while self.running and self.backend_process.poll() is None:
                output = self.backend_process.stdout.readline()
                if output:
                    print(f"[BACKEND] {output.strip()}")
                
                # Vérifier si le processus est toujours actif
                if self.backend_process.poll() is not None:
                    break
                    
        except Exception as e:
            logger.error(f"Erreur lors du démarrage du backend: {e}")
            
    def start_dashboard(self):
        """Démarre le dashboard Vue.js"""
        try:
            dashboard_path = Path(DASHBOARD_DIR)
            if not dashboard_path.exists():
                logger.error(f"Le répertoire {DASHBOARD_DIR} n'existe pas")
                return
            
            # Vérifier si package.json existe dans le dossier dashboard
            package_json_path = dashboard_path / "package.json"
            if not package_json_path.exists():
                logger.warning(f"⚠️ Le fichier {package_json_path} n'existe pas. Le dashboard ne peut pas être lancé.")
                logger.info("💡 Pour lancer le dashboard manuellement : cd dashboard && npm run dev")
                return

            # Vérifier si npm est disponible (en utilisant le chemin trouvé)
            if not self.npm_cmd:
                logger.error("❌ npm n'est pas installé ou n'est pas dans le PATH.")
                logger.info("💡 Veuillez installer Node.js (qui inclut npm) depuis https://nodejs.org/")
                logger.info("💡 Après installation, redémarrez votre terminal.")
                logger.info("💡 Si le problème persiste, assurez-vous que le chemin de npm est dans votre PATH système.")
                return

            logger.info("Démarrage du dashboard Vue.js...")
            
            # Vérifier si npm est accessible via le chemin trouvé
            try:
                # Utiliser le chemin absolu de npm trouvé par _find_npm
                subprocess.run([self.npm_cmd, "--version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=str(dashboard_path))
            except (subprocess.CalledProcessError, FileNotFoundError) as e:
                logger.error(f"❌ Erreur lors de la vérification de npm ({self.npm_cmd}): {e}")
                logger.info("💡 Veuillez vérifier que Node.js est correctement installé.")
                return
            
            # Commande pour lancer le dashboard en utilisant le chemin absolu de npm
            cmd = [self.npm_cmd, "run", "dev"]
            
            # Lancer le processus dans le répertoire du dashboard
            self.dashboard_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=str(dashboard_path)
            )
            
            logger.info("Dashboard démarré avec succès sur http://localhost:8080")
            
            # Lire les logs en continu
            while self.running and self.dashboard_process.poll() is None:
                output = self.dashboard_process.stdout.readline()
                if output:
                    print(f"[DASHBOARD] {output.strip()}")
                
                # Vérifier si le processus est toujours actif
                if self.dashboard_process.poll() is not None:
                    break
                    
        except Exception as e:
            logger.error(f"Erreur lors du démarrage du dashboard: {e}")
            
    def signal_handler(self, signum, frame):
        """Gestionnaire de signaux pour arrêt propre"""
        logger.info(f"Reçu le signal {signum}, arrêt en cours...")
        self.stop_all()
        
    def stop_all(self):
        """Arrête tous les processus"""
        self.running = False
        
        if self.backend_process:
            logger.info("Arrêt du backend...")
            self.backend_process.terminate()
            try:
                self.backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()
            
        if self.dashboard_process:
            logger.info("Arrêt du dashboard...")
            self.dashboard_process.terminate()
            try:
                self.dashboard_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.dashboard_process.kill()
        
        logger.info("Tous les services arrêtés")

    def run(self):
        """Démarre les deux services et gère les signaux"""
        # Enregistrer le gestionnaire de signaux
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Démarrer les deux services en parallèle
        backend_thread = threading.Thread(target=self.start_backend)
        dashboard_thread = threading.Thread(target=self.start_dashboard)
        
        backend_thread.start()
        time.sleep(3)  # Donner un peu de temps au backend avant de lancer le dashboard
        dashboard_thread.start()
        
        try:
            # Attendre que les threads se terminent
            backend_thread.join()
            dashboard_thread.join()
        except KeyboardInterrupt:
            self.signal_handler(signal.SIGINT, None)


def main():
    launcher = DashboardLauncher()
    launcher.run()

if __name__ == "__main__":
    main()