import { useState } from 'react';
import { Box, Button, Collapse, Divider, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BarChartIcon from '@mui/icons-material/BarChart';
import type { MatchStatItem, MatchTeamStats } from '../types/matchDetail.types';
import { FULL_STAT_GROUPS, SUMMARY_STAT_NAMES, findStat, statLabel } from '../utils/matchStats';

// ── Single comparison row ───────────────────────────────────────────────────
// Bar width is the relative proportion between the two raw numeric values —
// this stays meaningful regardless of how ESPN formats the display string.

function StatCompareRow({ home, away }: { home: MatchStatItem; away: MatchStatItem }) {
  const homeRaw = parseFloat(home.value);
  const awayRaw = parseFloat(away.value);
  const total = (Number.isFinite(homeRaw) ? homeRaw : 0) + (Number.isFinite(awayRaw) ? awayRaw : 0);
  const homePct = total > 0 ? (homeRaw / total) * 100 : 50;

  return (
    <Stack spacing={0.6}>
      <Stack direction='row' alignItems='center' spacing={1}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, minWidth: 32 }}>{home.value}</Typography>
        <Typography
          variant='caption'
          sx={{ flex: 1, textAlign: 'center', color: 'text.secondary', fontWeight: 600, letterSpacing: 0.2 }}
        >
          {statLabel(home)}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, minWidth: 32, textAlign: 'right' }}>
          {away.value}
        </Typography>
      </Stack>
      <Stack
        direction='row'
        sx={{ height: 5, borderRadius: 999, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.08)' }}
      >
        <Box sx={{ width: `${homePct}%`, bgcolor: 'primary.main' }} />
        <Box sx={{ width: `${100 - homePct}%`, bgcolor: 'secondary.main' }} />
      </Stack>
    </Stack>
  );
}

// ── Full stats, grouped ──────────────────────────────────────────────────────

function FullStatGroups({ stats }: { stats: MatchTeamStats }) {
  const groups = FULL_STAT_GROUPS.map((group) => ({
    title: group.title,
    rows: group.names
      .map((name) => {
        const home = findStat(stats.home, name);
        const away = findStat(stats.away, name);
        return home && away ? { home, away } : null;
      })
      .filter((row): row is { home: MatchStatItem; away: MatchStatItem } => row !== null)
  })).filter((group) => group.rows.length > 0);

  if (groups.length === 0) return null;

  return (
    <Stack spacing={2}>
      {groups.map((group) => (
        <Stack key={group.title} spacing={1.25}>
          <Typography
            variant='caption'
            fontWeight={700}
            color='text.secondary'
            sx={{ letterSpacing: 0.6, textTransform: 'uppercase', fontSize: '0.63rem' }}
          >
            {group.title}
          </Typography>
          <Stack spacing={1.25}>
            {group.rows.map((row) => (
              <StatCompareRow key={row.home.name} home={row.home} away={row.away} />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function MatchSummarySection({ stats }: { stats: MatchTeamStats | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!stats || (stats.home.length === 0 && stats.away.length === 0)) {
    return (
      <Stack alignItems='center' spacing={1} sx={{ py: 4 }}>
        <BarChartIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.4 }} />
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          Las estadísticas estarán disponibles cuando comience el partido.
        </Typography>
      </Stack>
    );
  }

  const summaryRows = SUMMARY_STAT_NAMES.map((name) => {
    const home = findStat(stats.home, name);
    const away = findStat(stats.away, name);
    return home && away ? { home, away } : null;
  }).filter((row): row is { home: MatchStatItem; away: MatchStatItem } => row !== null);

  return (
    <Stack spacing={2}>
      {summaryRows.length > 0 ? (
        <Stack spacing={1.5}>
          {summaryRows.map((row) => (
            <StatCompareRow key={row.home.name} home={row.home} away={row.away} />
          ))}
        </Stack>
      ) : (
        <Typography variant='body2' color='text.secondary' textAlign='center' sx={{ py: 2 }}>
          Aún no hay estadísticas comparables para este partido.
        </Typography>
      )}

      <Button
        onClick={() => setExpanded((prev) => !prev)}
        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        size='small'
        sx={{ alignSelf: 'center', fontWeight: 700 }}
      >
        Ver estadísticas completas
      </Button>

      <Collapse in={expanded} timeout={280} unmountOnExit>
        <Stack spacing={2}>
          <Divider sx={{ opacity: 0.35 }} />
          <FullStatGroups stats={stats} />
        </Stack>
      </Collapse>
    </Stack>
  );
}
