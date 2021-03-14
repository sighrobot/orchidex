import { abbreviateGenus, abbreviateName } from "lib/utils";
import Link from "next/link";

export const Name = ({
  grex,
  link = true,
  linkAsSearch = false,
  shouldAbbreviate = false,
}) => {
  if (grex) {
    const href = linkAsSearch
      ? `/?genus=${grex.genus}&epithet=${grex.epithet}`
      : `/grex/${grex.id}`;

    const content = (
      <>
        <em>{shouldAbbreviate ? abbreviateGenus(grex.genus) : grex.genus}</em>{" "}
        {(shouldAbbreviate
          ? grex.epithet.replace("Memoria ", "Mem. ")
          : grex.epithet) || "(?)"}
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
