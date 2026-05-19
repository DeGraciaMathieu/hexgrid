// Retourne false si l'arc A→B laisse une unité ennemie à l'intérieur du territoire.
// "Intérieur" signifie côté zone de départ : E.cy > frontierCy (isTop=false) ou E.cy < frontierCy (isTop=true).
function isSegmentValid(A, B, enemyUnits, isTop) {
  for (const E of enemyUnits) {
    if (E.cx <= A.cx || E.cx >= B.cx) continue
    const t = (E.cx - A.cx) / (B.cx - A.cx)
    const frontierCy = A.cy + t * (B.cy - A.cy)
    if (isTop ? E.cy < frontierCy : E.cy > frontierCy) return false
  }
  return true
}

// Calcule les points de la ligne de frontière :
// - sans ennemis : enveloppe convexe (hull) qui maximise le territoire
// - avec ennemis : chemin DP qui maximise le territoire tout en excluant les unités ennemies
//
// points     : tableau de {cx, cy} triés par cx croissant.
// isTop      : true si le joueur part du haut (avance vers le bas, cy max).
//              false si le joueur part du bas (avance vers le haut, cy min).
// enemyUnits : tableau de {cx, cy} des unités adverses.
//
// Retourne le sous-ensemble ordonné de points formant la ligne de frontière.
export function computeFrontierPoints(points, isTop, enemyUnits = []) {
  if (points.length <= 1) return [...points]

  const units = [...points].sort((a, b) => a.cx - b.cx)
  const n = units.length

  // DP : score = somme des aires trapézoïdales sous le chemin.
  // isTop=false → minimiser (cy bas = plus avancé = plus de territoire derrière)
  // isTop=true  → maximiser (cy haut = plus avancé = plus de territoire derrière)
  const INF = Infinity
  const dp = units.map(() => ({ score: isTop ? -INF : INF, prev: -1, reachable: false }))
  dp[0] = { score: 0, prev: -1, reachable: true }

  for (let j = 1; j < n; j++) {
    for (let i = 0; i < j; i++) {
      if (!dp[i].reachable) continue
      if (!isSegmentValid(units[i], units[j], enemyUnits, isTop)) continue

      const segArea = (units[j].cx - units[i].cx) * (units[i].cy + units[j].cy) / 2
      const newScore = dp[i].score + segArea
      const isBetter = isTop ? newScore > dp[j].score : newScore < dp[j].score

      if (isBetter) {
        dp[j] = { score: newScore, prev: i, reachable: true }
      }
    }
  }

  // Pas de chemin valide → territoire perdu, on retourne les extrémités
  if (!dp[n - 1].reachable) return [units[0], units[n - 1]]

  const path = []
  let cur = n - 1
  while (cur !== -1) {
    path.unshift(units[cur])
    cur = dp[cur].prev
  }
  return path
}

// Détecte si des unités ennemies se trouvent dans les zones d'extension latérales du territoire :
// à gauche du premier point de frontière ou à droite du dernier.
// Le tracé ne peut pas les contourner (aucun allié dans ces zones) — le polygone de territoire
// ne doit pas s'étendre de ce côté.
//
// Retourne { leftBlocked, rightBlocked }.
export function checkExtensions(frontierPts, isTop, enemyUnits = []) {
  if (frontierPts.length === 0) return { leftBlocked: false, rightBlocked: false }

  const first = frontierPts[0]
  const last  = frontierPts[frontierPts.length - 1]

  const leftBlocked = enemyUnits.some(E =>
    E.cx < first.cx && (isTop ? E.cy < first.cy : E.cy > first.cy)
  )
  const rightBlocked = enemyUnits.some(E =>
    E.cx > last.cx && (isTop ? E.cy < last.cy : E.cy > last.cy)
  )

  return { leftBlocked, rightBlocked }
}
