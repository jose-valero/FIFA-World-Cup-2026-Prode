import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import type { LineupPlayer, MatchLineups, TeamLineup } from '../types/matchDetail.types';

// ── Pitch layout helpers ──────────────────────────────────────────────────────

function parseFormationRows(summary: string): number[] {
  return summary.split('-').map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0);
}

function groupStartersByRow(starters: LineupPlayer[], formationSummary: string | null): LineupPlayer[][] {
  const sorted = [...starters].sort((a, b) => (a.formationPlace ?? 99) - (b.formationPlace ?? 99));

  if (!formationSummary) {
    return [sorted];
  }

  const rows = parseFormationRows(formationSummary);
  // GK is always formationPlace=1, outfield follow
  const gkList = sorted.filter((p) => (p.formationPlace ?? 0) === 1);
  const outfield = sorted.filter((p) => (p.formationPlace ?? 0) > 1);

  const result: LineupPlayer[][] = [];
  if (gkList.length > 0) result.push(gkList);

  let idx = 0;
  for (const count of rows) {
    result.push(outfield.slice(idx, idx + count));
    idx += count;
  }

  return result.filter((r) => r.length > 0);
}

// ── Player chip on the pitch ──────────────────────────────────────────────────

function PitchPlayerChip({ player }: { player: LineupPlayer }) {
  const displayName = player.shortName ?? player.name.split(' ').pop() ?? player.name;
  const wasSubbedOut = player.subbedOut.didSub;

  return (
    <Stack alignItems='center' spacing={0.25} sx={{ minWidth: 44, maxWidth: 56 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: wasSubbedOut ? 'action.disabledBackground' : 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <Typography
          sx={{
            fontSize: '0.65rem',
            fontWeight: 800,
            color: wasSubbedOut ? 'text.disabled' : 'primary.contrastText',
            lineHeight: 1
          }}
        >
          {player.jersey ?? '?'}
        </Typography>
        {wasSubbedOut && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SwapHorizIcon sx={{ fontSize: 7, color: 'warning.contrastText' }} />
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: '0.58rem',
          fontWeight: 600,
          color: wasSubbedOut ? 'text.disabled' : 'text.primary',
          lineHeight: 1.2,
          textAlign: 'center',
          maxWidth: 54,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {displayName}
      </Typography>
    </Stack>
  );
}

// ── Pitch visual ──────────────────────────────────────────────────────────────

function TeamRows({ rows, reversed }: { rows: LineupPlayer[][]; reversed: boolean }) {
  const displayRows = reversed ? [...rows].reverse() : rows;
  return (
    <Stack spacing={0.75}>
      {displayRows.map((row, i) => (
        <Stack key={i} direction='row' justifyContent='space-evenly' alignItems='center'>
          {row.map((player) => (
            <PitchPlayerChip key={player.playerId || player.jersey || String(player.formationPlace)} player={player} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function FootballPitch({
  homeLineup,
  awayLineup
}: {
  homeLineup: TeamLineup;
  awayLineup: TeamLineup;
}) {
  const homeRows = groupStartersByRow(homeLineup.starters, homeLineup.formation?.summary ?? null);
  const awayRows = groupStartersByRow(awayLineup.starters, awayLineup.formation?.summary ?? null);

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: '#1a3a1a',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        py: 2,
        px: 1
      }}
    >
      {/* Pitch markings */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Center line */}
        <Box
          sx={{
            position: 'absolute',
            left: '5%',
            right: '5%',
            top: '50%',
            height: 1,
            bgcolor: 'rgba(255,255,255,0.15)'
          }}
        />
        {/* Center circle */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            transform: 'translate(-50%,-50%)'
          }}
        />
        {/* Away penalty area */}
        <Box
          sx={{
            position: 'absolute',
            left: '25%',
            right: '25%',
            top: 0,
            height: '15%',
            border: '1px solid rgba(255,255,255,0.10)',
            borderTop: 'none'
          }}
        />
        {/* Home penalty area */}
        <Box
          sx={{
            position: 'absolute',
            left: '25%',
            right: '25%',
            bottom: 0,
            height: '15%',
            border: '1px solid rgba(255,255,255,0.10)',
            borderBottom: 'none'
          }}
        />
      </Box>

      <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
        {/* Away team — rows shown reversed (their GK at top) */}
        <TeamRows rows={awayRows} reversed />

        <Box sx={{ height: 8 }} />

        {/* Home team — rows shown normal (their GK at bottom) */}
        <TeamRows rows={homeRows} reversed={false} />
      </Stack>
    </Box>
  );
}

// ── Bench list ────────────────────────────────────────────────────────────────

function BenchList({ players, label }: { players: LineupPlayer[]; label: string }) {
  if (players.length === 0) return null;
  return (
    <Stack spacing={0.5}>
      <Typography variant='caption' fontWeight={700} color='text.secondary' sx={{ letterSpacing: 0.5 }}>
        {label} — Suplentes
      </Typography>
      <Stack spacing={0.25}>
        {players.map((p) => (
          <Stack
            key={p.playerId || p.jersey}
            direction='row'
            alignItems='center'
            spacing={1}
            sx={{ py: 0.25 }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'text.disabled',
                minWidth: 20,
                textAlign: 'right'
              }}
            >
              {p.jersey ?? '–'}
            </Typography>
            <Typography
              variant='caption'
              sx={{ flex: 1, color: p.subbedIn.didSub ? 'text.primary' : 'text.secondary', fontWeight: p.subbedIn.didSub ? 700 : 400 }}
            >
              {p.name}
            </Typography>
            {p.subbedIn.didSub && (
              <Chip
                icon={<SwapHorizIcon sx={{ fontSize: 10 }} />}
                label={p.subbedIn.minute ?? 'Entró'}
                size='small'
                sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'success.dark', color: '#fff', '& .MuiChip-icon': { color: '#fff', ml: 0.5 } }}
              />
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

// ── Formation header ──────────────────────────────────────────────────────────

function FormationHeader({
  homeCode,
  awayCode,
  homeFormation,
  awayFormation
}: {
  homeCode: string;
  awayCode: string;
  homeFormation: string | null;
  awayFormation: string | null;
}) {
  return (
    <Stack direction='row' alignItems='center' justifyContent='space-between'>
      <Stack alignItems='flex-start'>
        <Typography variant='caption' color='text.disabled' fontWeight={600}>
          {homeCode || 'Local'}
        </Typography>
        <Typography variant='subtitle2' fontWeight={800}>
          {homeFormation ?? '–'}
        </Typography>
      </Stack>
      <SportsSoccerIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
      <Stack alignItems='flex-end'>
        <Typography variant='caption' color='text.disabled' fontWeight={600}>
          {awayCode || 'Visitante'}
        </Typography>
        <Typography variant='subtitle2' fontWeight={800}>
          {awayFormation ?? '–'}
        </Typography>
      </Stack>
    </Stack>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export function MatchLineupsSection({
  lineups,
  homeCode,
  awayCode
}: {
  lineups: MatchLineups;
  homeCode: string;
  awayCode: string;
}) {
  if (!lineups.available || !lineups.home || !lineups.away) {
    return (
      <Stack alignItems='center' spacing={1} sx={{ py: 4 }}>
        <SportsSoccerIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.4 }} />
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          Las alineaciones estarán disponibles cuando el partido comience.
        </Typography>
      </Stack>
    );
  }

  const { home, away } = lineups;

  return (
    <Stack spacing={2}>
      <FormationHeader
        homeCode={homeCode}
        awayCode={awayCode}
        homeFormation={home.formation?.summary ?? null}
        awayFormation={away.formation?.summary ?? null}
      />

      <FootballPitch homeLineup={home} awayLineup={away} />

      {(home.bench.length > 0 || away.bench.length > 0) && (
        <>
          <Divider />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <BenchList players={home.bench} label={homeCode || 'Local'} />
            </Box>
            <Divider orientation='vertical' flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{ flex: 1 }}>
              <BenchList players={away.bench} label={awayCode || 'Visitante'} />
            </Box>
          </Stack>
        </>
      )}
    </Stack>
  );
}
