'use client';

import { track } from '@vercel/analytics';
import cn from 'classnames';
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { orderBy } from 'lodash';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  GrexTable,
  GrexTableColumn,
  SortDirection,
} from 'components/grex/table';
import {
  GrexWithGen,
  useProgenyAll,
  useProgenyDepth,
} from 'lib/hooks/useProgeny';
import { Grex } from 'lib/types';

import style from './style.module.scss';

const PAGE_SIZE = 100;
const MAX_RESULTS = 10000;

type SortField =
  | 'epithet'
  | 'parent_name'
  | 'date_of_registration'
  | 'registrant_name'
  | 'first_order_progeny_count';

const SORT_LABELS: Record<SortField, string> = {
  epithet: 'Name',
  parent_name: 'Other parent',
  date_of_registration: 'Registered',
  registrant_name: 'Registrant',
  first_order_progeny_count: 'Progeny',
};

// How deep a generation is, 0–1, for the generation colours in the styles.
const genDepth = (gen: number, deepest: number) =>
  ({ '--depth': gen / Math.max(1, deepest) } as React.CSSProperties);

// The API counts the grex itself as generation 1, so its children are 2.
// Everything shown here is offset by one: children are generation 1.
const displayGens = (g: GrexWithGen) =>
  g.generations.map((gen) => gen - 1).sort((a, b) => a - b);

export default function ProgenyList({ grex }: { grex: Grex }) {
  const [sort, setSort] = React.useState<{
    key: SortField;
    direction: SortDirection;
  }>({ key: 'epithet', direction: 'asc' });
  const [gens, setGens] = React.useState<Set<number>>(new Set([1]));
  const [numShown, setNumShown] = React.useState(PAGE_SIZE);

  const { data: deepest } = useProgenyDepth(grex);
  const { data: rawData, isLoading } = useProgenyAll(grex, {
    level: Math.max(...Array.from(gens)),
    sortBy: sort.key,
    direction: sort.direction,
  });

  React.useEffect(() => setNumShown(PAGE_SIZE), [gens, sort]);

  const genOptions = React.useMemo(
    () => Array.from({ length: deepest }, (_, i) => i + 1),
    [deepest]
  );
  const allGens = genOptions.every((g) => gens.has(g));

  const rows = React.useMemo(() => {
    const inGens = (rawData ?? []).filter((g) =>
      displayGens(g).some((gen) => gens.has(gen))
    );

    // The API can't sort by "the parent that isn't this grex".
    if (sort.key === 'parent_name') {
      return orderBy(
        inGens,
        (d) =>
          d.seed_parent_epithet === grex.epithet
            ? d.pollen_parent_epithet
            : d.seed_parent_epithet,
        sort.direction
      );
    }

    return inGens;
  }, [rawData, gens, sort, grex]);

  const handleSort = (key: string) => {
    const field = key as SortField;
    setSort((s) =>
      s.key === field
        ? { key: field, direction: s.direction === 'asc' ? 'desc' : 'asc' }
        : {
            key: field,
            // Counts read best biggest first.
            direction: field === 'first_order_progeny_count' ? 'desc' : 'asc',
          }
    );
    track('Sort progeny list by field', { field });
  };

  // Generations toggle independently, but at least one stays on.
  const toggleGen = (gen: number) => {
    setGens((old) => {
      const next = new Set(old);
      if (next.has(gen)) {
        if (next.size > 1) next.delete(gen);
      } else {
        next.add(gen);
      }
      return next;
    });
    track('Filter progeny list by generation', { generation: String(gen) });
  };

  const toggleAll = () => {
    setGens(allGens ? new Set([1]) : new Set(genOptions));
    track('Filter progeny list by generation', { generation: 'all' });
  };

  const columns: GrexTableColumn<GrexWithGen>[] = [
    {
      key: 'gen',
      label: 'Gen',
      position: 'start',
      render: (g) => (
        <span className={style.gens}>
          {displayGens(g).map((gen) => (
            <span
              className={style.gen}
              key={gen}
              style={genDepth(gen, deepest)}
              title={`Generation ${gen}`}
            >
              {gen}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: 'progeny',
      label: 'Progeny',
      position: 'end',
      numeric: true,
      sortKey: 'first_order_progeny_count',
      mobileLabel: 'progeny',
      render: (g) => (
        <span
          className={cn(!g.first_order_progeny_count && style.none)}
          title='Number of hybrids with this as a parent'
        >
          {(g.first_order_progeny_count ?? 0).toLocaleString()}
        </span>
      ),
    },
  ];

  const numLeft = rows.length - numShown;

  return (
    <div className={style.progenyList}>
      <div className={style.toolbar}>
        <p className={style.count}>
          {isLoading
            ? 'Loading progeny…'
            : `${
                rows.length >= MAX_RESULTS
                  ? `${MAX_RESULTS.toLocaleString()}+`
                  : rows.length.toLocaleString()
              } ${rows.length === 1 ? 'descendant' : 'descendants'}`}
        </p>

        {genOptions.length > 1 && (
          <div
            aria-label='Generations'
            className={style.genFilter}
            role='group'
          >
            <span className={style.genFilterLabel}>Generation</span>
            {genOptions.map((gen) => (
              <button
                aria-pressed={gens.has(gen)}
                className={cn(style.chip, style.genChip)}
                key={gen}
                style={genDepth(gen, deepest)}
                onClick={() => toggleGen(gen)}
                type='button'
              >
                {gen}
              </button>
            ))}
            <button
              aria-pressed={allGens}
              className={style.chip}
              onClick={toggleAll}
              type='button'
            >
              All
            </button>
          </div>
        )}

        {/* In narrow spaces the table hides its headers, so sort from here. */}
        <div className={style.mobileSort}>
          <span className={style.selectWrap}>
            <select
              aria-label='Sort progeny'
              onChange={(e) => handleSort(e.target.value)}
              value={sort.key}
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className={style.selectIcon} size={14} />
          </span>
          <button
            aria-label={
              sort.direction === 'asc' ? 'Sort descending' : 'Sort ascending'
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
      </div>

      <GrexTable<GrexWithGen>
        columns={columns}
        contextGrex={grex}
        grexes={rows.slice(0, numShown)}
        isLoading={isLoading}
        onSort={handleSort}
        renderEmpty={() => (
          <p className={style.empty}>No registered progeny.</p>
        )}
        sort={sort}
        sortKeys={{
          name: 'epithet',
          parentage: 'parent_name',
          date: 'date_of_registration',
          people: 'registrant_name',
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

      {rows.length >= MAX_RESULTS && (
        <p className={style.cap}>
          Only the first {MAX_RESULTS.toLocaleString()} descendants are listed.
          Pick fewer generations to narrow it down.
        </p>
      )}
    </div>
  );
}
