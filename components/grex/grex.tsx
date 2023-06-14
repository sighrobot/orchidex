import { Name } from 'components/name/name';
import { Parentage } from 'components/parentage/parentage';
import { Pills } from 'components/pills/pills';
import { Reg } from 'components/reg/reg';
import type { Grex } from 'lib/types';
import cn from 'classnames';

import styles from './style.module.scss';

type GrexProps = {
  asButton?: boolean;
  grex: Grex;
  seedParent?: Grex;
  pollenParent?: Grex;
  hideDate?: boolean;
  hideReg?: boolean;
  hideLink?: boolean;
  heading?: boolean;
  onClick?: (grex: Grex) => void;
  activeRegId?: string;
};

export const GrexCard = ({
  asButton,
  grex,
  seedParent,
  pollenParent,
  hideDate = false,
  hideReg,
  hideLink,
  heading = false,
  onClick,
  activeRegId,
}: GrexProps) => {
  const shouldRenderAsButton = asButton && !!onClick;
  const Component: keyof JSX.IntrinsicElements = shouldRenderAsButton
    ? 'button'
    : 'article';
  const handleClick = shouldRenderAsButton ? () => onClick(grex) : undefined;

  return (
    <Component
      className={cn(styles.grex, {
        [styles.grexHeading]: heading,
        [styles.grexButton]: shouldRenderAsButton,
      })}
      onClick={handleClick}
    >
      <Pills grex={grex} />
      <Name as='h2' link={!shouldRenderAsButton && !hideLink} grex={grex} />
      <Parentage
        hideLink={shouldRenderAsButton}
        grex={grex}
        seedParent={seedParent}
        pollenParent={pollenParent}
      />
      {!hideReg && (
        <Reg
          activeId={activeRegId}
          grex={grex}
          hideLink={shouldRenderAsButton}
          hideDate={hideDate}
        />
      )}
    </Component>
  );
};
