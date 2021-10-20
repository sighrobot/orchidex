import { Grex } from "lib/types";
import Link from "next/link";

type RegProps = {
  grex?: Grex;
  hideDate: boolean;
  hideLink?: boolean;
};

export const Reg = ({ grex, hideDate, hideLink }: RegProps) => {
  if (grex) {
    if (
      !grex.date_of_registration ||
      grex.registrant_name.includes("natural hybrid")
    ) {
      return null;
    }

    const LinkComponent = hideLink ? "span" : Link;

    const dateStr = grex.date_of_registration
      ? new Date(`${grex.date_of_registration}T00:00:00`)
          .toString()
          .slice(3, 15)
      : "on unknown date";
    return (
      <span className="reg">
        Registered{" "}
        {!hideDate && (
          <LinkComponent href={`/date/${grex.date_of_registration}`}>
            <a className="date">{dateStr}</a>
          </LinkComponent>
        )}{" "}
        by{" "}
        <LinkComponent href={`/registrant/${grex.registrant_name}`}>
          <a>{grex.registrant_name}</a>
        </LinkComponent>{" "}
        {grex.originator_name !== grex.registrant_name &&
          `(${grex.originator_name})`}
      </span>
    );
  }

  return null;
};
