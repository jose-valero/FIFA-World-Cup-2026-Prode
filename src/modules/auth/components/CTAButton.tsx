import { Button } from '@mui/material';

interface CTAButtonProps {
  isSubmitting: boolean;
  ctaText?: string;
}

export const CTAButton = ({ isSubmitting, ctaText = 'Crear cuenta' }: CTAButtonProps) => {
  return (
    <Button
      type='submit'
      variant='contained'
      size='large'
      fullWidth
      disabled={isSubmitting}
      sx={{ minHeight: 48, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
    >
      {ctaText}
    </Button>
  );
};
