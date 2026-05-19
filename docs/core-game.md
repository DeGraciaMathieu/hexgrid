# Règles complètes

## Concept

Jeu d'affrontement territorial sur plateau hexagonal pour 2 joueurs. Aucun hasard pendant la partie : tout est positionnel et déterministe. Les joueurs gagnent des points en contrôlant du territoire et en s'emparant de points stratégiques. La victoire se joue à la fin du tour 20.

---

## 1. Matériel et setup

Plateau hexagonal avec deux zones de départ opposées.  
Chaque joueur dispose de 5 unités placées dans sa zone de départ au début de la partie.

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

## 4. Combat (capture par encerclement)

Une unité est capturée si, après un mouvement, **au moins 2 unités ennemies se trouvent à distance ≤ 2 hex d'elle**.

**Règles de résolution :**

- On photographie l'état après le mouvement. Toutes les captures valides se résolvent simultanément, y compris si l'unité déplacée est elle-même en position d'être capturée.
- Pas de cascade : la phase de combat se termine après cette unique résolution.

---

## 5. Respawn

Une unité capturée est retirée du plateau. Le joueur propriétaire doit immédiatement choisir une case libre sur sa ligne de départ (rangée de bord côté déploiement) pour l'y replacer avant que le jeu ne continue.

- Le choix de la case est libre parmi les cases non occupées de la ligne de départ.
- L'unité doit re-marcher normalement vers le front (vitesse 1 ou 3 selon sa position de départ chaque tour).
- Elle est immunisée à la capture tant qu'elle est dans la zone de départ.

---

## 6. Territoire et scoring

### Tracé de la ligne territoriale

Ta ligne est le chemin reliant tes unités de gauche à droite qui **maximise le territoire englobé** entre ce tracé et ta zone de départ, sous la contrainte qu'**aucune unité ennemie ne se trouve à l'intérieur** du polygone formé.

- **Unité de frontière** : unité de ton camp qui appartient au tracé de la ligne.
- **Unité intérieure** : unité de ton camp située dans ton territoire mais qui ne contribue pas au tracé. Elle reste pleinement active (combat, blocage de ligne de vue, mouvement).

Si une unité ennemie se retrouve à l'intérieur du polygone optimal (brèche), le tracé est révisé pour contourner l'intrus en passant entre lui et ta zone de départ — la ligne "plonge" vers l'arrière pour l'exclure, promouvant au passage des unités intérieures en unités de frontière. Si aucun contour valide n'est possible faute d'unités intérieures suffisantes, la portion de territoire concernée est perdue.

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

Le bunker agit comme une unité de son contrôleur pour les calculs de capture :

- Il compte comme l'une des 2 unités requises pour capturer un ennemi à distance ≤ 2.
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
- **Combat par encerclement à portée 2** : 2 unités suffisent pour capturer un ennemi à portée.
- **Trade-offs omniprésents** entre étendre sa ligne (scorer), garder de la profondeur (défendre, intercepter les raids), et occuper des points clés (villes, bunkers).
- **Crescendo de fin de partie** : les villes étant scorées uniquement au tour 20, des renversements dramatiques sont possibles jusqu'au dernier moment.
