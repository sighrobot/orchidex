import { Grex } from 'lib/types';
import Link from 'next/link';

import styles from './style.module.scss';

type RegProps = {
  activeId?: string;
  grex?: Grex;
  hideDate: boolean;
  hideLink?: boolean;
};

export const Reg = ({ grex, activeId, hideDate, hideLink }: RegProps) => {
  if (grex) {
    if (
      !grex.date_of_registration ||
      grex.registrant_name.includes('natural hybrid')
    ) {
      return null;
    }

    const dateStr = grex.date_of_registration
      ? new Date(`${grex.date_of_registration}T00:00:00`)
          .toString()
          .slice(3, 15)
      : 'on unknown date';
    return (
      <span className={styles.reg}>
        {!hideDate &&
          (hideLink ? (
            <span>Registered {dateStr}</span>
          ) : (
            <>
              Registered{' '}
              {/* <Link
                href={`/date/${grex.date_of_registration}`}
                className='date'
              > */}
              {dateStr}
              {/* </Link> */}
            </>
          ))}
        {hideDate ? 'Registered by ' : ' by '}
        {hideLink ? (
          <span>{grex.registrant_name}</span>
        ) : !activeId || activeId !== grex.registrant_name ? (
          <Link
            href={`/registrant/${encodeURIComponent(grex.registrant_name)}`}
          >
            {grex.registrant_name}
          </Link>
        ) : (
          grex.registrant_name
        )}{' '}
        {grex.originator_name !== grex.registrant_name && '('}
        {grex.originator_name !== grex.registrant_name &&
          (activeId !== grex.originator_name ? (
            <Link
              className='originator'
              href={`/registrant/${encodeURIComponent(grex.originator_name)}`}
            >
              {grex.originator_name}
            </Link>
          ) : (
            grex.originator_name
          ))}
        {grex.originator_name !== grex.registrant_name && ')'}
      </span>
    );
  }

  return null;
};
