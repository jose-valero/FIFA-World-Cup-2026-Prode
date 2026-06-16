import { useState } from 'react';
import { Box, Chip, Divider, Grid, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import type { LineupPlayer, MatchLineups, TeamLineup } from '../types/matchDetail.types';
import { PlayerShirtIcon } from './PlayerShirtIcon';
import { TeamFlag } from '../../../shared/components/TeamFlag';

// ── Formation helpers ─────────────────────────────────────────────────────────

function parseFormationRows(summary: string): number[] {
  return summary
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n) && n > 0);
}

function groupByRows(starters: LineupPlayer[], formationSummary: string | null): LineupPlayer[][] {
  const sorted = [...starters].sort((a, b) => (a.formationPlace ?? 99) - (b.formationPlace ?? 99));
  if (!formationSummary) return [sorted];

  const rows = parseFormationRows(formationSummary);
  const gk = sorted.filter((p) => (p.formationPlace ?? 0) === 1);
  const outfield = sorted.filter((p) => (p.formationPlace ?? 0) > 1);

  const result: LineupPlayer[][] = [];
  if (gk.length > 0) result.push(gk);

  let idx = 0;
  for (const count of rows) {
    result.push(outfield.slice(idx, idx + count));
    idx += count;
  }

  return result.filter((r) => r.length > 0);
}

// ── Player shirt chip ─────────────────────────────────────────────────────────

function PlayerShirt({
  player,
  color,
  trimColor
}: {
  player: LineupPlayer;
  color: string;
  trimColor?: string;
}) {
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

function TeamPitch({
  lineup,
  color,
  trimColor
}: {
  lineup: TeamLineup;
  color: string;
  trimColor?: string;
}) {
  const rows = groupByRows(lineup.starters, lineup.formation?.summary ?? null);
  // GK at bottom → reverse so GK row is last rendered (bottom of pitch)
  const displayRows = [...rows].reverse();

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: `repeating-linear-gradient(
          0deg,
          #1d4d1d 0px, #1d4d1d 34px,
          #194419 34px, #194419 68px
        )`,
        py: 3,
        px: 1.5,
        minHeight: 380
      }}
    >
      {/* Pitch markings */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Goal top */}
        <Box
          sx={{
            position: 'absolute',
            left: '35%',
            right: '35%',
            top: 0,
            height: 14,
            border: '1.5px solid rgba(255,255,255,0.25)',
            borderTop: 'none',
            bgcolor: 'rgba(255,255,255,0.04)'
          }}
        />
        {/* Penalty area top */}
        <Box
          sx={{
            position: 'absolute',
            left: '18%',
            right: '18%',
            top: 0,
            height: '15%',
            border: '1.5px solid rgba(255,255,255,0.14)',
            borderTop: 'none'
          }}
        />
        {/* Center line */}
        <Box
          sx={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: '50%',
            height: '1px',
            bgcolor: 'rgba(255,255,255,0.18)'
          }}
        />
        {/* Center circle */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 68,
            height: 68,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.15)',
            transform: 'translate(-50%,-50%)'
          }}
        />
        {/* Penalty area bottom */}
        <Box
          sx={{
            position: 'absolute',
            left: '18%',
            right: '18%',
            bottom: 0,
            height: '15%',
            border: '1.5px solid rgba(255,255,255,0.14)',
            borderBottom: 'none'
          }}
        />
        {/* Goal bottom */}
        <Box
          sx={{
            position: 'absolute',
            left: '35%',
            right: '35%',
            bottom: 0,
            height: 14,
            border: '1.5px solid rgba(255,255,255,0.25)',
            borderBottom: 'none',
            bgcolor: 'rgba(255,255,255,0.04)'
          }}
        />
      </Box>

      {/* Players */}
      <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
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
  const activeColor =
    selected === 'home'
      ? homeColor || theme.palette.primary.main
      : awayColor || theme.palette.secondary.main;
  const activeTrimColor =
    (selected === 'home' ? homeAlternateColor : awayAlternateColor) || undefined;

  return (
    <Grid container spacing={2} alignItems='flex-start'>
      {/* Bloque izquierdo: selector + cancha */}
      <Grid size={{ xs: 12, sm: 8 }}>
        <Stack spacing={1.5}>
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
