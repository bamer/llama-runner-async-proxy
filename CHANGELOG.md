# Changelog

## [2025-11-08] (Correctif définitif UI/WebUI)
- ✅ **Correction complète du mode headless**:
  - Mode headless activé automatiquement pour `--web-ui`, `--metrics`, `--llamacpp-webui` et `--dev`
  - Résolution définitive du problème de fenêtre Qt gelée en mode proxy
  - Ajout des arguments manquants: `--metrics` et `--llamacpp-webui`
- ✅ **Services WebUI complets implémentés**:
  - **WebUI service** (port 8081) : Interface utilisateur web fonctionnelle
  - **Metrics Dashboard** (port 8080) : Tableau de bord des métriques opérationnel
  - **llama.cpp WebUI proxy** (port 8085) : Proxy redirigeant vers http://localhost:8000
  - Tous les services démarrent correctement et s'arrêtent proprement
- ✅ **Messages d'URL clairs et précis**:
  ```log
  ✅ WebUI disponible à: http://localhost:8081/
  ✅ Tableau de bord disponible à: http://localhost:8080/
  ✅ Proxy llama.cpp WebUI disponible à: http://localhost:8085/
     → Redirige vers: http://localhost:8000 (WebUI de llama-server)
  ```
- ✅ **Gestion CORS complète**:
  - Tous les services WebUI ont un middleware CORS configuré pour les requêtes cross-origin
  - Réponses API cohérentes et sécurisées

## [2025-11-08] (Réparation d'urgence)
- ✅ **Réparation complète des fichiers corrompus**:
  - Recréation totale de `scripts/model_management.ps1` avec menu fonctionnel
  - Recréation totale de `main.py` avec logique corrigée
  - Élimination de toutes les modifications aveugles précédentes