import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export interface GoogleButtonProps {
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const GoogleButton = ({ isSubmitting, onSubmit }: GoogleButtonProps) => {
  return (
    <Button
      variant='outlined'
      size='large'
      fullWidth
      disabled={isSubmitting}
      onClick={onSubmit}
      sx={{ minHeight: 48, borderRadius: 3, textTransform: 'none', fontWeight: 700, gap: 0.5 }}
    >
      <GoogleIcon /> Continuar con Google
    </Button>
  );
};
