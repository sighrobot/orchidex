import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { Pills } from "components/pills";
import { Reg } from "components/reg";
import type { Grex } from "lib/types";

type GrexProps = {
  grex: Grex;
  hideDate?: boolean;
  hideReg?: boolean;
  hideLink?: boolean;
  heading?: boolean;
};

export const GrexCard = ({
  grex,
  hideDate,
  hideReg,
  hideLink,
  heading = false,
}: GrexProps) => {
  return (
    <article className={heading ? "heading" : undefined}>
      <Pills grex={grex} />
      <Name link={!hideLink} grex={grex} />
      <br />
      <Parentage grex={grex} />
      <br />
      {!hideReg && <Reg grex={grex} hideDate={hideDate} />}
    </article>
  );
};
