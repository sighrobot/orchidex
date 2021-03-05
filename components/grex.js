import { Name } from "./name";
import { Parentage } from "./parentage";
import { Reg } from "./reg";

export const Grex = ({ grex, hideDate, hideReg }) => {
  return (
    <article>
      <Name grex={grex} />
      <br />
      <Parentage grex={grex} />
      <br />
      {!hideReg && <Reg grex={grex} hideDate={hideDate} />}
    </article>
  );
};
