'use client';

import React from 'react';
import { ChevronsUpDown, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Name } from 'components/grex/name';
import { isSpecies } from 'components/pills/pills';
import { useFTS } from 'lib/fetchers/fts';
import { formatName } from 'lib/string';

import style from './style.module.scss';
import type { Grex } from 'lib/types';

// Results fetched per search.
const LIMIT = 20;
// Shortest query that searches.
const MIN_QUERY = 2;

// A hybrid's parents, abbreviated, e.g. "Paph. callosum × Paph. lawrenceanum".
const parentsOf = (g: Grex) => {
  if (
    !g.seed_parent_genus ||
    !g.seed_parent_epithet ||
    !g.pollen_parent_genus ||
    !g.pollen_parent_epithet
  ) {
    return null;
  }
  const seed = formatName({
    genus: g.seed_parent_genus,
    epithet: g.seed_parent_epithet,
  }).short.full;
  const pollen = formatName({
    genus: g.pollen_parent_genus,
    epithet: g.pollen_parent_epithet,
  }).short.full;
  return `${seed} × ${pollen}`;
};

const yearOf = (g: Grex) => g.date_of_registration?.slice(0, 4);

// A button naming the picked orchid (or inviting a pick) that opens a search
// of every orchid, species and hybrid. Styled after the genus picker.
export default function GrexPicker({
  label,
  grex,
  pending,
  onPick,
}: {
  // What the orchid is for, e.g. "Seed parent".
  label: string;
  grex?: Grex;
  // While the page catches up with a pick.
  pending?: boolean;
  onPick: (g: Grex) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);
  const listId = React.useId();

  const q = query.trim();
  const { data: results = [], isLoading } = useFTS({
    q: q.length >= MIN_QUERY ? q : '',
    limit: LIMIT,
    isDebounced: true,
  });
  const at = Math.min(active, results.length - 1);

  const pick = (g: Grex) => {
    setOpen(false);
    if (g.id !== grex?.id) onPick(g);
  };

  // Keep the highlighted result in view as the arrow keys move it.
  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${at}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [at]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((at + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((at - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[at]);
    }
  };

  const name = grex ? formatName(grex).long.full : null;

  let note: React.ReactNode = null;
  if (q.length < MIN_QUERY) {
    note = 'Type an orchid’s name, e.g. “Vanda coerulea”';
  } else if (isLoading && !results.length) {
    note = 'Searching…';
  } else if (!results.length) {
    note = `No orchids match “${q}”`;
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery('');
          setActive(0);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-controls={listId}
          aria-busy={pending}
          aria-label={
            name ? `${label}: ${name}. Change ${label.toLowerCase()}` : label
          }
          className={style.trigger}
        >
          <span className={style.label}>{label}</span>
          <span className={style.value}>
            {grex ? (
              <Name link={false} grex={grex} />
            ) : (
              <span className={style.placeholder}>Choose an orchid</span>
            )}
          </span>
          {pending ? (
            <Loader2 className={style.spinner} />
          ) : (
            <ChevronsUpDown className={style.chevron} />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align='start' className={style.popover}>
        <div className={style.searchRow}>
          <Search className={style.searchIcon} />
          <input
            autoFocus
            value={query}
            placeholder='Search species and hybrids'
            aria-label={`Search for a ${label.toLowerCase()}`}
            aria-controls={listId}
            aria-activedescendant={
              results.length ? `${listId}-${at}` : undefined
            }
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          {isLoading && <Loader2 className={style.spinner} />}
        </div>

        <ul ref={listRef} id={listId} role='listbox' className={style.list}>
          {note && <li className={style.note}>{note}</li>}
          {results.map((g, k) => {
            const parents = isSpecies(g) ? null : parentsOf(g);
            const year = yearOf(g);
            return (
              <li
                key={g.id}
                id={`${listId}-${k}`}
                data-index={k}
                role='option'
                aria-selected={g.id === grex?.id}
                data-active={k === at}
                className={style.option}
                onMouseEnter={() => setActive(k)}
                onClick={() => pick(g)}
              >
                <span className={style.name}>
                  <Name link={false} grex={g} />
                </span>
                <span className={style.meta}>
                  {parents ?? 'Species'}
                  {year && !isSpecies(g) && ` · ${year}`}
                </span>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
