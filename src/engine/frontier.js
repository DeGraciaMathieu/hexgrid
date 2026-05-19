// Produit vectoriel 2D pour trois points {cx, cy}.
// Positif → tournant gauche (anti-horaire en coords écran où y descend → horaire en math).
function cross(O, A, B) {
  return (A.cx - O.cx) * (B.cy - O.cy) - (A.cy - O.cy) * (B.cx - O.cx)
}

// Calcule les points de la ligne de frontière (enveloppe supérieure côté adversaire).
// points  : tableau de {cx, cy} triés par cx croissant.
// isTop   : true si le joueur part du haut (avance vers le bas, cy max).
//           false si le joueur part du bas (avance vers le haut, cy min).
// Retourne le sous-ensemble de points formant la ligne brisée frontière.
export function computeFrontierPoints(points, isTop) {
  const hull = []
  for (const p of points) {
    while (hull.length >= 2) {
      const c = cross(hull[hull.length - 2], hull[hull.length - 1], p)
      // isTop  → upper hull (max cy) : retire si tournant gauche ou colinéaire (c >= 0)
      // !isTop → lower hull (min cy) : retire si tournant droite ou colinéaire (c <= 0)
      if (isTop ? c >= 0 : c <= 0) hull.pop()
      else break
    }
    hull.push(p)
  }
  return hull
}
