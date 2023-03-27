import { normalize } from 'lib/string';
import { NORMALIZED_SEARCH_FIELDS } from 'lib/constants';

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const massageQueryTerm = (s = '', shouldNormalize = false) => {
  const massaged = s.toLowerCase().replace(/'/g, "''");

  return shouldNormalize ? normalize(massaged) : massaged;
};

export const formatClause = (key, value = '') => {
  const lastValueIndex = value.length - 1;
  const shouldNormalize = NORMALIZED_SEARCH_FIELDS.includes(key);
  const left = shouldNormalize ? `${key}_normalized` : `lower(${key})`;

  if (value[0] === '"' && value[lastValueIndex] === '"') {
    const unquoted = value.slice(1, lastValueIndex);

    return `${left} = '${massageQueryTerm(unquoted, shouldNormalize)}'`;
  }

  return `${left} like '%${massageQueryTerm(value, shouldNormalize)}%'`;
};

const makeClause = (subject) => {
  const key = Object.keys(subject)[0];
  const value = subject[key];

  return value ? formatClause(key, value) : null;
};

export const makeCrossQuery = ({ g1, e1, g2, e2 }) => {
  const seedParent1 = [{ seed_parent_genus: g1 }, { seed_parent_epithet: e1 }];
  const seedParent2 = [{ seed_parent_genus: g2 }, { seed_parent_epithet: e2 }];
  const pollenParent1 = [
    { pollen_parent_genus: g1 },
    { pollen_parent_epithet: e1 },
  ];
  const pollenParent2 = [
    { pollen_parent_genus: g2 },
    { pollen_parent_epithet: e2 },
  ];

  const seedParent1Clause = `${seedParent1
    .map(makeClause)
    .filter((c) => c)
    .join(' and ')}`;
  const pollenParent2Clause = `${pollenParent2
    .map(makeClause)
    .filter((c) => c)
    .join(' and ')}`;
  const combo1 = [seedParent1Clause, pollenParent2Clause]
    .filter((c) => c)
    .join(' and ');

  const seedParent2Clause = `${seedParent2
    .map(makeClause)
    .filter((c) => c)
    .join(' and ')}`;
  const pollenParent1Clause = `${pollenParent1
    .map(makeClause)
    .filter((c) => c)
    .join(' and ')}`;
  const combo2 = [seedParent2Clause, pollenParent1Clause]
    .filter((c) => c)
    .join(' and ');

  return [combo1, combo2].join(' or ');
};
