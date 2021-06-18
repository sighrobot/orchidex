import {
  formatName,
  repairMalformedNaturalHybridEpithet,
  UNKNOWN_CHAR,
} from "lib/string";
import { Grex } from "lib/types";
import Link from "next/link";

type NameProps = {
  grex?: {
    id?: Grex["id"];
    genus: Grex["genus"];
    epithet: Grex["epithet"];
  };
  link?: boolean;
  linkAsSearch?: boolean;
  shouldAbbreviate?: boolean;
};

export const Name = ({
  grex,
  link = true,
  linkAsSearch = false,
  shouldAbbreviate = false,
}: NameProps) => {
  if (grex) {
    const epithet = repairMalformedNaturalHybridEpithet(grex);

    const href = linkAsSearch
      ? `/?genus="${grex.genus}"&epithet="${epithet.replace(
          new RegExp(UNKNOWN_CHAR, "g"),
          "_"
        )}"`
      : `/grex/${grex.id}`;

    const formattedName = formatName(grex, {
      shortenGenus: shouldAbbreviate,
      shortenEpithet: shouldAbbreviate,
    });

    const isSpecies =
      formattedName.epithet &&
      formattedName.epithet[0] === formattedName.epithet[0].toLowerCase();

    const content = (
      <>
        <em>{formattedName.genus}</em>{" "}
        {isSpecies ? (
          <em>{formattedName.epithet}</em>
        ) : (
          formattedName.epithet || "(?)"
        )}
      </>
    );
    return (
      <span className="name">
        {link ? (
          <Link href={href}>
            <a>{content}</a>
          </Link>
        ) : (
          content
        )}
      </span>
    );
  }

  return null;
};