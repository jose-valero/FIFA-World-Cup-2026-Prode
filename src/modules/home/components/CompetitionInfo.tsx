import { Grid } from '@mui/material';
import { StatCard } from './StatCard';
import type { MatchLeaderboard } from '../../leaderboard/types/leaderboard.types';

export const CompetitionInfo = ({ matches, leaderboard }: MatchLeaderboard) => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard
          label='Líder actual'
          value={leaderboard[0] ? leaderboard[0].display_name : '-'}
          helper='Primer lugar del ranking'
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard
          label='Puntaje líder'
          value={leaderboard[0] ? `${leaderboard[0].total_points} pts` : '-'}
          helper='Puntaje a alcanzar'
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard
          label='Partidos ya evaluados'
          value={matches.filter((match) => match.officialHomeScore !== null && match.officialAwayScore !== null).length}
          helper='Resultados oficiales cargados'
        />
      </Grid>
    </Grid>
  );
};
