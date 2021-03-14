import { Name } from "components/name";

export const Parentage = ({ grex, shouldAbbreviateParentage = false }) => {
  if (grex) {
    if (grex.registrant_name.includes("natural hybrid")) {
      return <span className="parentage">Natural hybrid</span>;
    }

    const {
      seed_parent_genus,
      seed_parent_epithet,
      pollen_parent_genus,
      pollen_parent_epithet,
    } = grex;

    if (
      seed_parent_genus &&
      seed_parent_epithet &&
      pollen_parent_genus &&
      pollen_parent_epithet
    ) {
      return (
        <span className="parentage">
          <Name
            shouldAbbreviate={shouldAbbreviateParentage}
            linkAsSearch
            grex={{ genus: seed_parent_genus, epithet: seed_parent_epithet }}
          />{" "}
          &times;{" "}
          <Name
            shouldAbbreviate={shouldAbbreviateParentage}
            linkAsSearch
            grex={{
              genus: pollen_parent_genus,
              epithet: pollen_parent_epithet,
            }}
          />
        </span>
      );
    }
  }

  return <span className="parentage">Unknown parentage</span>;
};
