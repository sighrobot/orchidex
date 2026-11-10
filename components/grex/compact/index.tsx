import cn from 'classnames';

import { RegDate } from 'components/grex/date';
import { Name } from 'components/grex/name';
import { Parentage } from 'components/grex/parentage';
import { LinkPeople } from 'components/link';
import { isSpecies, Pills } from 'components/pills/pills';

import styles from './style.module.scss';
import type { Grex } from 'lib/types';

type GrexCompactProps = {
  className?: string;
  grex: Grex;
  // Off inside dropdown options, where a click should pick the grex.
  links?: boolean;
};

const isRegistered = (grex: Grex) =>
  grex.date_of_registration &&
  !grex.registrant_name?.includes('natural hybrid');

// A small summary of a grex, styled like a scaled-down GrexHeader.
export const GrexCompact = ({
  className,
  grex,
  links = true,
}: GrexCompactProps) => (
  <div className={cn(styles.compact, className)}>
    <div className={styles.titleRow}>
      <span className={styles.name}>
        <Name link={links} grex={grex} />
      </span>
      <Pills grex={grex} />
    </div>

    {!isSpecies(grex) && (
      <div className={styles.line}>
        <Parentage grex={grex} hideLink={!links} />
      </div>
    )}

    {isRegistered(grex) && (
      <div className={styles.meta}>
        <RegDate grex={grex} /> ·{' '}
        {links && grex.registrant_name !== 'O/U' ? (
          <LinkPeople grex={grex} kind='registrant' />
        ) : (
          grex.registrant_name
        )}
      </div>
    )}
  </div>
);
