Tu vas accompagner l'utilisateur sur une nouvelle feature ou tâche.

## Étape 1 — cadrage

Pose ces questions en une seule fois :

1. **Objectif** — en une phrase, qu'est-ce qu'on construit ou modifie ?
2. **Périmètre** — quels fichiers ou modules sont concernés ? (répondre "à toi de me dire" si ce n'est pas clair)
3. **Contraintes** — y a-t-il une règle de jeu, une convention visuelle, ou une décision technique à clarifier avant de coder ?

Attends la réponse avant d'aller plus loin.

## Étape 2 — reformulation

Reformule en bloc structuré et demande confirmation :

```
feature    : <objectif>
périmètre  : <fichiers ou modules concernés>
hors scope : <ce qui ne doit pas être touché>
contraintes: <liste ou "aucune">
```

Si quelque chose est ambigu, pose les questions de clarification maintenant.

## Étape 3 — plan

Une fois le cadrage confirmé, propose un plan en 3 à 6 étapes atomiques. Pour chaque étape, précise :
- ce qui est modifié (`data/`, `components/`, `src/`, tests, etc.)
- si des règles de `docs/core-game.md` ou des conventions de `docs/visual-conventions.md` s'appliquent

Attends validation du plan avant de coder.

## Étape 4 — exécution

Suis le plan validé, étape par étape. À chaque étape :
- annonce ce que tu fais,
- propose le diff ou le code,
- signale si tu détectes un besoin d'élargir le périmètre (stop et demande plutôt que d'agir).

## Étape 5 — récap final

En fin de feature, produis un récap :
- ce qui a été fait,
- tests ajoutés ou modifiés,
- dette technique éventuelle créée.
