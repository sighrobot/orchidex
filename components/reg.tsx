import { Grex } from "lib/types";
import Link from "next/link";

type RegProps = {
  grex?: Grex;
  hideDate: boolean;
};

export const Reg = ({ grex, hideDate }: RegProps) => {
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
        {!hideDate && (
          <Link href={`/date/${grex.date_of_registration}`}>
            <a className="date">{dateStr}</a>
          </Link>
        )}{" "}
        by{" "}
        <Link href={`/registrant/${grex.registrant_name}`}>
          <a>{grex.registrant_name}</a>
        </Link>{" "}
        {grex.originator_name !== grex.registrant_name &&
          `(${grex.originator_name})`}
      </span>
    );
  }

  return null;
};
