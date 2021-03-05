import Link from "next/link";

export const Name = ({ grex, link = true, linkAsSearch = false }) => {
  if (grex) {
    const href = linkAsSearch
      ? `/search?g1=${grex.genus}&e1=${grex.epithet}`
      : `/grex/${grex.id}`;

    const content = (
      <>
        {!grex.epithet && "Unknown "}
        <em>{grex.genus}</em> {grex.epithet}
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
