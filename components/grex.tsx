import { Name } from "components/name";
import { Parentage } from "components/parentage";
import { Pills } from "components/pills";
import { Reg } from "components/reg";
import type { Grex } from "lib/types";

type GrexProps = {
  asButton?: boolean;
  grex: Grex;
  hideDate?: boolean;
  hideReg?: boolean;
  hideLink?: boolean;
  heading?: boolean;
  onClick?: (grex: Grex) => void;
};

export const GrexCard = ({
  asButton,
  grex,
  hideDate,
  hideReg,
  hideLink,
  heading = false,
  onClick,
}: GrexProps) => {
  const shouldRenderAsButton = asButton && !!onClick;
  const Component: keyof JSX.IntrinsicElements = shouldRenderAsButton
    ? "button"
    : "article";
  const handleClick = shouldRenderAsButton ? () => onClick(grex) : undefined;

  return (
    <Component
      className={heading ? "heading grex" : "grex"}
      onClick={handleClick}
    >
      <Pills grex={grex} />
      <Name link={!shouldRenderAsButton && !hideLink} grex={grex} />
      <br />
      <Parentage hideLink={shouldRenderAsButton} grex={grex} />
      <br />
      {!hideReg && (
        <Reg grex={grex} hideLink={shouldRenderAsButton} hideDate={hideDate} />
      )}
    </Component>
  );
};
