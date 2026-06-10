import { Alert, Box, CircularProgress, Grid, Stack } from '@mui/material';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { useLeaderboard } from '../../leaderboard/hooks/useLeaderboard';
import { useMatches } from '../../matches/hooks/useMatches';
import { HowItWorks } from '../components/HowItWorks';
import { ProductHighlights } from '../components/ProductHighlights';
import { ScoringRules } from '../components/ScoringRules';
import { CompetitionInfo } from '../components/CompetitionInfo';
import { HomeHero } from '../components/HomeHero';
import { HomeFooter } from '../components/HomeFooter';
import { StrongProdeMessage } from '../components/StrongProdeMessage';
import { LeaderboardPreview } from '../components/LeaderboardPreview';

export function HomePage() {
  const {
    data: leaderboard = [],
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError
  } = useLeaderboard();

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  const {
    data: settings = null,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError
  } = useAppSettings();

  const isLoading = isLeaderboardLoading || isMatchesLoading || isSettingsLoading;
  const isError = isLeaderboardError || isMatchesError || isSettingsError;
  const firstError = leaderboardError || matchesError || settingsError;
  const leaderboardPreview = leaderboard.slice(0, 5);

  if (isLoading) {
    return (
      <Stack alignItems='center' sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box component='section'>
      <Stack spacing={4}>
        {isError ? (
          <Alert severity='error'>
            {firstError instanceof Error ? firstError.message : 'No se pudo cargar la portada'}
          </Alert>
        ) : null}

        <HomeHero leaderboard={leaderboard} matches={matches} settings={settings} />

        <CompetitionInfo matches={matches} leaderboard={leaderboard} />

        <HowItWorks />
        <ProductHighlights />
        <ScoringRules />

        <Grid container spacing={2}>
          <LeaderboardPreview leaderboardPreview={leaderboardPreview} />
          <StrongProdeMessage />
        </Grid>

        <HomeFooter />
      </Stack>
    </Box>
  );
}
