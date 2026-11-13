'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import useSWR from 'swr';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { capitalize } from 'lib/utils';

import style from './style.module.scss';

type Genus = {
  // Name, as registered.
  g: string;
  // Registered orchids.
  c: number;
  // RHS abbreviation, if it has one.
  a: string | null;
};

// Results shown at once; type to narrow the rest.
const MAX_RESULTS = 60;

const fmt = new Intl.NumberFormat('en-US');

const fetchGenera = (url: string): Promise<Genus[]> =>
  fetch(url).then((r) => r.json());

// Genera matching `q`: those whose name or abbreviation starts with it, then
// those containing it, each most-registered first (the order `genera` is
// already in). Without a query, the current genus and then the most
// registered.
function search(genera: Genus[], q: string, current: string) {
  const query = q.trim().toLowerCase().replace(/\.$/, '');
  if (!query) {
    const here = genera.find((genus) => genus.g.toLowerCase() === current);
    const rest = genera.filter((genus) => genus !== here);
    return (here ? [here, ...rest] : rest).slice(0, MAX_RESULTS);
  }
  const starts: Genus[] = [];
  const contains: Genus[] = [];
  for (const genus of genera) {
    const name = genus.g.toLowerCase();
    const abbr = genus.a?.toLowerCase().replace(/\.$/, '') ?? '';
    if (name.startsWith(query) || abbr.startsWith(query)) starts.push(genus);
    else if (name.includes(query)) contains.push(genus);
  }
  return starts.concat(contains).slice(0, MAX_RESULTS);
}

// A button showing the current genus that opens a search of every genus;
// picking one goes to `${basePath}/${genus}`.
export default function GenusInput({
  basePath,
  value,
}: {
  basePath: string;
  value: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const [pending, startTransition] = React.useTransition();
  // The genus being navigated to, shown in the button until it arrives.
  const [target, setTarget] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const listId = React.useId();

  const { data: genera = [], isLoading } = useSWR('/api/genera', fetchGenera, {
    revalidateOnFocus: false,
  });
  const current = value.toLowerCase();
  const results = React.useMemo(
    () => search(genera, query, current),
    [genera, query, current],
  );
  const at = Math.min(active, results.length - 1);

  const hrefOf = (genus: string) => `${basePath}/${genus.toLowerCase()}`;

  const pick = (genus: string) => {
    setOpen(false);
    if (genus.toLowerCase() === current) return;
    setTarget(genus);
    startTransition(() => router.push(hrefOf(genus)));
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
      pick(results[at].g);
    }
  };

  const shown = pending && target ? target : capitalize(value);

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
            shown ? `Genus: ${shown}. Change genus` : 'Choose a genus'
          }
          className={style.trigger}
        >
          <span className={style.label}>Genus</span>
          {shown ? (
            <i className={style.value}>{shown}</i>
          ) : (
            <span className={style.value}>Choose…</span>
          )}
          {pending ? (
            <Loader2 className={style.spinner} />
          ) : (
            <ChevronsUpDown className={style.chevron} />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className={style.popover}>
        <div className={style.searchRow}>
          <Search className={style.searchIcon} />
          <input
            autoFocus
            value={query}
            placeholder='Search genera or abbreviations'
            aria-label='Search genera'
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
        </div>

        <div className={style.heading}>
          {query.trim()
            ? `${results.length === MAX_RESULTS ? `Top ${MAX_RESULTS}` : results.length} ${results.length === 1 ? 'match' : 'matches'}`
            : 'Most registered'}
          <span>Orchids</span>
        </div>

        <ul ref={listRef} id={listId} role='listbox' className={style.list}>
          {isLoading && <li className={style.note}>Loading genera…</li>}
          {!isLoading && !results.length && (
            <li className={style.note}>No genus matches “{query.trim()}”</li>
          )}
          {results.map((genus, k) => {
            const selected = genus.g.toLowerCase() === current;
            return (
              <li
                key={genus.g}
                id={`${listId}-${k}`}
                data-index={k}
                role='option'
                aria-selected={selected}
                data-active={k === at}
                className={style.option}
                onMouseEnter={() => {
                  setActive(k);
                  router.prefetch(hrefOf(genus.g));
                }}
                onClick={() => pick(genus.g)}
              >
                <i className={style.name}>{genus.g}</i>
                {genus.a && genus.a !== genus.g && (
                  <span className={style.abbr}>{genus.a}</span>
                )}
                {selected && (
                  <Check className={style.check} aria-label='Current genus' />
                )}
                <span className={style.count}>{fmt.format(genus.c)}</span>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
