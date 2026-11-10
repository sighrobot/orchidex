import cn from 'classnames';

import { RegDate } from 'components/grex/date';
import { Name } from 'components/grex/name';
import { Parentage } from 'components/grex/parentage';
import { LinkPeople } from 'components/link/people';
import Loader from 'components/loader';
import { isSpecies, orderTerms } from 'components/pills/pills';
import type { Grex } from 'lib/types';

import style from './style.module.scss';

type GrexTableProps = {
  className?: string;
  grexes: Grex[];
  isLoading?: boolean;
  numRowsLoading?: number;
  // Hide the date column, e.g. when the list is already grouped by date.
  hideDate?: boolean;
  // The registrant/originator whose page this is: shown as plain text.
  activeRegId?: string;
  // The grex this list is about: not linked when it appears as a parent.
  contextGrex?: Grex;
  renderEmpty?: () => React.ReactNode;
};

export const GrexTable = ({
  className,
  grexes,
  isLoading,
  numRowsLoading = 10,
  hideDate,
  activeRegId,
  contextGrex,
  renderEmpty,
}: GrexTableProps) => {
  if (!isLoading && grexes.length === 0) {
    return <>{renderEmpty?.() ?? null}</>;
  }

  return (
    <table
      className={cn(style.table, className, {
        [style.noDate]: hideDate,
        [style.loading]: isLoading,
      })}
    >
      <thead>
        <tr>
          <th className={style.name}>Name</th>
          <th className={style.parentage}>Parentage</th>
          {!hideDate && <th className={style.date}>Registered</th>}
          <th className={style.people}>Registrant (Originator)</th>
        </tr>
      </thead>
      <tbody>
        {isLoading
          ? Array.from({ length: numRowsLoading }, (_, i) => (
              <LoadingRow hideDate={hideDate} index={i} key={i} />
            ))
          : grexes.map((grex) => (
              <Row
                activeRegId={activeRegId}
                contextGrex={contextGrex}
                grex={grex}
                hideDate={hideDate}
                key={grex.id ?? `${grex.genus} ${grex.epithet}`}
              />
            ))}
      </tbody>
    </table>
  );
};

const Row = ({
  grex,
  hideDate,
  activeRegId,
  contextGrex,
}: {
  grex: Grex;
  hideDate?: boolean;
  activeRegId?: string;
  contextGrex?: Grex;
}) => {
  const isNatural = grex.registrant_name?.includes('natural hybrid');

  return (
    <tr>
      <td className={style.name}>
        <Name className={style.fullName} grex={grex} />
        {/* Phones get the abbreviated genus (e.g. Rlc.), as in parentage. */}
        <Name abbreviate className={style.shortName} grex={grex} />
        <Tags grex={grex} />
      </td>
      <td className={style.parentage}>
        <div className={style.cross}>
          {isSpecies(grex) ? (
            <span className={style.muted}>—</span>
          ) : (
            <Parentage contextGrex={contextGrex} grex={grex} />
          )}
        </div>
      </td>
      {!hideDate && (
        <td className={style.date}>
          {grex.date_of_registration && !isNatural ? (
            <RegDate grex={grex} />
          ) : (
            <span className={style.muted}>—</span>
          )}
        </td>
      )}
      <td className={style.people}>
        {isNatural || !grex.registrant_name ? (
          <span className={style.muted}>—</span>
        ) : (
          <People activeRegId={activeRegId} grex={grex} />
        )}
      </td>
    </tr>
  );
};

const Person = ({
  grex,
  kind,
  activeRegId,
}: {
  grex: Grex;
  kind: 'registrant' | 'originator';
  activeRegId?: string;
}) => {
  const name = grex[`${kind}_name`];

  if (name === 'O/U' || name === activeRegId) {
    return <>{name}</>;
  }

  return <LinkPeople grex={grex} kind={kind} />;
};

const People = ({ grex, activeRegId }: { grex: Grex; activeRegId?: string }) => {
  const showOriginator =
    grex.originator_name && grex.originator_name !== grex.registrant_name;

  return (
    <>
      <Person activeRegId={activeRegId} grex={grex} kind='registrant' />
      {showOriginator && (
        <span className={style.originator}>
          {' '}
          (<Person activeRegId={activeRegId} grex={grex} kind='originator' />)
        </span>
      )}
    </>
  );
};

// Small inline markers in place of the card's pills. Species is left out:
// the empty parentage cell already says it.
const Tags = ({ grex }: { grex: Grex }) => {
  const terms = orderTerms(grex).filter((t) => t !== 'species');

  if (terms.length === 0) return null;

  return (
    <span className={style.tags}>
      {terms.map((t) => (
        <span className={cn(style.tag, style[t])} key={t}>
          {t}
        </span>
      ))}
    </span>
  );
};

const LoadingRow = ({
  index,
  hideDate,
}: {
  index: number;
  hideDate?: boolean;
}) => (
  <tr>
    <td className={style.name}>
      <Loader height={16} index={index} />
    </td>
    <td className={style.parentage}>
      <Loader height={16} index={index} />
    </td>
    {!hideDate && (
      <td className={style.date}>
        <Loader height={16} index={index} />
      </td>
    )}
    <td className={style.people}>
      <Loader height={16} index={index} />
    </td>
  </tr>
);
