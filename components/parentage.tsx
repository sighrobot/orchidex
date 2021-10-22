import { Name } from "components/name";
import { Grex } from "lib/types";
import { isSpecies } from "./pills";

type ParentageProps = {
  grex?: Grex;
  hideLink?: boolean;
  shouldAbbreviateParentage?: boolean;
};

export const Parentage = ({
  grex,
  hideLink,
  shouldAbbreviateParentage = true,
}: ParentageProps) => {
  if (grex) {
    const {
      seed_parent_genus,
      seed_parent_epithet,
      pollen_parent_genus,
      pollen_parent_epithet,
    } = grex;

    if (isSpecies(grex)) {
      return null;
    }

    return (
      <span className="parentage">
        {seed_parent_genus && seed_parent_epithet ? (
          <Name
            shouldAbbreviate={shouldAbbreviateParentage}
            link={!hideLink}
            linkAsSearch
            grex={{ genus: seed_parent_genus, epithet: seed_parent_epithet }}
          />
        ) : (
          "?"
        )}{" "}
        &times;{" "}
        {pollen_parent_genus && pollen_parent_epithet ? (
          <Name
            shouldAbbreviate={shouldAbbreviateParentage}
            link={!hideLink}
            linkAsSearch
            grex={{
              genus: pollen_parent_genus,
              epithet: pollen_parent_epithet,
            }}
          />
        ) : (
          "?"
        )}
      </span>
    );
  }
};
