import { getDescriptor } from 'components/pills/pills';
import { GENUS_TO_ABBREVIATION } from './abbreviations';
import type { Grex } from './types';

// https://bytes.grubhub.com/disabling-safari-autofill-for-a-single-line-address-input-b83137b5b1c7
export const INPUT_NAME_SUFFIX = '__search__';

export const UNKNOWN_CHAR = String.fromCharCode(65533); // �
export const CROSS_CHAR = '×';

export const normalize = (s = '') =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const abbreviateGenus = ({ genus } = { genus: '' }) =>
  GENUS_TO_ABBREVIATION[genus] || genus;
const abbreviateEpithet = ({ epithet } = { epithet: '' }) => {
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
  { epithet } = { epithet: '' }
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

  const nameShort = formatName({ genus, epithet }).long.full;

  if (seed_parent_genus && pollen_parent_genus) {
    const seedNameShort = formatName({
      genus: seed_parent_genus,
      epithet: seed_parent_epithet ?? '',
    }).short.full;
    const pollenNameShort = formatName({
      genus: pollen_parent_genus,
      epithet: pollen_parent_epithet ?? '',
    }).short.full;
    const crossString = `${seedNameShort} ${CROSS_CHAR} ${pollenNameShort}`;

    if (date_of_registration) {
      const dateString = `${new Date(date_of_registration)
        .toString()
        .slice(4, 15)}`;

      if (registrant_name) {
        return `${nameShort} (${crossString}) is ${getDescriptor(
          grex
        )} registered by ${registrant_name} on ${dateString}.`;
      }

      return `${nameShort} (${crossString}) is ${getDescriptor(
        grex
      )} registered on ${dateString}.`;
    }

    if (hypothetical) {
      return `Explore the ancestry of ${crossString}.`;
    }

    return `${nameShort} (${crossString}) is ${getDescriptor(grex)}.`;
  }

  return `${nameShort} is an orchid ${getDescriptor(grex)}.`;
};
