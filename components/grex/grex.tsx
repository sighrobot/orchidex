import cn from 'classnames';
import { Name } from 'components/name/name';
import { Parentage } from 'components/parentage/parentage';
import { Pills } from 'components/pills/pills';
import { Reg } from 'components/reg/reg';
import styles from './style.module.scss';
import type { Grex } from 'lib/types';

type GrexProps = {
  grex: Grex;
  seedParent?: Grex;
  pollenParent?: Grex;
  hideDate?: boolean;
  hideLink?: boolean;
  hideName?: boolean;
  heading?: boolean;
  activeRegId?: string;
  hideLinks?: boolean;
};

export const GrexCard = ({
  grex,
  seedParent,
  pollenParent,
  hideDate = false,
  hideLink,
  hideLinks,
  hideName,
  heading = false,
  activeRegId,
}: GrexProps) => {
  return (
    <article
      className={cn(styles.grex, {
        [styles.grexHeading]: heading,
      })}
    >
      <Pills grex={grex} />
      {!hideName && (
        <div style={{ marginTop: '5px' }}>
          <Name as='h2' link={!hideLink && !hideLinks} grex={grex} />
        </div>
      )}
      <Parentage
        hideLink={hideLinks}
        grex={grex}
        seedParent={seedParent}
        pollenParent={pollenParent}
      />

      <Reg
        activeId={activeRegId}
        grex={grex}
        hideLink={hideLinks}
        hideDate={hideDate}
      />
    </article>
  );
};
