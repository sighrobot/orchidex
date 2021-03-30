import { Name } from "components/name";

export const Parentage = ({ grex, shouldAbbreviateParentage = true }) => {
  if (grex) {
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

  return null;
};
