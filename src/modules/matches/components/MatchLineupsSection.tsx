import { useState } from 'react';
import { Box, Chip, Divider, Grid, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import type { LineupPlayer, MatchLineups, TeamLineup } from '../types/matchDetail.types';
import { PlayerShirtIcon } from './PlayerShirtIcon';
import { TeamFlag } from '../../../shared/components/TeamFlag';
import { resolveAwayJersey, resolveHomeJersey } from '../utils/jerseyColors';

// ── Formation helpers ─────────────────────────────────────────────────────────

function parseFormationRows(summary: string): number[] {
  return summary
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n) && n > 0);
}

// ESPN assigns formationPlace (1-11) from a fixed depth-order template that
// depends only on back-line size, not on the specific formation — e.g. place
// 8 is the deep pivot in a back-4 AND the deep pivot in a back-3, but place 7
// is a midfielder in 4-4-2 and an attacking-mid slot in 4-2-3-1. Verified
// empirically against real ESPN World Cup 2026 rosters (4-1-4-1, 4-3-3,
// 4-4-2, 3-4-2-1, 3-1-4-2, 5-3-2) by resolving each player's
// position.abbreviation. Row membership comes from slicing this chain by the
// formation's row sizes; lateral order within a row is formationPlace asc.
const BACK_LINE_PLACES: Record<number, number[]> = {
  3: [4, 5, 6],
  4: [2, 3, 5, 6],
  5: [2, 3, 4, 5, 6]
};

const MIDFIELD_FORWARD_CHAIN: Record<number, number[]> = {
  3: [8, 2, 3, 7, 11, 10, 9],
  4: [4, 8, 7, 11, 10, 9],
  5: [8, 7, 11, 10, 9]
};

// Maps an ESPN position abbreviation to a coarse line tier. Used only as the
// fallback when the formation isn't recognized — formationPlace is the
// primary source of truth (see groupByTacticalRows).
const POSITION_TIER: Record<string, number> = {
  G: 0,
  CD: 1,
  'CD-L': 1,
  'CD-R': 1,
  LB: 1,
  RB: 1,
  SW: 1,
  DM: 2,
  CM: 2,
  'CM-L': 2,
  'CM-R': 2,
  LM: 2,
  RM: 2,
  AM: 3,
  'AM-L': 3,
  'AM-R': 3,
  F: 4,
  'CF-L': 4,
  'CF-R': 4,
  LF: 4,
  RF: 4
};

function buildRow(byPlace: Map<number, LineupPlayer>, places: number[]): LineupPlayer[] {
  return [...places]
    .sort((a, b) => a - b)
    .filter((place) => byPlace.has(place))
    .map((place) => byPlace.get(place)!);
}

// Reconstructs tactical rows from formationPlace using the canonical chain.
// Returns null when the formation/back-line isn't recognized, or when the
// sanity check (every starter assigned exactly once) fails — callers should
// fall back to a less precise but always-stable grouping in that case.
function groupByTacticalRows(starters: LineupPlayer[], formationSummary: string | null): LineupPlayer[][] | null {
  if (!formationSummary) return null;

  const rowSizes = parseFormationRows(formationSummary);
  const backSize = rowSizes[0];
  const chain = MIDFIELD_FORWARD_CHAIN[backSize];
  const backPlaces = BACK_LINE_PLACES[backSize];
  if (!chain || !backPlaces) return null;

  const byPlace = new Map<number, LineupPlayer>();
  for (const p of starters) {
    if (p.formationPlace != null) byPlace.set(p.formationPlace, p);
  }

  const rows: LineupPlayer[][] = [];
  const gk = buildRow(byPlace, [1]);
  if (gk.length > 0) rows.push(gk);
  rows.push(buildRow(byPlace, backPlaces));

  let idx = 0;
  for (const size of rowSizes.slice(1)) {
    rows.push(buildRow(byPlace, chain.slice(idx, idx + size)));
    idx += size;
  }

  const assignedCount = rows.reduce((sum, row) => sum + row.length, 0);
  if (assignedCount !== starters.length) return null;

  return rows.filter((row) => row.length > 0);
}

// Stable fallback for formations not covered by the canonical chain table.
// Groups by a coarse tier inferred from position.abbreviation — here the
// position acts as the primary signal since formationPlace alone can't be
// trusted without a known formation template.
function fallbackGroupByPosition(starters: LineupPlayer[]): LineupPlayer[][] {
  const sorted = [...starters].sort((a, b) => (a.formationPlace ?? 99) - (b.formationPlace ?? 99));
  const tiers = new Map<number, LineupPlayer[]>();
  for (const p of sorted) {
    const abbr = p.position?.abbreviation ?? '';
    const tier = POSITION_TIER[abbr] ?? 2;
    const list = tiers.get(tier) ?? [];
    list.push(p);
    tiers.set(tier, list);
  }
  return [...tiers.keys()].sort((a, b) => a - b).map((t) => tiers.get(t)!);
}

function groupByRows(starters: LineupPlayer[], formationSummary: string | null): LineupPlayer[][] {
  return groupByTacticalRows(starters, formationSummary) ?? fallbackGroupByPosition(starters);
}

// ── Player shirt chip ─────────────────────────────────────────────────────────

function PlayerShirt({ player, color, trimColor }: { player: LineupPlayer; color: string; trimColor?: string }) {
  const name = player.shortName ?? player.name.split(' ').pop() ?? player.name;
  const wasSubbedOut = player.subbedOut.didSub;

  return (
    <Stack alignItems='center' spacing={0.3} sx={{ minWidth: 40, maxWidth: 58 }}>
      <Box sx={{ position: 'relative', flexShrink: 0, opacity: wasSubbedOut ? 0.45 : 1 }}>
        <PlayerShirtIcon number={player.jersey ?? '?'} primaryColor={color} trimColor={trimColor} size={34} />
        {wasSubbedOut && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -3,
              right: -3,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SwapHorizIcon sx={{ fontSize: 7, color: '#fff' }} />
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: '0.56rem',
          fontWeight: 600,
          color: wasSubbedOut ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)',
          lineHeight: 1.2,
          textAlign: 'center',
          maxWidth: 56,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {name}
      </Typography>
    </Stack>
  );
}

// ── Pitch view ────────────────────────────────────────────────────────────────

function TeamPitch({ lineup, color, trimColor }: { lineup: TeamLineup; color: string; trimColor?: string }) {
  const rows = groupByRows(lineup.starters, lineup.formation?.summary ?? null);
  // GK at bottom → reverse so GK row is last rendered (bottom of pitch)
  const displayRows = [...rows].reverse();

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '300 / 230',
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.45)'
      }}
    >
      {/* Turf + pitch geometry — flat, no tilt (keeps the rounded corners clean) */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            #11301f 0px, #11301f 34px,
            #0d2818 34px, #0d2818 68px
          )`
        }}
      >
        {/* Only the defending half is shown: halfway line + partial center
            circle at top, own penalty area + goal at bottom. */}
        <svg
          viewBox='0 0 300 230'
          preserveAspectRatio='none'
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <g fill='none' stroke='rgba(255,255,255,0.4)' strokeWidth={1.6}>
            {/* Perimeter (top edge doubles as the halfway line) */}
            <rect x={10} y={10} width={280} height={210} stroke='rgba(255,255,255,0.55)' />
            {/* Center circle (only the half below the halfway line, bulging down into the field) + kickoff spot */}
            <path d='M 105 10 A 45 45 0 0 0 195 10' />
            <circle cx={150} cy={10} r={2.2} fill='rgba(255,255,255,0.55)' stroke='none' />
            {/* Own penalty area + six-yard box */}
            <rect x={70} y={150} width={160} height={70} />
            <rect x={110} y={192} width={80} height={28} />
            {/* D-arc bulges up, away from goal, out into the field */}
            <path d='M 107.94 150 A 45 45 0 0 1 192.06 150' />
            <circle cx={150} cy={166} r={2.2} fill='rgba(255,255,255,0.55)' stroke='none' />
            {/* Goal mouth */}
            <rect x={128} y={218} width={44} height={2} fill='rgba(255,255,255,0.12)' stroke='rgba(255,255,255,0.5)' />
          </g>
        </svg>
      </Box>

      {/* Players */}
      <Stack justifyContent='space-evenly' sx={{ position: 'absolute', inset: 0, zIndex: 1, py: 2, px: 1 }}>
        {displayRows.map((row, i) => (
          <Stack key={i} direction='row' justifyContent='space-evenly' alignItems='center'>
            {row.map((player) => (
              <PlayerShirt
                key={player.playerId || player.jersey || String(player.formationPlace)}
                player={player}
                color={color}
                trimColor={trimColor}
              />
            ))}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

// ── Bench section ─────────────────────────────────────────────────────────────

function BenchSection({ players }: { players: LineupPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <Stack spacing={0.75}>
      <Typography
        variant='caption'
        fontWeight={700}
        color='text.secondary'
        sx={{ letterSpacing: 0.6, textTransform: 'uppercase', fontSize: '0.63rem' }}
      >
        Suplentes
      </Typography>
      <Stack divider={<Divider sx={{ opacity: 0.35 }} />}>
        {players.map((p) => (
          <Stack key={p.playerId || p.jersey} direction='row' alignItems='center' spacing={1.5} sx={{ py: 0.65 }}>
            <Typography
              sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.disabled', minWidth: 20, textAlign: 'right' }}
            >
              {p.jersey ?? '–'}
            </Typography>
            <Typography
              variant='caption'
              sx={{
                flex: 1,
                color: p.subbedIn.didSub ? 'text.primary' : 'text.secondary',
                fontWeight: p.subbedIn.didSub ? 700 : 400
              }}
            >
              {p.name}
            </Typography>
            {p.subbedIn.didSub && (
              <Chip
                icon={<SwapHorizIcon sx={{ fontSize: 10 }} />}
                label={p.subbedIn.minute ?? 'Entró'}
                size='small'
                sx={{
                  height: 16,
                  fontSize: '0.6rem',
                  bgcolor: 'success.dark',
                  color: '#fff',
                  flexShrink: 0,
                  '& .MuiChip-icon': { color: '#fff', ml: 0.5 }
                }}
              />
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ── Team switcher ─────────────────────────────────────────────────────────────

function TeamSwitcher({
  homeCode,
  awayCode,
  homeName,
  awayName,
  homeFormation,
  awayFormation,
  selected,
  onSelect
}: {
  homeCode: string;
  awayCode: string;
  homeName: string;
  awayName: string;
  homeFormation: string | null;
  awayFormation: string | null;
  selected: 'home' | 'away';
  onSelect: (t: 'home' | 'away') => void;
}) {
  const theme = useTheme();

  return (
    <Stack direction='row' spacing={1}>
      {(['home', 'away'] as const).map((side) => {
        const code = side === 'home' ? homeCode : awayCode;
        const name = side === 'home' ? homeName : awayName;
        const formation = side === 'home' ? homeFormation : awayFormation;
        const active = selected === side;
        return (
          <Box
            key={side}
            component='button'
            onClick={() => onSelect(side)}
            sx={{
              flex: 1,
              minWidth: 0,
              border: '1px solid',
              borderColor: active ? 'primary.main' : 'divider',
              borderRadius: 2,
              bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              boxShadow: active ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
              cursor: 'pointer',
              py: 0.85,
              px: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textAlign: 'left',
              transition: 'all 0.18s ease',
              '&:hover': { borderColor: active ? 'primary.main' : 'text.secondary' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
            }}
          >
            <TeamFlag teamCode={code} teamName={name} size={20} />
            <Typography
              noWrap
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.76rem',
                fontWeight: 700,
                color: active ? 'text.primary' : 'text.secondary'
              }}
            >
              {name || (side === 'home' ? 'Local' : 'Visitante')}
            </Typography>
            {formation && (
              <Typography
                sx={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: active ? 'primary.main' : 'text.disabled',
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {formation}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function MatchLineupsSection({
  lineups,
  homeCode,
  awayCode,
  homeName,
  awayName,
  homeColor,
  awayColor,
  homeAlternateColor,
  awayAlternateColor
}: {
  lineups: MatchLineups;
  homeCode: string;
  awayCode: string;
  homeName: string;
  awayName: string;
  homeColor?: string | null;
  awayColor?: string | null;
  homeAlternateColor?: string | null;
  awayAlternateColor?: string | null;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState<'home' | 'away'>('home');

  if (!lineups.available || !lineups.home || !lineups.away) {
    return (
      <Stack alignItems='center' spacing={1} sx={{ py: 4 }}>
        <SportsSoccerIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.4 }} />
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          Las alineaciones no están disponibles en este momento.
        </Typography>
      </Stack>
    );
  }

  const { home, away } = lineups;
  const activeLineup = selected === 'home' ? home : away;

  const homeJersey = resolveHomeJersey(homeColor, homeAlternateColor);
  const awayJersey = resolveAwayJersey(awayColor, awayAlternateColor);
  const activeJersey = selected === 'home' ? homeJersey : awayJersey;
  const activeColor =
    activeJersey?.primary ?? (selected === 'home' ? theme.palette.primary.main : theme.palette.secondary.main);
  const activeTrimColor = activeJersey?.trim;

  return (
    <Grid container spacing={2} alignItems='flex-start'>
      {/* Bloque izquierdo: selector + cancha, mismo ancho para que queden alineados */}
      <Grid size={{ xs: 12, sm: 8 }}>
        <Stack spacing={1.5} sx={{ width: '100%', maxWidth: { xs: '100%', sm: 480, md: 560, lg: 600 }, mx: 'auto' }}>
          <TeamSwitcher
            homeCode={homeCode}
            awayCode={awayCode}
            homeName={homeName}
            awayName={awayName}
            homeFormation={home.formation?.summary ?? null}
            awayFormation={away.formation?.summary ?? null}
            selected={selected}
            onSelect={setSelected}
          />
          <TeamPitch lineup={activeLineup} color={activeColor} trimColor={activeTrimColor} />
        </Stack>
      </Grid>

      {/* Bloque derecho: suplentes */}
      <Grid size={{ xs: 12, sm: 4 }}>
        <BenchSection players={activeLineup.bench} />
      </Grid>
    </Grid>
  );
}
