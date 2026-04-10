import { Box, Stack, Typography, alpha } from '@mui/material';
import type { Match } from '../../matches/types/types';
import { TeamFlag } from '../../../shared/components/TeamFlag';

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
    case 'team_id':
      return teamCode || null;
    default:
      return null;
  }
}

function buildDisplayedSideData(match: Match, side: 'home' | 'away') {
  const teamName = side === 'home' ? match.homeTeam : match.awayTeam;
  const teamCode = side === 'home' ? match.homeTeamCode : match.awayTeamCode;
  const slot = buildSourceSlot(match, side);

  const hasRealTeam = Boolean(teamName && teamName.trim() !== '' && teamCode);

  if (hasRealTeam) {
    return {
      label: teamName!,
      teamCode,
      isPlaceholder: false
    };
  }

  return {
    label: slot || teamName || 'Por definir',
    teamCode: null,
    isPlaceholder: true
  };
}

function getScoreValue(value: number | null) {
  return value === null ? '—' : String(value);
}

function MatchRow({
  label,
  teamCode,
  score,
  isWinner,
  isPlaceholder
}: {
  label: string;
  teamCode: string | null;
  score: string;
  isWinner: boolean;
  isPlaceholder: boolean;
}) {
  return (
    <Stack direction='row' alignItems='center' spacing={1}>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        {isPlaceholder ? (
          <Box
            sx={(theme) => ({
              px: 0.75,
              py: 0.25,
              minWidth: 38,
              borderRadius: '999px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              textAlign: 'center'
            })}
          >
            <Typography
              variant='caption'
              sx={{
                display: 'block',
                fontSize: 10,
                lineHeight: 1.1,
                fontWeight: 800
              }}
            >
              {label}
            </Typography>
          </Box>
        ) : (
          <TeamFlag teamCode={teamCode} teamName={label} size={16} />
        )}

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
      </Stack>

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
  const homeSide = buildDisplayedSideData(match, 'home');
  const awaySide = buildDisplayedSideData(match, 'away');
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
        <MatchRow
          label={homeSide.label}
          teamCode={homeSide.teamCode}
          isPlaceholder={homeSide.isPlaceholder}
          score={getScoreValue(homeScore)}
          isWinner={homeWinner}
        />

        <MatchRow
          label={awaySide.label}
          teamCode={awaySide.teamCode}
          isPlaceholder={awaySide.isPlaceholder}
          score={getScoreValue(awayScore)}
          isWinner={awayWinner}
        />
      </Stack>
    </Box>
  );
}
