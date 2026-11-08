// Shared by the search page, the search API and the legacy-URL redirects.
// Keep this file free of server-only imports so client components can use it.

// Record types form a small hierarchy:
//   type: species or hybrid
//     origin (hybrids only): primary (both parents species) or complex.
//       natural (primaries only): arose in the wild. Every natural hybrid
//         is primary, but not every primary is natural.
//     intergeneric (hybrids only): parents from different genera. Combines
//       with any of the above.
export const SEARCH_TYPES = ['species', 'hybrid'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export const TYPE_LABELS: Record<SearchType, string> = {
  species: 'Species',
  hybrid: 'Hybrids',
};

export const SEARCH_ORIGINS = ['primary', 'complex'] as const;
export type SearchOrigin = (typeof SEARCH_ORIGINS)[number];

export const ORIGIN_LABELS: Record<SearchOrigin, string> = {
  primary: 'Primary',
  complex: 'Complex',
};

export const SEARCH_SORTS = ['relevance', 'newest', 'oldest', 'name'] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

export const SORT_LABELS: Record<SearchSort, string> = {
  relevance: 'Best match',
  newest: 'Newest first',
  oldest: 'Oldest first',
  name: 'Name (A–Z)',
};

// Free-text fields, in the order they appear in the filters panel.
export const TEXT_FILTER_KEYS = [
  'genus',
  'epithet',
  'g1',
  'e1',
  'g2',
  'e2',
  'registrant',
  'originator',
] as const;
export type TextFilterKey = (typeof TEXT_FILTER_KEYS)[number];

export type SearchParams = {
  q?: string;
  genus?: string;
  epithet?: string;
  // Parents, matched in either direction (seed × pollen or pollen × seed).
  g1?: string;
  e1?: string;
  g2?: string;
  e2?: string;
  registrant?: string;
  originator?: string;
  type?: SearchType;
  origin?: SearchOrigin;
  natural?: boolean;
  intergeneric?: boolean;
  // Registration dates (YYYY-MM-DD), inclusive.
  from?: string;
  to?: string;
  sort?: SearchSort;
};

export const PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const parseDate = (value: string | undefined) =>
  value && DATE.test(value) && !Number.isNaN(Date.parse(value))
    ? value
    : undefined;

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined | null>;

const getter = (raw: RawParams) => (key: string) => {
  const value =
    raw instanceof URLSearchParams ? raw.get(key) : raw[key] ?? undefined;
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
};

export function parseSearchParams(raw: RawParams): SearchParams {
  const get = getter(raw);
  const params: SearchParams = {};

  const q = get('q');
  if (q) params.q = q;

  TEXT_FILTER_KEYS.forEach((key) => {
    const value = get(key);
    if (value) params[key] = value;
  });

  const type = get('type');
  if (SEARCH_TYPES.includes(type as SearchType)) {
    params.type = type as SearchType;
  }
  const origin = get('origin');
  if (SEARCH_ORIGINS.includes(origin as SearchOrigin)) {
    params.origin = origin as SearchOrigin;
  }
  if (get('intergeneric') === '1') params.intergeneric = true;
  if (get('natural') === '1') params.natural = true;

  // Natural hybrids are primaries, so natural implies primary and can't go
  // with complex.
  if (params.natural) {
    if (params.origin === 'complex') delete params.natural;
    else params.origin = 'primary';
  }

  // The hybrid-only filters imply hybrids, and can't apply to species.
  if (params.origin || params.natural || params.intergeneric) {
    if (params.type === 'species') {
      delete params.origin;
      delete params.natural;
      delete params.intergeneric;
    } else {
      params.type = 'hybrid';
    }
  }

  const from = parseDate(get('from'));
  if (from) params.from = from;
  const to = parseDate(get('to'));
  if (to) params.to = to;

  const sort = get('sort');
  if (SEARCH_SORTS.includes(sort as SearchSort)) {
    params.sort = sort as SearchSort;
  }

  return params;
}

export function toQueryString(params: SearchParams): string {
  const out = new URLSearchParams();

  if (params.q) out.set('q', params.q);
  TEXT_FILTER_KEYS.forEach((key) => {
    if (params[key]) out.set(key, params[key]);
  });
  if (params.type) out.set('type', params.type);
  if (params.type === 'hybrid') {
    if (params.origin) out.set('origin', params.origin);
    if (params.origin === 'primary' && params.natural) out.set('natural', '1');
    if (params.intergeneric) out.set('intergeneric', '1');
  }
  if (params.from) out.set('from', params.from);
  if (params.to) out.set('to', params.to);
  if (params.sort && params.sort !== defaultSort(params)) {
    out.set('sort', params.sort);
  }

  return out.toString();
}

// Which group of the filters panel to open and highlight. The values match
// the homepage links: "hybrid" for the parent fields and "advanced" for the
// rest. "1" opens the panel without highlighting anything.
export const FILTER_PANELS = ['hybrid', 'advanced'] as const;
export type FilterPanel = (typeof FILTER_PANELS)[number];

export const parseFilterPanel = (value?: string | null) =>
  FILTER_PANELS.includes(value as FilterPanel)
    ? (value as FilterPanel)
    : undefined;

export const searchUrl = (
  params: SearchParams,
  { panel }: { panel?: FilterPanel } = {}
) => {
  const qs = new URLSearchParams(toQueryString(params));
  if (panel) qs.set('filters', panel);
  const str = qs.toString();
  return str ? `/search?${str}` : '/search';
};

// Anything that narrows the results. Sort alone doesn't count.
export const hasCriteria = (p: SearchParams) =>
  !!(p.q || TEXT_FILTER_KEYS.some((key) => p[key]) || p.type || p.from || p.to);

export const countFilters = (p: SearchParams) =>
  TEXT_FILTER_KEYS.filter((key) => p[key]).length +
  (p.type ? 1 : 0) +
  (p.type === 'hybrid' && p.origin ? 1 : 0) +
  (p.type === 'hybrid' && p.origin === 'primary' && p.natural ? 1 : 0) +
  (p.type === 'hybrid' && p.intergeneric ? 1 : 0) +
  (p.from || p.to ? 1 : 0);

export const defaultSort = (p: SearchParams): SearchSort =>
  p.q ? 'relevance' : 'newest';

export const effectiveSort = (p: SearchParams): SearchSort =>
  p.sort === 'relevance' && !p.q ? 'newest' : p.sort ?? defaultSort(p);

// Old /search-advanced and /search-hybrid param names → new ones. The old
// seed/pollen fields become the two parents, which match in either order.
const LEGACY_KEYS: Record<string, TextFilterKey> = {
  genus: 'genus',
  epithet: 'epithet',
  registrant_name: 'registrant',
  originator_name: 'originator',
  seed_parent_genus: 'g1',
  seed_parent_epithet: 'e1',
  pollen_parent_genus: 'g2',
  pollen_parent_epithet: 'e2',
  g1: 'g1',
  e1: 'e1',
  g2: 'g2',
  e2: 'e2',
};

// Maps query strings from the retired search pages onto the new params.
export function fromLegacyParams(raw: RawParams): SearchParams {
  const get = getter(raw);
  const params: SearchParams = {};

  Object.entries(LEGACY_KEYS).forEach(([oldKey, newKey]) => {
    const value = get(oldKey);
    if (value) params[newKey] = value;
  });

  // The old advanced search matched dates with a substring, so a bare year
  // is the only value worth carrying over.
  const year = get('date_of_registration');
  if (year && /^\d{4}$/.test(year)) {
    params.from = `${year}-01-01`;
    params.to = `${year}-12-31`;
  }

  return params;
}
