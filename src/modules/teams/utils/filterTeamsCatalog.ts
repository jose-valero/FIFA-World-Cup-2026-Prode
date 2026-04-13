import type { TeamCatalogItem, TeamsCatalogFilters } from '../types/teams.types';

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function filterTeamsCatalog(items: TeamCatalogItem[], filters: TeamsCatalogFilters) {
  const normalizedSearch = normalizeText(filters.search);

  if (!normalizedSearch) {
    return items;
  }

  return items.filter((team) => {
    const haystack = normalizeText([team.name, team.code, team.short_name].filter(Boolean).join(' '));
    return haystack.includes(normalizedSearch);
  });
}
