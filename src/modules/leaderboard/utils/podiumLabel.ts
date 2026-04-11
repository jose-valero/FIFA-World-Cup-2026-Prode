import { podiumStyle } from '../styles/atoms';

export function podiumLabel(position: number) {
  return podiumStyle(position)?.label ?? null;
}
