export const APP_TITLE = 'Orchidex';
export const APP_DESCRIPTION = `${APP_TITLE} is a platform for exploring the world of orchid species and hybrids. Visualize their complex ancestries and learn about the people and organizations who grow and discover them.`;

// https://stackoverflow.com/a/77996386
export const APP_URL =
  process.env.VERCEL_ENV === 'production'
    ? `https://orchidex.org`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:3000`;

export const CROSS_FIELDS = ['g1', 'e1', 'g2', 'e2'];

export const ID_FIELDS = ['id', 'seed_parent_id', 'pollen_parent_id'];

export const SEARCH_FIELDS = [
  'genus',
  'epithet',
  'registrant_name',
  'originator_name',
  'date_of_registration',
  'seed_parent_genus',
  'seed_parent_epithet',
  'pollen_parent_genus',
  'pollen_parent_epithet',
];

export const NORMALIZED_SEARCH_FIELDS = [
  'epithet',
  'registrant_name',
  'originator_name',
  'seed_parent_epithet',
  'pollen_parent_epithet',
];
