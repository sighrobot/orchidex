const BASE_URL = 'https://apps.rhs.org.uk/horticulturaldatabase/orchidregister';

const SEARCH_URL = `${BASE_URL}/orchidresults.asp?grex=%20`;
const URL = `${BASE_URL}/orchiddetails.asp`;

const escapeSingleQuotes = (s) => s.replace(/'/g, "''");

const normalize = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const FIELDS = [
  'ID',
  'Genus',
  'Epithet',
  'Synonym Flag',
  'Synonym Genus Name',
  'Synonym Epithet Name',
  'Registrant Name',
  'Originator Name',
  'Date of registration',
  'Seed parent Genus',
  'Seed parent Epithet',
  'Pollen parent Genus',
  'Pollen parent Epithet',
];

const EXT_FIELDS = [
  'epithet_normalized',
  'registrant_name_normalized',
  'originator_name_normalized',
  'seed_parent_epithet_normalized',
  'pollen_parent_epithet_normalized',
];

module.exports = {
  BASE_URL,
  SEARCH_URL,
  URL,
  escapeSingleQuotes,
  normalize,
  FIELDS,
  EXT_FIELDS,
};
