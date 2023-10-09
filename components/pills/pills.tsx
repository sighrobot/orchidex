import { Pill, PillStates } from 'components/pills/pill';
import { CROSS_CHAR, UNKNOWN_CHAR } from 'lib/string';
import { Grex } from 'lib/types';
import styles from './pills.module.scss';

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

export const isPrimary = (grex) =>
  !isParentNaturalHybrid(grex) &&
  !isNaturalHybrid(grex) &&
  grex.seed_parent_epithet &&
  grex.seed_parent_epithet[0] === grex.seed_parent_epithet[0].toLowerCase() &&
  grex.pollen_parent_epithet &&
  grex.pollen_parent_epithet[0] === grex.pollen_parent_epithet[0].toLowerCase();

export const isIntergeneric = (grex) =>
  grex.seed_parent_genus !== grex.pollen_parent_genus;

export const orderTerms = (grex) => {
  const terms: PillStates[] = [];

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

export const Pills = ({ grex }) => {
  const pills = orderTerms(grex);

  if (pills.length === 0) {
    return null;
  }

  return (
    <div className={styles.pills}>
      <Pill types={pills} />
    </div>
  );
};
