# Spec — Capacités des unités

## Contexte

Chaque équipe commence avec 5 unités. Les deux équipes partagent 4 types communs (Trooper, Gunner, Sniper, Leader) et ont chacune une unité exclusive qui crée une asymétrie tactique : la **Medic** pour l'équipe 1 (Bleu), le **Fighter** pour l'équipe 2 (Rouge).

Par défaut (sans capacité) : portée de mouvement 2, capture si 2 ennemis avec LOS à distance ≤ 2.

---

## Trooper (T) — Éclaireur mobile

**Capacité : portée de mouvement 3 hexes**

Le Trooper est l'unité la plus rapide. Il couvre davantage de terrain en un seul tour et peut atteindre des positions hors de portée des autres unités.

**Rôle tactique :**
Le Trooper est un flanker. Il ouvre des lignes de territoire rapidement en début de partie, occupe les flancs avant l'adversaire, et se repositionne facilement si la frontière bouge. Il est aussi utile pour fermer un encerclement : s'il manque juste un allié pour compléter une capture, le Trooper peut souvent combler la distance.

**Synergie clé — Leader :**
Si le Leader est adjacent au Trooper, ce dernier monte à 4 hexes de mouvement. C'est la combinaison la plus explosive du jeu — à protéger et à redouter.

**Faiblesse :**
Résistance à la capture normale (2 ennemis suffisent). Son agressivité peut le laisser isolé loin de ses alliés, vulnérable à un encerclement rapide.

---

## Gunner (G) — Zone de suppression

**Capacité : participe à une capture depuis distance ≤ 3**

Le Gunner étend sa contribution à la capture sans avoir à se rapprocher du danger. Là où un Trooper doit se mettre à distance 2, le Gunner reste à distance 3 et constitue quand même un second témoin de capture.

**Rôle tactique :**
Le Gunner est une menace de zone. Il crée une bulle d'influence autour de lui que l'ennemi ne peut pas ignorer : avancer dans son rayon sans protection, c'est risquer la capture dès qu'un allié arrive à portée. Il libère aussi une autre unité de la contrainte de proximité, ce qui permet de jouer sur deux angles simultanément.

**Synergie clé — Sniper :**
Gunner (portée 3) + Sniper (portée 4) couvrent ensemble tout un couloir du plateau. Une unité avancée peut suffire à déclencher la capture si ces deux-là ont LOS — ce duo verrouille le centre sans prendre de risque.

**Faiblesse :**
Portée de mouvement standard (2). Le Gunner est efficace depuis sa position actuelle, mais si la ligne de front se déplace rapidement, il peut se retrouver hors de portée utile. Il dépend des autres pour fixer l'ennemi.

---

## Sniper (S) — Menace longue portée

**Capacité : participe à une capture depuis distance ≤ 4, LOS non bloquée par les forêts**

Le Sniper est une menace permanente depuis l'arrière du dispositif. Sa portée de capture couvre pratiquement la moitié du plateau, et les forêts ne l'aveuglent pas.

**Rôle tactique :**
Le Sniper joue en retrait. Il n'a pas besoin d'avancer pour être dangereux : n'importe quelle unité alliée en position avancée peut compléter un binôme de capture avec lui. Cela force l'adversaire à surveiller les angles lointains et à ne jamais se croire en sécurité à distance. Le Sniper est aussi un excellent "dernier recours" pour des captures que les autres unités ne peuvent pas atteindre.

**Synergie clé — Trooper ou Gunner :**
Un Trooper avance agressivement, le Sniper couvre depuis 4 hexes derrière. L'ennemi doit traiter deux menaces sur des distances très différentes.

**Faiblesse :**
Résistance à la capture standard. S'il est encerclé (ce qui prend de la planification de l'adversaire), il tombe comme n'importe qui. Sa valeur tient à sa position — mal placé ou trop avancé, il perd tout son avantage.

---

## Leader (L) — Pivot de commandement

**Capacité : les alliés à distance ≤ 1 gagnent +1 hex de mouvement ce tour**

Le Leader n'est pas une arme directe : c'est un multiplicateur. Son effet est passif et permanent tant qu'il reste en position. Un allié adjacent à lui a une portée de mouvement de 3 au lieu de 2.

**Rôle tactique :**
Le Leader définit le centre de gravité tactique de l'équipe. Se positionner autour de lui est un avantage permanent, s'en éloigner est un coût. Il crée une pression de formation : les unités ont intérêt à rester groupées, ce qui peut être difficile à concilier avec la dispersion territoriale. Jouer contre un Leader, c'est essayer de le découper de ses alliés ou de le capturer en priorité.

**Synergie clé — toutes les unités :**
Le Leader améliore tout le monde, mais son effet est particulièrement fort sur le Trooper (4 hexes) et le Gunner (qui peut avancer d'un hex sans perdre son efficacité).

**Faiblesse :**
Valeur cible prioritaire. Si le Leader est capturé, toute l'équipe perd l'avantage de mobilité le temps qu'il respawn et se repositionne. Le capturer tôt peut casser le tempo adverse.

---

## Medic (M) — Bouclier défensif *(équipe Bleu uniquement)*

**Capacité : une fois par tour, immunise un allié adjacent contre toute capture ce tour**

La Medic annule une capture potentielle sur l'unité qu'elle protège. L'ennemi devra soit attendre, soit contourner, soit rediriger son attaque.

**Rôle tactique :**
La Medic joue défensivement. Elle protège les unités à haute valeur (Leader, Sniper) qui sont des cibles prioritaires. Sa présence force l'adversaire à sur-investir : capturer une unité gardée par la Medic nécessite soit de capturer la Medic d'abord, soit d'attaquer une autre cible. Elle crée de l'incertitude : l'ennemi ne sait jamais quelle unité est sous protection ce tour.

**Synergie clé — Leader :**
Medic adjacente au Leader = le Leader est très difficile à éliminer. C'est le duo le plus défensif du jeu : pour "tuer" le Leader, il faut d'abord isoler la Medic.

**Faiblesse :**
Contribution offensive nulle. La Medic ne tire pas, ne bouge pas plus vite, ne capture pas à distance. Un tour où elle immunise une unité est un tour où elle ne fait que ça. Si l'équipe Rouge joue rapidement et agressivement sur plusieurs fronts simultanément, la Medic ne peut pas être partout.

**Asymétrie avec le Fighter :**
Le Bleu joue défense active — il encaisse et protège. Pour éliminer ses unités importantes, le Rouge doit d'abord neutraliser la Medic.

---

## Fighter (F) — Avant-garde résistante *(équipe Rouge uniquement)*

**Capacité : nécessite 3 ennemis avec LOS pour être capturé (au lieu de 2)**

Le Fighter est plus dur à abattre. Les règles standard de capture ne s'appliquent pas à lui : il faut un effort collectif supplémentaire pour l'éliminer.

**Rôle tactique :**
Le Fighter est fait pour jouer en avant. Il peut s'avancer en terrain hostile là où une autre unité serait immédiatement vulnérable, car l'ennemi doit mobiliser 3 unités avec LOS simultanément pour le capturer — ce qui coûte cher en positionnement. Il ancre les positions avancées, force des réponses disproportionnées, et libère les autres unités Rouges pour des manœuvres plus larges.

**Synergie clé — Gunner :**
Fighter en avant qui "absorbe" l'attention, Gunner derrière à portée 3. L'ennemi doit gérer les deux sans pouvoir concentrer facilement ses forces.

**Faiblesse :**
Aucun avantage offensif. Le Fighter dure plus longtemps, mais ne capture pas plus vite, ne voit pas plus loin, ne bouge pas plus loin. Sa valeur est entièrement positionnelle : mal placé, c'est une unité normale.

**Asymétrie avec la Medic :**
Le Rouge joue agression durable — il pénètre en territoire adverse et résiste à l'élimination. Pour contrer le Fighter, le Bleu doit coordonner 3 unités avec LOS, ce qui coûte un tour entier de repositionnement.

---

## Tableau récapitulatif

| Unité    | Équipe       | Capacité                                    | Rôle          |
|----------|--------------|---------------------------------------------|---------------|
| Trooper  | Les deux     | Mouvement 3 hexes                           | Flanker rapide |
| Gunner   | Les deux     | Capture à portée ≤ 3                        | Zone de suppression |
| Sniper   | Les deux     | Capture à portée ≤ 4, LOS ignore les forêts | Menace arrière |
| Leader   | Les deux     | Alliés adjacents +1 hex de mouvement        | Pivot de commandement |
| Medic    | Bleu only    | Immunise un allié adjacent 1x/tour          | Bouclier défensif |
| Fighter  | Rouge only   | Capturé seulement par 3 ennemis             | Avant-garde résistante |
