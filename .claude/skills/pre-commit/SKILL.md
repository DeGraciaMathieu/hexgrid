---
name: pre-commit
description: Vérifie que les changements en cours respectent les règles du jeu avant de committer. À utiliser avant chaque commit.
auto_invoke: false
---

Avant de committer, vérifie que les modifications en cours respectent les règles du jeu.

1. Récupère les changements stagés avec `git diff --cached` et les changements non stagés avec `git diff`.
2. Lis `docs/core-game.md` pour avoir les règles en tête.
3. Analyse les changements : est-ce qu'ils introduisent un comportement qui contredit ou ignore une règle du jeu ?
4. Si tout est conforme : confirme en une phrase et laisse le commit se poursuivre.
5. Si un écart est détecté : décris précisément la règle violée et le code concerné, et attends la décision de l'utilisateur avant de committer.
