import Link from "next/link";

export const Reg = ({ grex }) => {
  if (grex) {
    if (
      !grex.date_of_registration ||
      grex.registrant_name.includes("natural hybrid")
    ) {
      return null;
    }

    const dateStr = grex.date_of_registration
      ? new Date(`${grex.date_of_registration}T00:00:00`)
          .toString()
          .slice(3, 15)
      : "on unknown date";
    return (
      <span className="reg">
        Registered{" "}
        <Link href={`/date/${grex.date_of_registration}`}>
          <a className="date">{dateStr}</a>
        </Link>{" "}
        by {grex.registrant_name} ({grex.originator_name})
      </span>
    );
  }

  return null;
};
