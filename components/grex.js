import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { Pills } from "components/pills";
import { Reg } from "components/reg";

export const Grex = ({
  grex,
  hideDate,
  hideReg,
  hideLink,
  heading = false,
}) => {
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
