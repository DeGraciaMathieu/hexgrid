Lance le skill pre-commit pour vérifier les règles, puis groupe les fichiers modifiés en commits logiques cohérents, et pousse les commits sur le remote.

1. Lance le skill `/pre-commit` et arrête-toi si des violations sont détectées.
2. Exécute `git status` et `git diff` pour identifier les changements en cours.
3. Regroupe les fichiers par thème logique (ex: logique de jeu, tests, config, docs).
4. Pour chaque groupe, crée un commit avec un message court et précis en français.
5. Pousse tous les commits avec `git push`.
6. Confirme le résultat : nombre de commits créés, branche, état du push.
