import { Pill } from "components/pill";

export const Pills = ({ grex }) => {
  const pills = [];

  if (
    grex.seed_parent_epithet &&
    grex.seed_parent_epithet[0] === grex.seed_parent_epithet[0].toLowerCase() &&
    grex.pollen_parent_epithet &&
    grex.pollen_parent_epithet[0] ===
      grex.pollen_parent_epithet[0].toLowerCase()
  ) {
    pills.push("primary");
  }

  if (grex.seed_parent_genus !== grex.pollen_parent_genus) {
    pills.push("intergeneric");
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
