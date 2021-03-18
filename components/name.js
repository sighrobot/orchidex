import {
  formatName,
  repairMalformedNaturalHybridEpithet,
  UNKNOWN_CHAR,
} from "lib/string";
import Link from "next/link";

export const Name = ({
  grex,
  link = true,
  linkAsSearch = false,
  shouldAbbreviate = false,
}) => {
  if (grex) {
    const epithet = repairMalformedNaturalHybridEpithet(grex);

    const href = linkAsSearch
      ? `/?genus=${grex.genus}&epithet=${epithet.replace(
          new RegExp(UNKNOWN_CHAR, "g"),
          "_"
        )}`
      : `/grex/${grex.id}`;

    const formattedName = formatName(grex, {
      shortenGenus: shouldAbbreviate,
      shortenEpithet: shouldAbbreviate,
    });

    const content = (
      <>
        <em>{formattedName.genus}</em> {formattedName.epithet || "(?)"}
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
