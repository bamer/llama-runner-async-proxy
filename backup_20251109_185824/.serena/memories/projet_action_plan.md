# Plan d'Action Global - Llama Runner Async Proxy

## Objectifs Prioritaires

1. **Restaurer l'interface React**
   - Localiser l'interface React (potentiellement dans `/dashboard` ou backups)
   - Réintégrer l'interface moderne dans le système

2. **Démarrer llama.cpp avec WebUI**
   - Activer la WebUI de llama-server sur le port 8080
   - Ajuster les ports des autres interfaces si nécessaire

3. **Implémenter le reverse proxy complet**
   - Étendre le modèle existant pour Ollama/LM Studio à llama.cpp
   - Permettre l'accès direct à l'interface Web de llama.cpp

4. **Améliorer la qualité du code**
   - Corriger les erreurs Pylance
   - Éliminer les casts explicites
   - Nettoyer le code pour améliorer la qualité

5. **Nettoyer la structure du projet**
   - Supprimer les fichiers/répertoires obsolètes
   - Organiser correctement les composants

6. **Compléter les tests fonctionnels**
   - Atteindre 100% de couverture de test
   - Valider la cohérence du système

## Ordre d'exécution

- [x] Analyse initiale
- [ ] Phase 1 : Interface React & llama.cpp WebUI
- [ ] Phase 2 : Reverse proxy
- [ ] Phase 3 : Qualité du code
- [ ] Phase 4 : Nettoyage structure
- [ ] Phase 5 : Tests fonctionnels