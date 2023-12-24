import { Grex } from 'lib/types';
import { LinkPeople } from 'components/link';

import styles from './style.module.scss';

type RegProps = {
  activeId?: string;
  grex?: Grex;
  hideDate: boolean;
  hideLink?: boolean;
};

export const Reg = ({ grex, activeId, hideDate, hideLink }: RegProps) => {
  if (
    !grex ||
    !grex.date_of_registration ||
    grex.registrant_name.includes('natural hybrid')
  ) {
    return null;
  }

  const isRegistrantOU = grex.registrant_name === 'O/U';
  const isOriginatorOU = grex.originator_name === 'O/U';

  const dateStr = new Date(`${grex.date_of_registration}T00:00:00`)
    .toString()
    .slice(3, 15);

  const isOriginatorSame = grex.originator_name === grex.registrant_name;

  const originatorContent = isOriginatorSame ? null : activeId ===
      grex.originator_name ||
    hideLink ||
    isOriginatorOU ? (
    grex.originator_name
  ) : (
    <LinkPeople grex={grex} kind='originator' />
  );

  return (
    <span className={styles.reg}>
      {!hideDate && dateStr}
      {hideDate ? '' : ' • '}
      {hideLink || activeId === grex.registrant_name || isRegistrantOU ? (
        grex.registrant_name
      ) : (
        <LinkPeople grex={grex} kind='registrant' />
      )}{' '}
      {originatorContent && <>({originatorContent})</>}
    </span>
  );
};
