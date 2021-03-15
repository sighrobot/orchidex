import { UNKNOWN_CHAR } from "./constants";

const abbreviations = require("./abbreviations.json");

export const abbreviateGenus = (genus = "") => abbreviations[genus] || genus;

export const abbreviateName = (grex = { genus: "", epithet: "" }) =>
  `${abbreviateGenus(grex.genus)} ${grex.epithet.replace("Memoria ", "Mem. ")}`;

export const processEpithet = (epithet = "") => {
  const i = epithet.indexOf(UNKNOWN_CHAR);

  if (i >= 0) {
    const first = epithet[i + 1];

    if (first === " ") {
      const second = epithet[i + 2];

      if (typeof second === "string" && second === second.toLowerCase()) {
        return epithet.replace(UNKNOWN_CHAR, "×");
      }
    }
  }

  return epithet;
};

export const massageQueryTerm = (s = "") => s.toLowerCase().replace(/'/g, "''");

export const formatClause = (key, value = "") => {
  const lastValueIndex = value.length - 1;

  if (value[0] === '"' && value[lastValueIndex] === '"') {
    const unquoted = value.slice(1, lastValueIndex);

    return `lower(${key}) = '${massageQueryTerm(unquoted)}'`;
  }

  return `lower(${key}) like '%${massageQueryTerm(value)}%'`;
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
    .join(" and ")}`;
  const pollenParent2Clause = `${pollenParent2
    .map(makeClause)
    .filter((c) => c)
    .join(" and ")}`;
  const combo1 = [seedParent1Clause, pollenParent2Clause]
    .filter((c) => c)
    .join(" and ");

  const seedParent2Clause = `${seedParent2
    .map(makeClause)
    .filter((c) => c)
    .join(" and ")}`;
  const pollenParent1Clause = `${pollenParent1
    .map(makeClause)
    .filter((c) => c)
    .join(" and ")}`;
  const combo2 = [seedParent2Clause, pollenParent1Clause]
    .filter((c) => c)
    .join(" and ");

  return [combo1, combo2].join(" or ");
};