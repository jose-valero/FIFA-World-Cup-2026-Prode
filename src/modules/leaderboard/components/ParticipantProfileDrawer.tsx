import CloseIcon from '@mui/icons-material/Close';
import { Box, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase/client';
import { PersonalInfoSection } from '../../profile/components/PersonalInfoSection';
import { PerformanceChartSection } from '../../dashboard/components/PerformanceChartSection';
import type { LeaderboardRow } from '../types/leaderboard.types';

type ParticipantProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
  participant: LeaderboardRow | null;
  position: number | null;
  canInspectPredictions: boolean;
  onOpenAudit: () => void;
};

async function fetchParticipantProfile(userId: string) {
  const { data } = await supabase.from('profiles').select('avatar_url, created_at').eq('id', userId).single();
  return data ?? null;
}

export function ParticipantProfileDrawer({
  open,
  onClose,
  participant,
  canInspectPredictions,
  onOpenAudit
}: ParticipantProfileDrawerProps) {
  const { data: participantProfile = null } = useQuery({
    queryKey: ['participant-profile', participant?.user_id ?? ''],
    queryFn: () => fetchParticipantProfile(participant!.user_id),
    enabled: open && Boolean(participant?.user_id),
    staleTime: 60_000
  });

  return (
    <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 520 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', gap: 2.5, overflowY: 'auto' }}>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6' fontWeight={800}>
            Perfil del participante
          </Typography>
          <IconButton onClick={onClose} aria-label='Cerrar perfil' size='small'>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider />

        {participant ? (
          <>
            <PersonalInfoSection
              displayName={participant.display_name}
              avatarUrl={participantProfile?.avatar_url ?? null}
              createdAt={participantProfile?.created_at ?? null}
              isDisabled={participant.is_disabled}
              readonly
            />

            <PerformanceChartSection userId={participant.user_id} />

            {canInspectPredictions ? (
              <Box>
                <Divider sx={{ mb: 2 }} />
                <Box
                  component='button'
                  onClick={onOpenAudit}
                  sx={{
                    width: '100%',
                    py: 1,
                    px: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    color: 'text.primary',
                    typography: 'body2',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  Ver pronósticos detallados →
                </Box>
              </Box>
            ) : null}
          </>
        ) : null}
      </Box>
    </Drawer>
  );
}
