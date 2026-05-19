---
name: testing
description: Use when writing, modifying, or debugging tests in the hexgrid project
auto_invoke: true
---

# Tests - Hexgrid

## Commande

```bash
source ~/.nvm/nvm.sh && nvm use 22 && npx vitest run
```

## Philosophie

- Tests **macro uniquement** : on teste le comportement fonctionnel, pas les détails d'implémentation
- Utiliser les fonctions exportées comme un utilisateur du module le ferait
- Pas de mocks sauf nécessité absolue

## Fichiers de test

La table de routage sera complétée au fur et à mesure que les fichiers de test apparaissent.
