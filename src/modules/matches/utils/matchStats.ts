import type { MatchStatItem } from '../types/matchDetail.types';

// Spanish labels for ESPN's stable stat keys. Falls back to ESPN's own
// (English) label for any stat name not listed here — never invents data,
// only translates the label of stats that genuinely exist in the payload.
const STAT_LABELS_ES: Record<string, string> = {
  possessionPct: 'Posesión',
  totalShots: 'Remates',
  shotsOnTarget: 'Remates a puerta',
  shotPct: 'Precisión de remate',
  blockedShots: 'Remates bloqueados',
  penaltyKickShots: 'Penales ejecutados',
  penaltyKickGoals: 'Penales convertidos',
  totalPasses: 'Pases',
  accuratePasses: 'Pases completos',
  passPct: 'Precisión de pase',
  totalCrosses: 'Centros',
  accurateCrosses: 'Centros completos',
  crossPct: 'Precisión de centros',
  totalLongBalls: 'Balones largos',
  accurateLongBalls: 'Balones largos completos',
  longballPct: 'Precisión de balón largo',
  totalTackles: 'Entradas',
  effectiveTackles: 'Entradas exitosas',
  tacklePct: 'Precisión de entradas',
  interceptions: 'Intercepciones',
  totalClearance: 'Despejes',
  effectiveClearance: 'Despejes exitosos',
  foulsCommitted: 'Faltas cometidas',
  yellowCards: 'Tarjetas amarillas',
  redCards: 'Tarjetas rojas',
  offsides: 'Fuera de juego',
  wonCorners: 'Córners',
  saves: 'Atajadas'
};

export function statLabel(item: MatchStatItem): string {
  return STAT_LABELS_ES[item.name] ?? item.label;
}

export function findStat(items: MatchStatItem[], name: string): MatchStatItem | undefined {
  return items.find((i) => i.name === name);
}

// Curated subset for the compact "Resumen" comparison — only stats that map
// directly to a real ESPN field, nothing approximated or invented.
export const SUMMARY_STAT_NAMES = ['possessionPct', 'shotsOnTarget', 'accuratePasses', 'saves', 'foulsCommitted'];

// Full breakdown for "Ver estadísticas completas". A group is skipped
// entirely if none of its stats are present for both teams.
export const FULL_STAT_GROUPS: { title: string; names: string[] }[] = [
  { title: 'General', names: ['possessionPct', 'wonCorners', 'saves'] },
  {
    title: 'Tiros',
    names: ['totalShots', 'shotsOnTarget', 'shotPct', 'blockedShots', 'penaltyKickShots', 'penaltyKickGoals']
  },
  {
    title: 'Pases',
    names: [
      'totalPasses',
      'accuratePasses',
      'passPct',
      'totalCrosses',
      'accurateCrosses',
      'crossPct',
      'totalLongBalls',
      'accurateLongBalls',
      'longballPct'
    ]
  },
  {
    title: 'Defensa',
    names: ['totalTackles', 'effectiveTackles', 'tacklePct', 'interceptions', 'totalClearance', 'effectiveClearance']
  },
  { title: 'Disciplina', names: ['foulsCommitted', 'yellowCards', 'redCards', 'offsides'] }
];
