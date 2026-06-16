import { Box, Stack, Typography } from '@mui/material';
import type { MatchOdds } from '../types/matchDetail.types';

// Converts an American moneyline to its implied probability (0–1).
// ml > 0 (underdog): 100 / (ml + 100)
// ml < 0 (favorite): abs(ml) / (abs(ml) + 100)
function americanToImplied(ml: number): number {
  if (ml > 0) return 100 / (ml + 100);
  return Math.abs(ml) / (Math.abs(ml) + 100);
}

// Returns the three percentages [home, draw, away] normalized to sum to 100%.
// Vig (bookmaker margin) is removed by dividing each implied prob by their sum.
function derivePcts(home: number, draw: number, away: number): [number, number, number] {
  const h = americanToImplied(home);
  const d = americanToImplied(draw);
  const a = americanToImplied(away);
  const sum = h + d + a;
  if (sum === 0) return [33, 34, 33];
  return [(h / sum) * 100, (d / sum) * 100, (a / sum) * 100];
}

function fmtMoneyLine(ml: number): string {
  return ml > 0 ? `+${Math.round(ml)}` : `${Math.round(ml)}`;
}

interface OddsColumnProps {
  label: string;
  name: string;
  ml: number | null;
  pct: number | null;
  align?: 'left' | 'center' | 'right';
}

function OddsColumn({ label, name, ml, pct, align = 'center' }: OddsColumnProps) {
  const textAlign = align;
  return (
    <Stack alignItems={align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'} spacing={0.25}>
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5, textAlign }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.secondary', textAlign }} noWrap>
        {name}
      </Typography>
      <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: 'text.primary', textAlign, fontVariantNumeric: 'tabular-nums' }}>
        {ml !== null ? fmtMoneyLine(ml) : '—'}
      </Typography>
      {pct !== null && (
        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', textAlign, fontVariantNumeric: 'tabular-nums' }}>
          {pct.toFixed(0)}%
        </Typography>
      )}
    </Stack>
  );
}

interface Props {
  odds: MatchOdds;
  homeName: string;
  awayName: string;
}

export function MatchOddsCard({ odds, homeName, awayName }: Props) {
  const hasPcts = odds.home !== null && odds.draw !== null && odds.away !== null;
  const pcts = hasPcts ? derivePcts(odds.home!, odds.draw!, odds.away!) : null;

  return (
    <Stack spacing={1.25}>
      {/* 1X2 columns */}
      <Stack direction='row' alignItems='flex-start'>
        <Box sx={{ flex: 1 }}>
          <OddsColumn label='L' name={homeName} ml={odds.home} pct={pcts ? pcts[0] : null} align='left' />
        </Box>
        <Box sx={{ flexShrink: 0, px: 1.5 }}>
          <OddsColumn label='E' name='Empate' ml={odds.draw} pct={pcts ? pcts[1] : null} align='center' />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <OddsColumn label='V' name={awayName} ml={odds.away} pct={pcts ? pcts[2] : null} align='right' />
        </Box>
      </Stack>

      {/* Probability bar — only when all three odds are present */}
      {pcts && (
        <Stack spacing={0.5}>
          <Stack
            direction='row'
            sx={{ height: 5, borderRadius: 999, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.08)' }}
          >
            <Box sx={{ width: `${pcts[0]}%`, bgcolor: 'primary.main', transition: 'width 0.3s ease' }} />
            <Box sx={{ width: `${pcts[1]}%`, bgcolor: 'text.disabled', transition: 'width 0.3s ease' }} />
            <Box sx={{ width: `${pcts[2]}%`, bgcolor: 'secondary.main', transition: 'width 0.3s ease' }} />
          </Stack>
        </Stack>
      )}

      {/* Provider attribution */}
      <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled', textAlign: 'right' }}>
        Cuotas: {odds.provider}
      </Typography>
    </Stack>
  );
}
