# Comportement de l'IA

L'IA joue le rôle du joueur 2 (P2, rouge, part du haut).

## Architecture

L'IA est un module pur (`src/engine/ai.js`) sans dépendance React. Elle ne touche pas au state de l'application et n'appelle aucun handler UI. Elle reçoit un snapshot de l'état du jeu et retourne une décision. C'est `App.jsx` qui applique cette décision via ses propres setters.

## Déroulement d'un tour IA

L'IA joue avec un délai visuel pour que le joueur humain suive :

1. **t = 0** — décision calculée en amont (synchrone, état frais)
2. **t = 600 ms** — l'unité choisie s'affiche sélectionnée
3. **t = 1 200 ms** — la destination s'affiche (flèche + cible)
4. **t = 1 800 ms** — le mouvement est appliqué

Si aucun mouvement n'est possible, le tour est passé après 600 ms.

## Évaluation des mouvements

Pour chaque unité P2 et chaque hex atteignable, l'IA simule le mouvement et calcule un score :

```
score = (captures_ennemies × 1 000) + delta_territorial - (auto_capture ? 500 : 0)
```

Le mouvement avec le meilleur score est retenu.

### Règle de survie

Un mouvement où l'unité serait auto-capturée **sans** capturer d'ennemi en échange est systématiquement écarté.

### Priorités implicites

1. **Capture ennemie** — un mouvement qui capture un ennemi prime toujours sur un simple gain territorial (poids ×1 000)
2. **Gain territorial** — parmi les mouvements sûrs, l'IA choisit celui qui maximise `countTerritoryHexes`
3. **Avance par défaut** — si tous les mouvements ont le même score territorial, le meilleur score global détermine le choix (les hexes plus avancés génèrent naturellement plus de territoire)

## Respawn

Quand une unité P2 est capturée, l'IA choisit le hex de sa ligne de départ (row 0) qui maximise son score territorial après replacement. Le délai visuel est de 600 ms.

## Interaction avec le joueur humain

Pendant le tour de l'IA, toute interaction humaine est bloquée :

- clic sur un hex → ignoré
- touche Espace → ignorée
- clic sur un hex de respawn appartenant à P2 → ignoré

## Fichiers concernés

| Fichier | Rôle |
|---|---|
| `src/engine/ai.js` | Logique de décision (pur, sans React) |
| `src/App.jsx` | Intégration : deux `useEffect` (move + respawn), blocage interaction |
