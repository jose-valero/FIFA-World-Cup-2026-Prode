import type { Match } from '../../matches/types/types';

/**
 * FIFA World Cup 2026 — Group Stage Tiebreaker
 *
 * Official criteria (source: FIFA WC regulations, consistent with 2022 edition):
 *   (a) Points in all group matches
 *   (b) Goal difference in all group matches           ← IMPLEMENTADO
 *   (c) Goals scored in all group matches              ← IMPLEMENTADO
 *   (d) Points in head-to-head matches                 ← IMPLEMENTADO
 *   (e) Goal difference in head-to-head matches        ← IMPLEMENTADO
 *   (f) Goals scored in head-to-head matches           ← IMPLEMENTADO
 *   (g) Wins in all group matches                      ← IMPLEMENTADO
 *   (h) Disciplinary points (yellow/red cards)         ← NO IMPLEMENTADO (sin datos)
 *   (i) Team conduct score (FIFA ranking pre-torneo)   ← NO IMPLEMENTADO (sin datos)
 *   (j) Drawing of lots
 *
 * FALLBACK TÉCNICO (reemplaza h, i, j):
 *   Orden alfabético por código de equipo.
 *   Es determinista y estable para el renderizado, pero NO es criterio oficial FIFA.
 *   Si en el futuro se agregan datos disciplinarios o conduct score, deben insertarse
 *   antes de este fallback.
 *
 * LIMITACIÓN CONOCIDA:
 *   Empate circular en H2H entre 3+ equipos (A>B, B>C, C>A, etc.) con todas las demás
 *   métricas iguales cae directamente al fallback técnico. En la práctica FIFA resolvería
 *   esto con criterios h/i/j que hoy no están disponibles.
 */

export type SortableStandingRow = {
  /** Clave única dentro del grupo, usada para identificar H2H. Valor: teamCode ?? teamName */
  sortKey: string;
  teamCode: string | null;
  teamName: string;
  points: number;
  wins: number;
  goalsFor: number;
  goalDifference: number;
};

/**
 * Ordena filas de una misma tabla de grupo según el reglamento FIFA WC 2026.
 * Requiere los partidos del grupo para calcular H2H.
 *
 * @param rows       Filas del grupo a ordenar (solo un grupo a la vez)
 * @param groupMatches Partidos de ese grupo (se filtra internamente por scores disponibles)
 */
export function sortGroupRows<T extends SortableStandingRow>(rows: T[], groupMatches: Match[]): T[] {
  // Paso 1: orden por criterios globales (a→c) para identificar grupos empatados
  const primarySorted = [...rows].sort(primaryComparator);

  // Paso 2: dentro de cada grupo empatado en (pts, GD, GF), aplicar H2H + wins + fallback
  const result: T[] = [];
  let i = 0;

  while (i < primarySorted.length) {
    let j = i + 1;

    while (
      j < primarySorted.length &&
      primarySorted[i].points === primarySorted[j].points &&
      primarySorted[i].goalDifference === primarySorted[j].goalDifference &&
      primarySorted[i].goalsFor === primarySorted[j].goalsFor
    ) {
      j++;
    }

    const tiedSlice = primarySorted.slice(i, j);

    if (tiedSlice.length > 1) {
      result.push(...resolveH2HThenFallback(tiedSlice, groupMatches));
    } else {
      result.push(...tiedSlice);
    }

    i = j;
  }

  return result;
}

/**
 * Ordenamiento entre 3eros de distintos grupos (para clasificados de mejor 3ero).
 * H2H no aplica en comparaciones entre grupos: usa solo criterios globales + fallback.
 */
export function sortCrossGroupRows<T extends SortableStandingRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.wins !== a.wins) return b.wins - a.wins;
    // FALLBACK TÉCNICO — ver nota en cabecera del archivo
    return fallbackComparator(a, b);
  });
}

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Comparador por criterios globales sin H2H (a, b, c del reglamento) */
function primaryComparator<T extends SortableStandingRow>(a: T, b: T): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return 0;
}

/** Fallback técnico determinista — no es criterio FIFA */
function fallbackComparator<T extends SortableStandingRow>(a: T, b: T): number {
  return (a.teamCode ?? a.teamName).localeCompare(b.teamCode ?? b.teamName);
}

type H2HStats = { points: number; goalDifference: number; goalsFor: number };

function resolveH2HThenFallback<T extends SortableStandingRow>(rows: T[], groupMatches: Match[]): T[] {
  const keys = new Set(rows.map((r) => r.sortKey));

  // Partidos H2H: ambos equipos dentro del subconjunto empatado, con resultado disponible
  const h2hMatches = groupMatches.filter(
    (m) =>
      m.officialHomeScore !== null &&
      m.officialAwayScore !== null &&
      keys.has(m.homeTeamCode ?? m.homeTeam) &&
      keys.has(m.awayTeamCode ?? m.awayTeam)
  );

  // Mini-tabla H2H
  const stats = new Map<string, H2HStats>();
  for (const row of rows) {
    stats.set(row.sortKey, { points: 0, goalDifference: 0, goalsFor: 0 });
  }

  for (const m of h2hMatches) {
    const homeKey = m.homeTeamCode ?? m.homeTeam;
    const awayKey = m.awayTeamCode ?? m.awayTeam;
    const hg = m.officialHomeScore!;
    const ag = m.officialAwayScore!;

    const home = stats.get(homeKey);
    const away = stats.get(awayKey);

    if (!home || !away) continue;

    home.goalsFor += hg;
    home.goalDifference += hg - ag;
    away.goalsFor += ag;
    away.goalDifference += ag - hg;

    if (hg > ag) {
      home.points += 3;
    } else if (hg < ag) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  return [...rows].sort((a, b) => {
    const ah = stats.get(a.sortKey)!;
    const bh = stats.get(b.sortKey)!;

    // (d) H2H points
    if (bh.points !== ah.points) return bh.points - ah.points;
    // (e) H2H GD
    if (bh.goalDifference !== ah.goalDifference) return bh.goalDifference - ah.goalDifference;
    // (f) H2H GF
    if (bh.goalsFor !== ah.goalsFor) return bh.goalsFor - ah.goalsFor;
    // (g) Wins overall
    if (b.wins !== a.wins) return b.wins - a.wins;
    // FALLBACK TÉCNICO — ver nota en cabecera del archivo
    return fallbackComparator(a, b);
  });
}
