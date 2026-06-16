export type PlayerShirtIconProps = {
  number: string | number;
  primaryColor: string;
  secondaryColor?: string;
  trimColor?: string;
  textColor?: string;
  size?: number;
  className?: string;
};

// ESPN sometimes returns hex colors without the leading '#' (e.g. "6cabdd").
function normalizeHexColor(color: string): string {
  const trimmed = color.trim();
  if (!trimmed) return trimmed;
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`;
  return trimmed;
}

// Picks black/white for the dorsal number based on the jersey's perceived
// brightness, so it stays legible regardless of which team color is used.
function getReadableTextColor(hexColor: string): string {
  const hex = normalizeHexColor(hexColor).replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return '#ffffff';
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#161616' : '#ffffff';
}

export function PlayerShirtIcon({
  number,
  primaryColor,
  secondaryColor = '#ffffff',
  trimColor = '#0a0a0a',
  textColor,
  size = 40,
  className
}: PlayerShirtIconProps) {
  const resolvedPrimary = normalizeHexColor(primaryColor);
  const resolvedSecondary = normalizeHexColor(secondaryColor);
  const resolvedTrim = normalizeHexColor(trimColor);
  const resolvedText = textColor ? normalizeHexColor(textColor) : getReadableTextColor(resolvedPrimary);

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 1440 1440'
      fill='none'
      shapeRendering='geometricPrecision'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      aria-hidden='true'
    >
      {/* collar/cuff base, visible around the trim cutouts */}
      <path
        d='M719.92,1364c-115.3,0-209-7.9-278.6-23.6-23.8-5.4-58.4-14.4-83.5-30.4-10.3-6.6-16.5-18.29-16.5-31.09v-3c0-71.5,4.4-123.99,9.1-179.69v-1.2c4.7-55.29,9.5-112.59,11-195.48.5-26,.3-52.1-.5-77.89-1.6.4-3,.7-4.2.9-11.9,1.9-23.2,2.7-34.3,2.7-58.1,0-116.3-24.1-168.5-69.79-18.8-16.4-36.4-35.2-52.4-55.79-.1-.2-10.4-13.7-18.6-26.1-8.5-12.8-9.2-29.7-1.9-44l15.6-30.6c9.6-19.1,22.6-45.3,36.3-73.59,34.6-71.59,57.8-124.29,65.2-148.49,10.2-33.1,23-68.09,47.8-100.09,25.4-32.8,60.4-57.99,107.2-77.29l8-3.3c48.1-19.8,102.4-42.2,163.7-58.5,3.3-5.5,6.5-10.2,9.7-14.3,7.9-10.2,16.2-17.6,25.4-22.4,32.5-17,83.4-25,160.2-25s127.7,7.9,160.2,24.9c9.2,4.8,17.5,12.2,25.4,22.4,3.2,4.1,6.4,8.9,9.7,14.3,61.2,16.2,115.51,38.6,163.61,58.5l8,3.3c46.7,19.2,81.8,44.5,107.2,77.29,24.8,32,37.6,67,47.8,100.09,7.5,24.2,30.6,76.99,65.2,148.49,13.7,28.2,26.7,54.5,36.3,73.69l15.5,30.5c7.3,14.3,6.5,31.1-1.9,44-8.1,12.2-18.1,25.4-18.5,26-16.2,20.8-33.8,39.6-52.5,55.9-52.2,45.7-110.5,69.79-168.5,69.79-11.1,0-22.4-.9-33.5-2.6-.7-.1-2.5-.5-4.9-1-.8,25.8-1,51.9-.5,77.89,1.4,82.59,6.2,139.79,10.8,195.08v1.7c4.8,55.5,9.2,107.99,9.2,179.49v3c0,12.9-6.2,24.49-16.5,31.09-25,16-59.6,25-83.51,30.4-69.6,15.6-163.4,23.6-278.6,23.6l-.2.2Z'
        fill={resolvedSecondary}
      />
      {/* main jersey body */}
      <path
        d='M1200,390c-20-65-45-115-130-150s-190.86-80-310-80h-80c-119.14,0-225,45-310,80s-110,85-130,150-120,260-120,260c0,0,91.73,151.42,230,130,0,0,20-80,40-120,0,0,17.57,90.67,15,240-2.91,169.51-20,236.73-20,375,0,0,65,45,335,45s335-45,335-45c0-138.27-17.08-205.49-20-375-2.57-149.33,15-240,15-240,20,40,40,120,40,120,138.27,21.42,230-130,230-130,0,0-100-195-120-260Z'
        fill={resolvedPrimary}
      />
      {/* fabric shading — static effect, not a team color */}
      <g fill='#000000' opacity={0.3}>
        <path d='M720,1265c-170,0-280-40-280-40,60,50,160,70,280,70s220-20,280-70c0,0-110,40-280,40Z' />
        <path d='M720,200c-68.75,0-144.14,10.21-200,40,0,0,105.17-15,200-15s200,15,200,15c-55.86-29.79-131.25-40-200-40Z' />
        <path d='M1170,700c-5.79-36.48,6.16-101.7,20-150-27.77,22.52-54.25,76.29-70,110-16.91-65.57-14.47-183.63-20-240-22.11,72.06-40.28,150.85-50,240,20,40,40,120,40,120,71.26,11.04,130.16-23.83,170.51-60.22-67.27-1.1-88.41-6.54-90.51-19.78Z' />
        <path d='M860,1200c59.65-10.27,142.73-38.17,188.12-76.4-5.1-62.69-11.44-126.29-13.12-223.6-.77-44.6.26-83.96,2.08-117.24-14.92,48.88-36.92,113.16-57.08,142.24-34.02,49.05-69.02,93.62-150,135,132.17-5.14,169.28-92.43,180-50,10.45,41.37-36.52,109.44-150,190Z' />
        <path d='M391.88,1123.6c45.39,38.23,128.47,66.13,188.12,76.4-113.48-80.56-160.45-148.63-150-190,10.72-42.43,47.83,44.86,180,50-80.98-41.38-115.98-85.95-150-135-20.16-29.08-42.16-93.36-57.08-142.24,1.82,33.28,2.85,72.64,2.08,117.24-1.67,97.31-8.02,160.91-13.12,223.6Z' />
        <path d='M320,660c-15.75-33.71-42.23-87.48-70-110,13.84,48.3,25.79,113.52,20,150-2.1,13.24-23.24,18.68-90.51,19.78,40.35,36.39,99.25,71.26,170.51,60.22,0,0,20-80,40-120-9.72-89.15-27.89-167.94-50-240-5.53,56.37-3.09,174.43-20,240Z' />
      </g>
      {/* collar trim */}
      <path
        d='M680,160h80c44.14,0,86.45,6.18,126.55,15.73-8.01-15.06-16.99-30.72-26.55-35.73-21.64-11.34-61.25-20-140-20s-118.36,8.66-140,20c-9.57,5.01-18.54,20.68-26.55,35.73,40.1-9.55,82.42-15.73,126.55-15.73Z'
        fill={resolvedTrim}
      />
      {/* shoulder trims */}
      <path
        d='M139.43,611.54c-11.65,23.29-19.43,38.46-19.43,38.46,0,0,91.73,151.42,230,130,0,0,4.42-17.69,11.19-40.59-82.3-6.5-148.23-39.82-221.75-127.87Z'
        fill={resolvedTrim}
      />
      <path
        d='M1300.57,611.54c-73.52,88.05-139.46,121.37-221.75,127.87,6.77,22.9,11.19,40.59,11.19,40.59,138.27,21.42,230-130,230-130,0,0-7.78-15.17-19.43-38.46Z'
        fill={resolvedTrim}
      />
      <text
        fill={resolvedText}
        textAnchor='middle'
        dominantBaseline='central'
        x='50%'
        y='54%'
        fontSize={460}
        fontWeight={800}
        fontFamily='system-ui, -apple-system, sans-serif'
      >
        {number}
      </text>
    </svg>
  );
}
