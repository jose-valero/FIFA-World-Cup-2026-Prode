import Box from '@mui/material/Box';
import logoSrc from '../../assets/brand/logo.svg';

type BrandLogoProps = {
  height?: number;
  alt?: string;
};

export function BrandLogo({ height = 70, alt = 'Logo' }: BrandLogoProps) {
  return (
    <Box
      component='img'
      src={logoSrc}
      alt={alt}
      sx={{
        height,
        width: 'auto',
        display: 'block',
        objectFit: 'contain'
      }}
    />
  );
}
