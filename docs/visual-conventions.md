# Conventions visuelles

À lire avant d'implémenter ou de modifier quoi que ce soit de visuel.

---

## Palette de couleurs

Toutes les couleurs passent par des variables CSS définies dans `src/index.css`. Ne jamais hardcoder une couleur qui a un équivalent en variable.

| Variable            | Valeur      | Usage                              |
|---------------------|-------------|------------------------------------|
| `--bg`              | `#0d1117`   | Fond principal de la page          |
| `--bg-2`            | `#161b22`   | Fond des panneaux/cartes           |
| `--line`            | `#30363d`   | Bordures, séparateurs, grille hex  |
| `--line-bright`     | `#58a6ff`   | Bordure hover, surbrillance bleue  |
| `--text`            | `#c9d1d9`   | Texte principal                    |
| `--text-dim`        | `#6e7681`   | Labels secondaires, coordonnées    |
| `--accent`          | `#ff7b00`   | Orange d'accentuation (objectifs, tag header) |

### Couleurs joueurs

| Joueur   | Couleur     |
|----------|-------------|
| Joueur 1 | `#58a6ff`   |
| Joueur 2 | `#ff5a4a`   |

---

## Terrain

Les couleurs de terrain sont des variables CSS. Les icônes sont des caractères Unicode affichés en SVG.

| Type        | Variable CSS            | Icône | Lettre carte |
|-------------|-------------------------|-------|--------------|
| `open`      | `--terrain-open`        | —     | `o`          |
| `forest`    | `--terrain-forest`      | `♣`   | `f`          |
| `water`     | `--terrain-water`       | `~`   | `w`          |
| `mountain`  | `--terrain-mountain`    | `▲`   | `m`          |
| `urban`     | `--terrain-urban`       | `▢`   | `u`          |
| `objective` | `--terrain-objective`   | `✶`   | `X`          |

Les icônes de terrain sont affichées à `opacity: 0.45` sauf pour `objective` qui utilise `var(--accent)` à pleine opacité.

---

## Grille hexagonale

- **Orientation** : flat-top (sommet en haut, côtés plats à gauche et à droite)
- **`HEX_SIZE`** : `32` — rayon du centre au coin
- **Décalage** : les colonnes impaires sont décalées de `VSPACE / 2` vers le bas
- **Padding** : `20px` autour de la grille SVG

Formules de positionnement :
```js
const W = 2 * HEX_SIZE
const H = Math.sqrt(3) * HEX_SIZE
const HSPACE = 1.5 * HEX_SIZE   // pas horizontal entre centres
const VSPACE = H                 // pas vertical entre centres

cx = PADDING + HEX_SIZE + col * HSPACE
cy = PADDING + H / 2 + row * VSPACE + (col % 2 === 1 ? VSPACE / 2 : 0)
```

Les polygones sont tracés avec `HEX_SIZE - 1.5` (léger retrait pour laisser voir les bordures).

### Labels de coordonnées

Format hexadécimal sur 1 caractère par axe : `col (hex) + row (hex)` → ex. `A3`, `0F`.  
Affichés en bas de chaque hexagone, police `JetBrains Mono` 8px, couleur `--text-dim`.

---

## Unités

- **Forme** : cercle, rayon `HEX_SIZE * 0.65`
- **Remplissage** : couleur du joueur
- **Bordure** : `#ffffff`, épaisseur 1.5
- **Glow** : `drop-shadow(0 0 8px <couleur>) drop-shadow(0 0 2px <couleur>)`
- **Code** : lettre unique centrée, `JetBrains Mono` 16px gras, blanc avec stroke noir à 0.5px

---

## Lignes de formation

Polyline reliant toutes les unités d'un squad triées par colonne.

- Stroke : couleur du joueur, épaisseur 1.8, opacity 0.55
- Glow : `drop-shadow(0 0 4px <couleur>)`
- `strokeLinecap: round`, `strokeLinejoin: round`

---

## Trails de mouvement

Affiché entre la position d'origine (`from`) et la position actuelle d'une unité.

- Ligne en tirets animée : `stroke-dasharray: 5 4`, animation `trail-flow` 0.8s infinie
- Stroke : couleur du joueur, épaisseur 2.5, opacity 0.7
- Marqueur fantôme à l'origine : cercle `stroke-dasharray: 2 2`, opacity 0.45, rayon `HEX_SIZE * 0.35`

---

## Zones d'influence

Polygone SVG couvrant la zone entre la ligne de formation et le bord du plateau côté déploiement.

- Remplissage : `<pattern>` SVG avec hachures diagonales à 45°
- Fond du pattern : couleur joueur opacity 0.05
- Stripe du pattern : couleur joueur, épaisseur 1.5, opacity 0.35

---

## Typographie

| Rôle                     | Police                | Taille          |
|--------------------------|-----------------------|-----------------|
| Titre principal          | Major Mono Display    | `clamp(28px, 5vw, 44px)` |
| Corps / UI               | JetBrains Mono        | 12–13px         |
| Labels terrain / coords  | JetBrains Mono        | 8px             |
| Code unité (SVG)         | JetBrains Mono        | 16px bold       |
| Tags uppercase           | JetBrains Mono        | 11px, `letter-spacing: 0.3em` |

---

## Fond de page

Deux gradients radiaux superposés sur `--bg`, plus une grille de points CSS fixée en `position: fixed` via `body::before` (lignes `rgba(48,54,61,0.15)`, taille 24×24px).
