import type { Grex } from './types';
import { GENUS_TO_ABBREVIATION } from './abbreviations';
import { getDescriptor, orderTerms } from 'components/pills/pills';

// https://bytes.grubhub.com/disabling-safari-autofill-for-a-single-line-address-input-b83137b5b1c7
export const INPUT_NAME_SUFFIX = '__search__';

export const UNKNOWN_CHAR = String.fromCharCode(65533); // �
export const CROSS_CHAR = '×';

export const normalize = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const abbreviateGenus = ({ genus } = { genus: '' }) =>
  GENUS_TO_ABBREVIATION[genus] || genus;
export const abbreviateEpithet = ({ epithet } = { epithet: '' }) => {
  return epithet.replace('Memoria ', 'Mem. ');
};

export const formatName = (grex: Pick<Grex, 'genus' | 'epithet'>) => {
  return {
    long: {
      genus: grex?.genus,
      epithet: grex?.epithet,
      full: `${grex?.genus} ${grex?.epithet}`,
    },
    short: {
      genus: abbreviateGenus(grex),
      epithet: abbreviateEpithet(grex),
      full: `${abbreviateGenus(grex)} ${abbreviateEpithet(grex)}`,
    },
  };
};

export const repairMalformedNaturalHybridEpithet = (
  { epithet } = { epithet: '' },
) => {
  const i = epithet.indexOf(UNKNOWN_CHAR);

  if (i >= 0) {
    const first = epithet[i + 1];

    if (first === ' ') {
      const second = epithet[i + 2];

      if (typeof second === 'string' && second === second.toLowerCase()) {
        return epithet.replace(UNKNOWN_CHAR, '×');
      }
    }
  }

  return epithet;
};

export const description = (grex: Grex) => {
  const {
    genus,
    epithet,
    seed_parent_genus,
    seed_parent_epithet,
    pollen_parent_genus,
    pollen_parent_epithet,
    date_of_registration,
    registrant_name,
    hypothetical,
  } = grex;
  const crossString = `${abbreviateGenus({
    genus: seed_parent_genus,
  })} ${seed_parent_epithet} ${CROSS_CHAR} ${abbreviateGenus({
    genus: pollen_parent_genus,
  })} ${pollen_parent_epithet}`;

  if (hypothetical) {
    return `${crossString} is ${getDescriptor(grex)}.`;
  }

  const dateString = `${new Date(date_of_registration)
    .toString()
    .slice(4, 15)}`;

  if (seed_parent_genus && pollen_parent_genus) {
    if (date_of_registration) {
      if (registrant_name) {
        return `${genus} ${epithet} (${crossString}) is ${getDescriptor(
          grex,
        )} registered by ${registrant_name} on ${dateString}.`;
      }

      return `${genus} ${epithet} (${crossString}) is ${getDescriptor(
        grex,
      )} registered on ${dateString}.`;
    }

    return `${genus} ${epithet} (${crossString}) is ${getDescriptor(grex)}.`;
  }

  return `${genus} ${epithet} is an orchid ${getDescriptor(grex)}.`;
};
