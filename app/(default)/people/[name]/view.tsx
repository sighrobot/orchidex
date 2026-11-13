'use client';

import { track } from '@vercel/analytics';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { orderBy } from 'lodash';
import Link from 'next/link';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Padded } from 'components/container/container';
import { GrexTable, SortDirection } from 'components/grex/table';
import { H2 } from 'components/layout';
import { PeopleList, StatBox } from 'components/stat/stat';
import { searchUrl } from 'lib/search/params';
import { Grex, PersonCount } from 'lib/types';

import { describePerson, summarizePerson } from './summary';

import style from './style.module.scss';

const PAGE_SIZE = 100;

type Role = 'all' | 'registered' | 'originated';

type SortField = 'name' | 'parentage' | 'date' | 'people';

const SORT_LABELS: Record<SortField, string> = {
  name: 'Name',
  parentage: 'Parentage',
  date: 'Registered',
  people: 'Registrant',
};

const SORT_VALUES: Record<SortField, (g: Grex) => string> = {
  name: (g) => `${g.genus} ${g.epithet}`.toLowerCase(),
  parentage: (g) =>
    `${g.seed_parent_genus} ${g.seed_parent_epithet}`.toLowerCase(),
  date: (g) => g.date_of_registration ?? '',
  people: (g) => (g.registrant_name ?? '').toLowerCase(),
};

const inRole = (g: Grex, role: Role, name: string) =>
  role === 'all' ||
  (role === 'registered' && g.registrant_name === name) ||
  (role === 'originated' && g.originator_name === name);

export default function PersonView({
  name,
  grexes,
  parentBreeders,
}: {
  name: string;
  grexes: Grex[];
  parentBreeders: PersonCount[];
}) {
  const summary = React.useMemo(
    () => summarizePerson(name, grexes),
    [name, grexes]
  );

  const [role, setRole] = React.useState<Role>('all');
  const [sort, setSort] = React.useState<{
    key: SortField;
    direction: SortDirection;
  }>({ key: 'date', direction: 'desc' });
  const [numShown, setNumShown] = React.useState(PAGE_SIZE);

  React.useEffect(() => setNumShown(PAGE_SIZE), [role, sort]);

  const rows = React.useMemo(
    () =>
      orderBy(
        grexes.filter((g) => inRole(g, role, name)),
        [SORT_VALUES[sort.key]],
        [sort.direction]
      ),
    [grexes, role, sort, name]
  );

  const handleSort = (key: string) => {
    const field = key as SortField;
    setSort((s) =>
      s.key === field
        ? { key: field, direction: s.direction === 'asc' ? 'desc' : 'asc' }
        : // Dates read best newest first.
          { key: field, direction: field === 'date' ? 'desc' : 'asc' }
    );
    track('Sort person list by field', { field });
  };

  const handleRole = (r: Role) => {
    setRole(r);
    track('Filter person list by role', { role: r });
  };

  // Only worth offering a choice when they've done both, and not every
  // record is both theirs to register and to originate.
  const hasBothRoles =
    summary.registered > 0 &&
    summary.originated > 0 &&
    (summary.registered < summary.total || summary.originated < summary.total);

  const roles: { id: Role; label: string; count: number; title: string }[] = [
    { id: 'all', label: 'All', count: summary.total, title: 'Everything' },
    {
      id: 'registered',
      label: 'Registered',
      count: summary.registered,
      title: `Hybrids ${name} registered with the RHS`,
    },
    {
      id: 'originated',
      label: 'Originated',
      count: summary.originated,
      title: `Hybrids ${name} made the cross for`,
    },
  ];

  // The search page has the rest of the filters (genus, type, dates), but
  // matches one role at a time.
  const searchRole: Exclude<Role, 'all'> | null =
    role !== 'all'
      ? role
      : summary.originated === 0
      ? 'registered'
      : summary.registered === 0
      ? 'originated'
      : null;
  const searchHref =
    searchRole &&
    searchUrl(
      searchRole === 'registered'
        ? { registrant: `"${name}"` }
        : { originator: `"${name}"` },
      { panel: 'advanced' }
    );

  const numLeft = rows.length - numShown;

  return (
    <>
      <Padded className={style.header}>
        <H2>{name}</H2>
        <p className={style.summary}>{describePerson(summary)}</p>
        {summary.topGenera.length > 0 && summary.numGenera > 1 && (
          <p className={style.genera}>
            Mostly{' '}
            {summary.topGenera.map((g, i) => (
              <React.Fragment key={g.name}>
                {i > 0 && (i === summary.topGenera.length - 1 ? ' and ' : ', ')}
                <Link href={`/${g.name.toLowerCase()}`} prefetch={false}>
                  <em>{g.name}</em>
                </Link>{' '}
                <span className={style.muted}>
                  ({g.count.toLocaleString()})
                </span>
              </React.Fragment>
            ))}
          </p>
        )}
      </Padded>

      <Padded className={style.columns}>
        <section className={style.list}>
          <div className={style.toolbar}>
            {hasBothRoles ? (
              <div aria-label='Role' className={style.roles} role='group'>
                {roles.map((r) => (
                  <button
                    aria-pressed={role === r.id}
                    className={style.chip}
                    key={r.id}
                    onClick={() => handleRole(r.id)}
                    title={r.title}
                    type='button'
                  >
                    {r.label}{' '}
                    <span className={style.chipCount}>
                      {r.count.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={style.count}>
                {rows.length.toLocaleString()}{' '}
                {rows.length === 1 ? 'hybrid' : 'hybrids'}
              </p>
            )}

            {/* In narrow spaces the table hides its headers, so sort here. */}
            <div className={style.mobileSort}>
              <span className={style.selectWrap}>
                <select
                  aria-label='Sort'
                  onChange={(e) => handleSort(e.target.value)}
                  value={sort.key}
                >
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className={style.selectIcon}
                  size={14}
                />
              </span>
              <button
                aria-label={
                  sort.direction === 'asc'
                    ? 'Sort descending'
                    : 'Sort ascending'
                }
                className={style.chip}
                onClick={() => handleSort(sort.key)}
                type='button'
              >
                {sort.direction === 'asc' ? (
                  <ArrowUp aria-hidden size={14} />
                ) : (
                  <ArrowDown aria-hidden size={14} />
                )}
              </button>
            </div>

            {searchHref && (
              <Link
                className={style.searchLink}
                href={searchHref}
                prefetch={false}
              >
                Filter in search →
              </Link>
            )}
          </div>

          <GrexTable
            activeRegId={name}
            grexes={rows.slice(0, numShown)}
            onSort={handleSort}
            sort={sort}
            sortKeys={{
              name: 'name',
              parentage: 'parentage',
              date: 'date',
              people: 'people',
            }}
          />

          {numLeft > 0 && (
            <div className={style.more}>
              <Button
                className='cursor-pointer'
                onClick={() => setNumShown((n) => n + PAGE_SIZE)}
                variant='outline'
              >
                Show more ({numLeft.toLocaleString()} left)
              </Button>
            </div>
          )}
        </section>

        {(summary.collaborators.length > 0 || parentBreeders.length > 0) && (
          <aside className={style.sidebar}>
            {summary.collaborators.length > 0 && (
              <StatBox heading='Works with'>
                <p className={style.statNote}>
                  Originators of what {name} registered, and registrants of
                  what they originated.
                </p>
                <PeopleList data={summary.collaborators} />
              </StatBox>
            )}
            {parentBreeders.length > 0 && (
              <StatBox heading='Builds on hybrids by'>
                <p className={style.statNote}>
                  Originators of the parents {name} crossed most often.
                </p>
                <PeopleList data={parentBreeders} />
              </StatBox>
            )}
          </aside>
        )}
      </Padded>
    </>
  );
}
