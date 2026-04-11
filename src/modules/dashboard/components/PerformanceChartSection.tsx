import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuditPredictionsByUser } from '../../audits/hooks/useAuditPredictionsByUser';
import { useMatches } from '../../matches/hooks/useMatches';
import type { Match } from '../../matches/types/types';

const MAX_POINTS = 5;
const BAR_WIDTH = 20;
const BAR_GAP = 4;
const CHART_HEIGHT = 96;

type ScoredMatch = {
  match: Match;
  homeScore: number;
  awayScore: number;
  points: 0 | 3 | 5;
  isExact: boolean;
};

function getPredictionOutcome(home: number, away: number) {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function scoreMatch(predHome: number, predAway: number, officialHome: number, officialAway: number): 0 | 3 | 5 {
  if (predHome === officialHome && predAway === officialAway) return 5;
  if (getPredictionOutcome(predHome, predAway) === getPredictionOutcome(officialHome, officialAway)) return 3;
  return 0;
}

function barSxColor(points: 0 | 3 | 5): string {
  if (points === 5) return 'success.main';
  if (points === 3) return 'primary.main';
  return 'action.selected';
}

function PerformanceBar({ item }: { item: ScoredMatch }) {
  const barHeightPx = Math.max((item.points / MAX_POINTS) * CHART_HEIGHT, item.points === 0 ? 4 : 0);
  const color = barSxColor(item.points);
  const label = `${item.match.homeTeam} vs ${item.match.awayTeam}: ${item.points} pts (${item.homeScore}-${item.awayScore})`;

  return (
    <Box
      title={label}
      sx={{
        width: BAR_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: CHART_HEIGHT,
        cursor: 'default'
      }}
    >
      <Typography
        variant='caption'
        sx={{
          fontSize: 10,
          fontWeight: 700,
          color: item.points > 0 ? color : 'text.disabled',
          mb: 0.5,
          lineHeight: 1
        }}
      >
        {item.points}
      </Typography>
      <Box
        sx={{
          width: BAR_WIDTH - 2,
          height: barHeightPx,
          bgcolor: color,
          borderRadius: '3px 3px 0 0',
          transition: 'opacity 0.15s',
          '&:hover': { opacity: 0.8 }
        }}
      />
    </Box>
  );
}

type PerformanceChartSectionProps = {
  userId: string | null;
};

export function PerformanceChartSection({ userId }: PerformanceChartSectionProps) {
  const {
    data: predictionRows = [],
    isLoading: isPredictionsLoading,
    isError: isPredictionsError
  } = useAuditPredictionsByUser(userId ?? undefined, Boolean(userId));

  const { data: matches = [], isLoading: isMatchesLoading, isError: isMatchesError } = useMatches();

  const isLoading = isPredictionsLoading || isMatchesLoading;
  const isError = isPredictionsError || isMatchesError;

  const scoredMatches = React.useMemo<ScoredMatch[]>(() => {
    const matchMap = new Map(matches.map((m) => [m.id, m]));

    const items: ScoredMatch[] = [];

    for (const row of predictionRows) {
      const match = matchMap.get(row.match_id);
      if (!match || match.officialHomeScore === null || match.officialAwayScore === null) continue;

      items.push({
        match,
        homeScore: row.home_score,
        awayScore: row.away_score,
        points: scoreMatch(row.home_score, row.away_score, match.officialHomeScore, match.officialAwayScore),
        isExact: row.home_score === match.officialHomeScore && row.away_score === match.officialAwayScore
      });
    }

    return items.sort((a, b) => new Date(a.match.kickoffAt).getTime() - new Date(b.match.kickoffAt).getTime());
  }, [predictionRows, matches]);

  const summary = React.useMemo(() => {
    const total = scoredMatches.reduce((acc, m) => acc + m.points, 0);
    const exacts = scoredMatches.filter((m) => m.isExact).length;
    const outcomes = scoredMatches.filter((m) => m.points === 3).length;
    return { total, exacts, outcomes, count: scoredMatches.length };
  }, [scoredMatches]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant='subtitle1' fontWeight={800}>
          Desempeño partido a partido
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Puntos obtenidos en cada partido evaluado, en orden cronológico.
        </Typography>
      </Stack>

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 3 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Alert severity='error'>No se pudo cargar el historial de pronósticos.</Alert>
      ) : scoredMatches.length === 0 ? (
        <Alert severity='info'>Aún no hay partidos evaluados para mostrar.</Alert>
      ) : (
        <Stack spacing={2}>
          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Typography variant='caption' color='text.secondary'>
              {summary.count} evaluados ·{' '}
            </Typography>
            <Typography variant='caption' sx={{ color: 'success.main', fontWeight: 700 }}>
              {summary.exacts} exactos
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              ·
            </Typography>
            <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 700 }}>
              {summary.outcomes} signo
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              · {summary.total} pts acumulados
            </Typography>
          </Stack>

          <Box
            sx={{
              overflowX: 'auto',
              pb: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: `${BAR_GAP}px`,
                minWidth: scoredMatches.length * (BAR_WIDTH + BAR_GAP),
                borderBottom: (t) => `2px solid ${t.palette.divider}`,
                pt: 1
              }}
            >
              {scoredMatches.map((item) => (
                <PerformanceBar key={item.match.id} item={item} />
              ))}
            </Box>
          </Box>

          <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
            <Stack direction='row' spacing={0.75} alignItems='center'>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'success.main', flexShrink: 0 }} />
              <Typography variant='caption' color='text.secondary'>
                5 pts — exacto
              </Typography>
            </Stack>
            <Stack direction='row' spacing={0.75} alignItems='center'>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'primary.main', flexShrink: 0 }} />
              <Typography variant='caption' color='text.secondary'>
                3 pts — signo
              </Typography>
            </Stack>
            <Stack direction='row' spacing={0.75} alignItems='center'>
              <Box
                sx={(t) => ({
                  width: 10,
                  height: 10,
                  borderRadius: 0.5,
                  bgcolor: t.palette.action.selected,
                  flexShrink: 0
                })}
              />
              <Typography variant='caption' color='text.secondary'>
                0 pts — fallo
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}
