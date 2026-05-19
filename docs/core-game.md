# Règles complètes

## Concept

Jeu d'affrontement territorial sur plateau hexagonal pour 2 joueurs. Aucun hasard pendant la partie : tout est positionnel et déterministe. Les joueurs gagnent des points en contrôlant du territoire et en s'emparant de points stratégiques. La victoire se joue à la fin du tour 20.

---

## 1. Matériel et setup

Plateau hexagonal avec deux zones de départ opposées.  
Chaque joueur dispose de 10 unités placées dans sa zone de départ au début de la partie.

Éléments fixes sur le plateau :

- Des villes (~6 à 8, à finaliser) réparties symétriquement : certaines proches de chaque base, d'autres au centre, d'autres en territoire ennemi.
- 3 bunkers placés aléatoirement avant le début de la partie, position fixe pendant toute la durée.

Zones de départ immunisées : aucune unité ennemie ne peut entrer dans la zone de départ adverse.

---

## 2. Déroulement d'un tour

La partie dure 20 tours. À chaque tour, un joueur :

1. **Phase de mouvement** (optionnelle) : déplace une seule unité de sa couleur.
2. **Phase de résolution de combat** : on examine toutes les captures déclenchées par le mouvement.

Les joueurs alternent les tours.

---

## 3. Mouvement

La vitesse d'une unité dépend de sa position de départ au moment du mouvement :

- **Vitesse 1 hex** si l'unité commence son mouvement dans le territoire qu'elle contrôle (derrière sa propre ligne).
- **Vitesse 3 hex** si l'unité commence son mouvement en dehors de son territoire (zone neutre ou territoire adverse).

Les unités peuvent traverser les villes et les bunkers.

---

## 4. Combat (capture par flanquement à distance)

Une unité est capturée si, sur un même axe hexagonal, les conditions suivantes sont réunies simultanément :

- Deux unités ennemies sont à distance ≤ 2 hex de la cible.
- Ces deux ennemis sont sur des côtés opposés de la cible (sandwich linéaire).
- La ligne de vue entre chaque tireur et la cible est dégagée.

**Ce qui bloque la ligne de vue :**

- Les unités alliées et ennemies.

**Ce qui ne bloque pas la ligne de vue :**

- Les villes (transparentes).
- Les bunkers (transparents).
- Les hexagones vides.

**Mâchoires alternatives au sandwich :**

- Les bords du plateau comptent comme mâchoire.
- Les bunkers contrôlés par le joueur attaquant comptent comme mâchoire (voir section bunkers).

**Règles de résolution :**

- Toute capture qui devient valide après un mouvement se déclenche, y compris si l'ouverture d'une ligne de vue par déplacement d'un allié la crée.
- Une unité qui se déplace dans une position où elle se retrouve en sandwich existant meurt aussi.
- Pas de cascade : on photographie l'état après le mouvement, toutes les captures simultanées se résolvent en bloc, et la phase de combat se termine.

---

## 5. Respawn

Une unité capturée :

- Réapparaît à la zone de départ de son propriétaire.
- Doit re-marcher normalement vers le front (vitesse 1 ou 3 selon sa position de départ chaque tour).
- Est immunisée à la mort tant qu'elle est dans la zone de départ.

---

## 6. Territoire et scoring

### Tracé de la ligne territoriale

Ta ligne est tracée en suivant tes unités les plus avancées par colonne (enveloppe supérieure côté adversaire). Une unité est considérée "sur la ligne" si elle est plus avancée que ses voisines de gauche et de droite. Sinon elle est "intérieure" et ne contribue pas au tracé.  
Les bunkers ne contribuent jamais au tracé de la ligne.

### Calcul des points de territoire

Un hexagone derrière ta ligne te rapporte 1 point si et seulement si :

- Il est effectivement derrière ta ligne, **ET**
- Sur sa colonne, aucune unité ennemie n'est plus proche de ta base que cet hexagone.

> **Conséquence stratégique majeure :** une seule unité ennemie infiltrée dans ton territoire annule tout le scoring de sa colonne entre elle et ta base. Les raids profonds sont une arme stratégique de premier plan.

---

## 7. Villes

### Propriétés physiques

- Position fixe sur le plateau (placement en dur, symétrique).
- Traversables par les unités.
- Transparentes aux lignes de vue (ne bloquent pas les sandwichs à distance).
- Ne servent pas de mâchoire de sandwich.

### Contrôle d'une ville

Une ville est contrôlée par toi si au moins l'une de ces conditions est vraie :

- Une de tes unités est posée dessus, **OU**
- La ville se trouve dans ton territoire (derrière ta ligne, avec les règles de scoring habituelles).

En cas de conflit (unité ennemie posée sur une ville située dans ton territoire) : l'occupation physique prime sur le territoire. La ville est contrôlée par le joueur dont une unité est dessus.

### Scoring des villes

Évalué uniquement à la fin de la partie (tour 20). Chaque ville contrôlée rapporte **5 points** à son contrôleur.

---

## 8. Bunkers

### Propriétés physiques

- Position aléatoire au setup, fixe pendant la partie.
- 3 bunkers par partie.
- Traversables par les unités.
- Transparents aux lignes de vue (ne bloquent pas les sandwichs à distance).
- Indestructibles.

### États du bunker

- **Inerte** par défaut : ne fait rien.
- **Actif** quand un joueur le contrôle territorialement.

### Contrôle d'un bunker

Un bunker est contrôlé par toi selon la même règle que le scoring des hexagones : si l'hexagone du bunker scorerait pour toi en tant qu'hex normal (derrière ta ligne, sans unité ennemie plus proche de ta base sur sa colonne), alors tu contrôles le bunker.  
Si aucun joueur ne remplit cette condition, le bunker reste inerte.

### Effets d'un bunker actif

Le bunker agit comme une unité de son contrôleur pour les calculs de sandwich :

- Il peut servir de mâchoire dans un sandwich (à distance ≤ 2 avec ligne de vue dégagée).
- Il ne se déplace pas, ne meurt pas, ne respawn pas.

Le bunker **ne compte pas** pour :

- Le tracé de la ligne territoriale.
- Le scoring final (ne rapporte aucun point en soi).

---

## 9. Victoire et fin de partie

À la fin du tour 20, on calcule le score total de chaque joueur :

> **Score total = points de territoire + (5 × nombre de villes contrôlées)**

Le joueur avec le score le plus élevé gagne.

---

## Philosophie de design

- **Aucun hasard pendant la partie** : tout est positionnel et déterministe.
- **Combat à portée 2 avec ligne de vue** : les unités alliées servent de boucliers.
- **Trade-offs omniprésents** entre étendre sa ligne (scorer), garder de la profondeur (défendre, intercepter les raids), et occuper des points clés (villes, bunkers).
- **Crescendo de fin de partie** : les villes étant scorées uniquement au tour 20, des renversements dramatiques sont possibles jusqu'au dernier moment.
