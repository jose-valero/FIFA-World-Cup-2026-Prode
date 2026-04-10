import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  isLoading = false,
  onConfirm,
  onCancel
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth='xs' fullWidth>
      <DialogTitle>{title}</DialogTitle>

      {description ? (
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {description}
          </Typography>
        </DialogContent>
      ) : null}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant='outlined' onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>

        <Button variant='contained' color='error' onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Eliminando...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
