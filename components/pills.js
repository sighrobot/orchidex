import { Pill } from "components/pill";
import { CROSS_CHAR, UNKNOWN_CHAR } from "lib/string";

export const Pills = ({ grex }) => {
  const pills = [];

  const hasParents = grex.seed_parent_epithet && grex.pollen_parent_epithet;

  const isParentNaturalHybrid =
    grex.seed_parent_epithet[0] === UNKNOWN_CHAR ||
    grex.pollen_parent_epithet[0] === UNKNOWN_CHAR;

  const isIntergeneric = grex.seed_parent_genus !== grex.pollen_parent_genus;

  const isNaturalHybrid =
    grex.epithet[0] === CROSS_CHAR ||
    (hasParents && grex.registrant_name === "This is a natural hybrid") ||
    (hasParents &&
      !isParentNaturalHybrid &&
      grex.epithet &&
      grex.epithet[0] == grex.epithet[0].toLowerCase());

  const isSpecies =
    !isParentNaturalHybrid &&
    !isNaturalHybrid &&
    grex.epithet &&
    grex.epithet[0] === grex.epithet[0].toLowerCase();

  const isPrimaryHybrid =
    !isParentNaturalHybrid &&
    !isNaturalHybrid &&
    grex.seed_parent_epithet &&
    grex.seed_parent_epithet[0] === grex.seed_parent_epithet[0].toLowerCase() &&
    grex.pollen_parent_epithet &&
    grex.pollen_parent_epithet[0] ===
      grex.pollen_parent_epithet[0].toLowerCase();

  if (isSpecies) {
    pills.push("species");
  }

  if (isNaturalHybrid) {
    pills.push("natural");
  }

  if (isIntergeneric) {
    pills.push("intergeneric");
  }

  if (isPrimaryHybrid) {
    pills.push("primary");
  }

  if (pills.length === 0) {
    return null;
  }

  return (
    <div className="pills">
      {pills.map((p) => (
        <Pill key={p} type={p} />
      ))}
    </div>
  );
};
