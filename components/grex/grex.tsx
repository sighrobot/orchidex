import cn from 'classnames';
import { Name } from 'components/name/name';
import { Parentage } from 'components/parentage/parentage';
import { Pills } from 'components/pills/pills';
import { Reg } from 'components/reg/reg';
import styles from './style.module.scss';
import type { Grex } from 'lib/types';

type GrexProps = {
  asButton?: boolean;
  grex: Grex;
  seedParent?: Grex;
  pollenParent?: Grex;
  hideDate?: boolean;
  hideLink?: boolean;
  hideName?: boolean;
  heading?: boolean;
  onClick?: (grex: Grex) => void;
  activeRegId?: string;
  hideLinks?: boolean;
};

export const GrexCard = ({
  asButton,
  grex,
  seedParent,
  pollenParent,
  hideDate = false,
  hideLink,
  hideLinks,
  hideName,
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
      {!hideName && (
        <div style={{ marginTop: '5px' }}>
          <Name
            as='h2'
            link={!shouldRenderAsButton && !hideLink && !hideLinks}
            grex={grex}
          />
        </div>
      )}
      <Parentage
        hideLink={shouldRenderAsButton || hideLinks}
        grex={grex}
        seedParent={seedParent}
        pollenParent={pollenParent}
      />

      <Reg
        activeId={activeRegId}
        grex={grex}
        hideLink={shouldRenderAsButton || hideLinks}
        hideDate={hideDate}
      />
    </Component>
  );
};
