import { UNKNOWN_CHAR } from "lib/constants";
import { abbreviateGenus, abbreviateName, processEpithet } from "lib/utils";
import Link from "next/link";

export const Name = ({
  grex,
  link = true,
  linkAsSearch = false,
  shouldAbbreviate = false,
}) => {
  if (grex) {
    const epithet = processEpithet(grex.epithet);

    const href = linkAsSearch
      ? `/?genus=${grex.genus}&epithet=${epithet.replace(
          new RegExp(UNKNOWN_CHAR, "g"),
          "_"
        )}`
      : `/grex/${grex.id}`;

    const content = (
      <>
        <em>{shouldAbbreviate ? abbreviateGenus(grex.genus) : grex.genus}</em>{" "}
        {(shouldAbbreviate ? epithet.replace("Memoria ", "Mem. ") : epithet) ||
          "(?)"}
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
