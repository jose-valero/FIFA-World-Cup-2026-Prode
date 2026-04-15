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
  flagCode: string | null;
  confederation: {
    code: string | null;
    label: string | null;
  };
  country: string | null;
  logoUrl: string | null;
  founded: number | null;
  national: boolean | null;
  venue: {
    name: string | null;
    city: string | null;
  };
  players: TeamPlayer[];
  source: {
    provider: string;
    externalTeamId: number | null;
    fetchedAt: string;
  };
};

export type TeamPlayerDetail = {
  id: string;
  name: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  number: number | null;
  position: string | null;
  photoUrl: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  height: string | null;
  weight: string | null;
  provider: string;
};
