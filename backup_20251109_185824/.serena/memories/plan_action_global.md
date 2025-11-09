# Plan d'Action Global - Llama Runner Async Proxy

## Objectifs Prioritaires

1. **Restaurer l'interface React**
   - Localiser l'interface React (potentiellement dans `/dashboard` ou ailleurs)
   - Réintégrer l'interface moderne dans le projet

2. **Démarrage de llama.cpp avec WebUI**
   - Activer la WebUI de llama-server sur le port 8080
   - Ajuster les ports des autres UI pour éviter les conflits

3. **Implémentation du reverse proxy pour llama.cpp**
   - Comparer avec les proxys Ollama/LM Studio existants
   - Implémenter un reverse proxy fonctionnel pour l'interface WebUI de llama.cpp

4. **Amélioration de la qualité du code**
   - Corriger les erreurs remontées par Pylance
   - Supprimer les casts inutiles
   - Élever le niveau de qualité du code (tout en gardant la fonctionnalité)

5. **Nettoyage des fichiers et répertoires obsolètes**
   - Identifier et supprimer les éléments inutiles
   - Organiser la structure du projet pour une meilleure maintenance

6. **Compléter les tests fonctionnels**
   - Atteindre un coverage de 100%
   - Assurer la cohérence et la fiabilité du projet

## Ordre de Priorité pour les Premières Étapes

1. Restaurer l'interface React
2. Démarrage de llama.cpp avec WebUI
