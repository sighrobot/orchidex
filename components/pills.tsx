import { Pill } from "components/pill";
import { CROSS_CHAR, UNKNOWN_CHAR } from "lib/string";
import { Grex } from "lib/types";

const hasParents = (grex: Grex) =>
  grex.seed_parent_epithet && grex.pollen_parent_epithet;

const isParentNaturalHybrid = (grex: Grex) =>
  grex.seed_parent_epithet?.[0] === UNKNOWN_CHAR ||
  grex.pollen_parent_epithet?.[0] === UNKNOWN_CHAR;

const isNaturalHybrid = (grex: Grex) =>
  grex.epithet?.[0] === CROSS_CHAR ||
  (hasParents(grex) && grex.registrant_name === "This is a natural hybrid") ||
  (hasParents(grex) &&
    !isParentNaturalHybrid(grex) &&
    grex.epithet &&
    grex.epithet[0] == grex.epithet[0].toLowerCase());

export const isSpecies = (grex: Grex) =>
  !isParentNaturalHybrid(grex) &&
  !isNaturalHybrid(grex) &&
  grex.epithet &&
  grex.epithet[0] === grex.epithet[0].toLowerCase();

export const Pills = ({ grex }) => {
  const pills = [];

  if (grex.hypothetical) {
    pills.push("hypothetical");
  }

  const isIntergeneric = grex.seed_parent_genus !== grex.pollen_parent_genus;

  const isPrimaryHybrid =
    !isParentNaturalHybrid(grex) &&
    !isNaturalHybrid(grex) &&
    grex.seed_parent_epithet &&
    grex.seed_parent_epithet[0] === grex.seed_parent_epithet[0].toLowerCase() &&
    grex.pollen_parent_epithet &&
    grex.pollen_parent_epithet[0] ===
      grex.pollen_parent_epithet[0].toLowerCase();

  if (isSpecies(grex)) {
    pills.push("species");
  }

  if (isNaturalHybrid(grex)) {
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
