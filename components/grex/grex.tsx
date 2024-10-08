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
  emphasize?: boolean;
  contextGrex?: Grex;
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
  emphasize,
  contextGrex,
}: GrexProps) => {
  return (
    <article
      className={cn(styles.grex, {
        [styles.grexHeading]: heading,
        [styles.emphasize]: emphasize,
      })}
    >
      <Pills grex={grex} />
      {!hideName && (
        <div style={{ marginTop: '5px' }}>
          <Name
            as='h2'
            link={emphasize || (!hideLink && !hideLinks)}
            grex={grex}
          />
        </div>
      )}
      <Parentage
        hideLink={hideLinks}
        grex={grex}
        seedParent={seedParent}
        pollenParent={pollenParent}
        contextGrex={contextGrex}
      />
      <Reg
        activeId={activeRegId}
        grex={grex}
        hideLink={hideLinks}
        hideDate={hideDate}
      />

      {grex.first_order_progeny_count !== undefined && (
        <aside className={styles.progeny}>
          <span>{grex.first_order_progeny_count.toLocaleString()}</span>
          &nbsp;progeny
        </aside>
      )}
    </article>
  );
};
