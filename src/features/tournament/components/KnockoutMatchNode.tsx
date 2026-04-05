import { Box, Stack, Typography, alpha } from '@mui/material';
import type { Match } from '../../matches/types';

interface KnockoutMatchNodeProps {
  match: Match;
  onClick?: (match: Match) => void;
  highlighted?: boolean;
}

function buildSourceSlot(match: Match, side: 'home' | 'away'): string | null {
  const sourceType = side === 'home' ? match.homeSourceType : match.awaySourceType;
  const groupCode = side === 'home' ? match.homeSourceGroupCode : match.awaySourceGroupCode;
  const groupRank = side === 'home' ? match.homeSourceGroupRank : match.awaySourceGroupRank;
  const groupSet = side === 'home' ? match.homeSourceGroupSet : match.awaySourceGroupSet;
  const sourceMatchId = side === 'home' ? match.homeSourceMatchId : match.awaySourceMatchId;
  const teamCode = side === 'home' ? match.homeTeamCode : match.awayTeamCode;

  switch (sourceType) {
    case 'group_position':
      return groupCode && groupRank ? `${groupRank}${groupCode}` : null;
    case 'best_third_place':
      return groupSet ? `3${groupSet}` : null;
    case 'match_winner':
      return sourceMatchId ? `W${sourceMatchId}` : null;
    case 'match_loser':
      return sourceMatchId ? `L${sourceMatchId}` : null;
    case 'team':
      return teamCode || null;
    default:
      return null;
  }
}

function buildDisplayedSideLabel(match: Match, side: 'home' | 'away') {
  const teamName = side === 'home' ? match.homeTeam : match.awayTeam;
  const slot = buildSourceSlot(match, side);

  if (teamName && teamName.trim() !== '') {
    return teamName;
  }

  return slot || 'Por definir';
}

function getScoreValue(value: number | null) {
  return value === null ? '—' : String(value);
}

function MatchRow({ label, score, isWinner }: { label: string; score: string; isWinner: boolean }) {
  return (
    <Stack direction='row' alignItems='center' spacing={1}>
      <Typography
        variant='body2'
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          lineHeight: 1.1,
          fontWeight: isWinner ? 800 : 700,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </Typography>

      <Typography
        variant='body2'
        sx={{
          minWidth: 12,
          textAlign: 'right',
          fontSize: 13,
          lineHeight: 1,
          fontWeight: 800
        }}
      >
        {score}
      </Typography>
    </Stack>
  );
}

export function KnockoutMatchNode({ match, onClick, highlighted = false }: KnockoutMatchNodeProps) {
  const homeLabel = buildDisplayedSideLabel(match, 'home');
  const awayLabel = buildDisplayedSideLabel(match, 'away');
  const clickable = Boolean(onClick);

  const homeScore = match.officialHomeScore;
  const awayScore = match.officialAwayScore;

  const homeWinner = homeScore !== null && awayScore !== null ? homeScore >= awayScore : false;

  const awayWinner = homeScore !== null && awayScore !== null ? awayScore >= homeScore : false;

  return (
    <Box
      onClick={clickable ? () => onClick?.(match) : undefined}
      sx={(theme) => ({
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: highlighted ? alpha(theme.palette.primary.main, 0.38) : alpha(theme.palette.common.white, 0.08),
        background: `linear-gradient(
          180deg,
          ${alpha(theme.palette.background.paper, 0.96)} 0%,
          ${alpha('#0E1420', 0.96)} 100%
        )`,
        boxShadow: highlighted
          ? `0 10px 26px ${alpha(theme.palette.primary.main, 0.12)}`
          : '0 8px 22px rgba(0,0,0,0.24)',
        px: 1.25,
        py: 1,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
        '&:hover': clickable
          ? {
              transform: 'translateY(-1px)',
              borderColor: alpha(theme.palette.primary.main, 0.52),
              boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.16)}`
            }
          : undefined
      })}
    >
      <Stack spacing={1.75} sx={{ width: '100%' }}>
        <MatchRow label={homeLabel} score={getScoreValue(homeScore)} isWinner={homeWinner} />
        <MatchRow label={awayLabel} score={getScoreValue(awayScore)} isWinner={awayWinner} />
      </Stack>
    </Box>
  );
}
