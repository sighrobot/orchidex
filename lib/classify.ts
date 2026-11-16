import { CROSS_CHAR, UNKNOWN_CHAR } from 'lib/string';
import { Grex } from 'lib/types';

// How a registry record is classified: species, or which kind of hybrid.
// Pure functions with no UI dependencies, so server code (search, the MCP
// tools) and components share one set of rules.
export type GrexTerm =
  | 'hypothetical'
  | 'species'
  | 'natural'
  | 'intergeneric'
  | 'primary';

const hasParents = (grex: Grex) =>
  grex.seed_parent_epithet && grex.pollen_parent_epithet;

const isParentNaturalHybrid = (grex: Grex) =>
  grex.seed_parent_epithet?.[0] === UNKNOWN_CHAR ||
  grex.pollen_parent_epithet?.[0] === UNKNOWN_CHAR;

export const isNaturalHybrid = (grex: Grex) =>
  grex.epithet[0] === CROSS_CHAR ||
  (hasParents(grex) && grex.registrant_name === 'This is a natural hybrid') ||
  (hasParents(grex) &&
    !isParentNaturalHybrid(grex) &&
    grex.epithet &&
    !Number.isInteger(parseInt(grex.epithet[0], 10)) &&
    grex.epithet[0] === grex.epithet[0].toLowerCase());

export const isSpecies = (grex: Grex): boolean =>
  !isParentNaturalHybrid(grex) &&
  !isNaturalHybrid(grex) &&
  !!grex.epithet &&
  !Number.isInteger(parseInt(grex.epithet[0], 10)) &&
  grex.epithet[0] === grex.epithet[0].toLowerCase();

// The RHS records unknown or unavailable parents with placeholder codes
// ("na na", "na uk") rather than real names. Being lowercase, they would
// otherwise pass the species-parent check below.
const PLACEHOLDER_CODES = ['na', 'uk'];
const isPlaceholder = (value?: string) =>
  !!value && PLACEHOLDER_CODES.includes(value.trim().toLowerCase());

const hasPlaceholderParent = (grex: Grex) =>
  isPlaceholder(grex.seed_parent_genus) ||
  isPlaceholder(grex.seed_parent_epithet) ||
  isPlaceholder(grex.pollen_parent_genus) ||
  isPlaceholder(grex.pollen_parent_epithet);

export const isPrimary = (grex) =>
  !isParentNaturalHybrid(grex) &&
  !hasPlaceholderParent(grex) &&
  !isNaturalHybrid(grex) &&
  grex.seed_parent_epithet &&
  grex.seed_parent_epithet[0] === grex.seed_parent_epithet[0].toLowerCase() &&
  grex.pollen_parent_epithet &&
  grex.pollen_parent_epithet[0] === grex.pollen_parent_epithet[0].toLowerCase();

export const isIntergeneric = (grex) =>
  grex.seed_parent_genus !== grex.pollen_parent_genus;

export const orderTerms = (grex) => {
  const terms: GrexTerm[] = [];

  if (grex.hypothetical) {
    terms.push('hypothetical');
  }

  if (isSpecies(grex)) {
    terms.push('species');
  }

  if (isIntergeneric(grex)) {
    terms.push('intergeneric');
  }

  if (isNaturalHybrid(grex)) {
    terms.push('natural');
  }

  if (isPrimary(grex)) {
    terms.push('primary');
  }

  return terms;
};

export const getDescriptor = (grex) => {
  const terms = orderTerms(grex);
  if (terms.length === 0) {
    return 'a hybrid';
  }

  if (terms[0] === 'species') {
    return 'species';
  }

  return `a${terms.includes('intergeneric') ? 'n' : ''} ${terms.join(
    ' '
  )} hybrid`;
};
