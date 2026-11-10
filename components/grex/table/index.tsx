import cn from 'classnames';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { RegDate } from 'components/grex/date';
import { Name } from 'components/grex/name';
import { Parentage } from 'components/grex/parentage';
import { LinkPeople } from 'components/link/people';
import Loader from 'components/loader';
import { isSpecies, orderTerms } from 'components/pills/pills';
import type { Grex } from 'lib/types';

import style from './style.module.scss';

export type SortDirection = 'asc' | 'desc';
export type GrexTableSort = { key: string; direction: SortDirection };

type BaseColumn = 'name' | 'parentage' | 'date' | 'people';

// An extra column for a particular list, e.g. generation or progeny count.
// In the compact layout they move to a third line: a `start` column on its
// left, an `end` column on its right (followed by `mobileLabel`). Use at most
// one of each.
export type GrexTableColumn<G extends Grex> = {
  key: string;
  label: string;
  position: 'start' | 'end';
  render: (grex: G) => React.ReactNode;
  className?: string;
  numeric?: boolean;
  sortKey?: string;
  mobileLabel?: string;
};

type GrexTableProps<G extends Grex> = {
  className?: string;
  grexes: G[];
  isLoading?: boolean;
  numRowsLoading?: number;
  // Hide the date column, e.g. when the list is already grouped by date.
  hideDate?: boolean;
  // The registrant/originator whose page this is: shown as plain text.
  activeRegId?: string;
  // The grex this list is about: not linked when it appears as a parent.
  contextGrex?: Grex;
  columns?: GrexTableColumn<G>[];
  // Clickable headers. Only columns given a sort key here (or a `sortKey`,
  // for extra columns) can be sorted.
  sortKeys?: Partial<Record<BaseColumn, string>>;
  sort?: GrexTableSort;
  onSort?: (key: string) => void;
  renderEmpty?: () => React.ReactNode;
};

export function GrexTable<G extends Grex>({
  className,
  grexes,
  isLoading,
  numRowsLoading = 10,
  hideDate,
  activeRegId,
  contextGrex,
  columns = [],
  sortKeys = {},
  sort,
  onSort,
  renderEmpty,
}: GrexTableProps<G>) {
  if (!isLoading && grexes.length === 0) {
    return <>{renderEmpty?.() ?? null}</>;
  }

  const start = columns.filter((c) => c.position === 'start');
  const end = columns.filter((c) => c.position === 'end');

  const header = (
    key: string,
    label: string,
    className: string,
    sortKey?: string,
    numeric?: boolean,
  ) => (
    <HeaderCell
      className={cn(className, numeric && style.numeric)}
      key={key}
      label={label}
      onSort={onSort}
      sort={sort}
      sortKey={sortKey}
    />
  );

  // The wrapper is a size container: the table switches to its compact
  // layout based on its own width, not the screen's (e.g. beside a sidebar).
  return (
    <div className={cn(style.wrap, className)}>
      <table
        className={cn(style.table, {
          [style.noDate]: hideDate,
          [style.hasStart]: start.length > 0,
          [style.loading]: isLoading,
        })}
      >
        <thead>
          <tr>
            {start.map((c) =>
              header(
                c.key,
                c.label,
                cn(style.start, c.className),
                c.sortKey,
                c.numeric,
              ),
            )}
            {header('name', 'Name', style.name, sortKeys.name)}
            {header(
              'parentage',
              'Parentage',
              style.parentage,
              sortKeys.parentage,
            )}
            {!hideDate &&
              header('date', 'Registered', style.date, sortKeys.date)}
            {header(
              'people',
              'Registrant (Originator)',
              style.people,
              sortKeys.people,
            )}
            {end.map((c) =>
              header(
                c.key,
                c.label,
                cn(style.end, c.className),
                c.sortKey,
                c.numeric,
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: numRowsLoading }, (_, i) => (
                <tr key={i}>
                  {start.map((c) => (
                    <td className={cn(style.start, c.className)} key={c.key} />
                  ))}
                  <LoadingCells hideDate={hideDate} index={i} />
                  {end.map((c) => (
                    <td className={cn(style.end, c.className)} key={c.key} />
                  ))}
                </tr>
              ))
            : grexes.map((grex) => (
                <tr key={grex.id ?? `${grex.genus} ${grex.epithet}`}>
                  {start.map((c) => (
                    <td
                      className={cn(
                        style.start,
                        c.numeric && style.numeric,
                        c.className,
                      )}
                      key={c.key}
                    >
                      {c.render(grex)}
                    </td>
                  ))}
                  <BaseCells
                    activeRegId={activeRegId}
                    contextGrex={contextGrex}
                    grex={grex}
                    hideDate={hideDate}
                  />
                  {end.map((c) => (
                    <td
                      className={cn(
                        style.end,
                        c.numeric && style.numeric,
                        c.className,
                      )}
                      data-label={c.mobileLabel}
                      key={c.key}
                    >
                      {c.render(grex)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

const HeaderCell = ({
  className,
  label,
  sortKey,
  sort,
  onSort,
}: {
  className: string;
  label: string;
  sortKey?: string;
  sort?: GrexTableSort;
  onSort?: (key: string) => void;
}) => {
  if (!sortKey || !onSort) {
    return <th className={className}>{label}</th>;
  }

  const isActive = sort?.key === sortKey;
  const Arrow = isActive && sort.direction === 'desc' ? ArrowDown : ArrowUp;

  return (
    <th
      aria-sort={
        isActive
          ? sort.direction === 'asc'
            ? 'ascending'
            : 'descending'
          : undefined
      }
      className={className}
    >
      <button
        className={cn(style.sortButton, isActive && style.sortActive)}
        onClick={() => onSort(sortKey)}
        type='button'
      >
        {label}
        <Arrow aria-hidden className={style.sortArrow} size={11} />
      </button>
    </th>
  );
};

const BaseCells = ({
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
    <>
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
    </>
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

const People = ({
  grex,
  activeRegId,
}: {
  grex: Grex;
  activeRegId?: string;
}) => {
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

const LoadingCells = ({
  index,
  hideDate,
}: {
  index: number;
  hideDate?: boolean;
}) => (
  <>
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
  </>
);
