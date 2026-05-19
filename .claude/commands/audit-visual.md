Vérifie que le code respecte les conventions visuelles définies dans `docs/visual-conventions.md`.

1. Lis `docs/visual-conventions.md` et extrais chaque convention par section.
2. Lis les fichiers sources dans `src/` pour comprendre l'implémentation complète.
3. Pour chaque convention, détermine son statut :
   - ✅ Respectée
   - ❌ Violée (ex: couleur hardcodée au lieu d'une variable, mauvaise police, taille incorrecte)
   - ⚠️ Partiellement respectée ou comportement incertain
4. Produis un rapport structuré par section des conventions (Palette, Terrain, Grille, Unités, Lignes de formation, Trails, Zones d'influence, Typographie, Fond) avec le statut de chaque point et, pour les ❌ et ⚠️, le fichier et la ligne concernés.
5. Si des écarts sont détectés, liste-les séparément en fin de rapport et propose des corrections — mais n'écris aucun code sans validation de l'utilisateur.
