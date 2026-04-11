import { podiumStylesMap } from './tokens';

export function podiumStyle(position: number) {
  return podiumStylesMap[position as keyof typeof podiumStylesMap] ?? null;
}
