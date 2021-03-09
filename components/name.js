import Link from "next/link";

export const Name = ({ grex, link = true, linkAsSearch = false }) => {
  if (grex) {
    const href = linkAsSearch
      ? `/?genus=${grex.genus}&epithet=${grex.epithet}`
      : `/grex/${grex.id}`;

    const content = (
      <>
        <em>{grex.genus}</em> {grex.epithet || "(?)"}
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
