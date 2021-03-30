import { Pill } from "components/pill";
import { CROSS_CHAR } from "lib/string";

export const Pills = ({ grex }) => {
  const pills = [];

  const isIntergeneric = grex.seed_parent_genus !== grex.pollen_parent_genus;
  const isNaturalHybrid =
    grex.epithet[0] === CROSS_CHAR ||
    (grex.seed_parent_epithet &&
      grex.pollen_parent_epithet &&
      grex.registrant_name === "This is a natural hybrid");
  const isSpecies =
    !isNaturalHybrid &&
    grex.epithet &&
    grex.epithet[0] === grex.epithet[0].toLowerCase();
  const isPrimaryHybrid =
    !isNaturalHybrid &&
    grex.seed_parent_epithet &&
    grex.seed_parent_epithet[0] === grex.seed_parent_epithet[0].toLowerCase() &&
    grex.pollen_parent_epithet &&
    grex.pollen_parent_epithet[0] ===
      grex.pollen_parent_epithet[0].toLowerCase();

  if (isSpecies) {
    pills.push("species");
  }

  if (isIntergeneric) {
    pills.push("intergeneric");
  }

  if (isPrimaryHybrid) {
    pills.push("primary");
  }

  if (isNaturalHybrid) {
    pills.push("natural");
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
