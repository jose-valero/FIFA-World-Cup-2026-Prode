export type TeamCatalogItem = {
  id: string;
  code: string | null;
  name: string;
  short_name: string | null;
};

export type TeamsCatalogFilters = {
  search: string;
};

export type TeamConfederation = {
  code: string | null;
  label: string | null;
};

export type TeamVenue = {
  name: string | null;
  city: string | null;
};

export type TeamPlayer = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  number?: number | null;
  position?: string | null;
  photoUrl?: string | null;
};

export type TeamDetail = {
  id: string;
  code: string | null;
  name: string;
  shortName: string | null;
  group: string | null;
  confederation: TeamConfederation;
  country: string | null;
  logoUrl: string | null;
  founded: number | null;
  national: boolean | null;
  venue: TeamVenue;
  players: TeamPlayer[];
  source: {
    provider: string;
    externalTeamId: number | null;
    fetchedAt: string;
  };
};
