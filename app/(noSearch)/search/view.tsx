'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import cn from 'classnames';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Padded } from 'components/container/container';
import { GrexTable } from 'components/grex/table';
import { H2, H3 } from 'components/layout';
import {
  countFilters,
  effectiveSort,
  FilterPanel,
  hasCriteria,
  PAGE_SIZE,
  parseFilterPanel,
  parseSearchParams,
  SEARCH_SORTS,
  SEARCH_ORIGINS,
  SEARCH_TYPES,
  SearchParams,
  SearchSort,
  SearchOrigin,
  SearchType,
  searchUrl,
  SORT_LABELS,
  TextFilterKey,
  toQueryString,
  ORIGIN_LABELS,
  TYPE_LABELS,
} from 'lib/search/params';
import { INPUT_NAME_SUFFIX } from 'lib/string';
import type { SearchResult } from 'lib/queries/search';
import { SearchInput } from './components/bar';

import style from './style.module.scss';

const fetcher = async (url: string): Promise<SearchResult> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
};

export default function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = React.useMemo(
    () => parseSearchParams(searchParams),
    [searchParams]
  );

  const [draft, setDraft] = React.useState<SearchParams>(params);
  React.useEffect(() => setDraft(params), [params]);

  // ?filters=hybrid|advanced (from the homepage links and the retired search
  // pages) opens the panel with that group highlighted; ?filters=1 just opens it.
  const filtersParam = searchParams.get('filters');
  const highlight = parseFilterPanel(filtersParam);
  const [showFilters, setShowFilters] = React.useState<boolean>(!!filtersParam);
  React.useEffect(() => {
    if (filtersParam) setShowFilters(true);
  }, [filtersParam]);

  const results = useSearchResults(params);

  const go = (next: SearchParams) => router.push(searchUrl(next));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    go({ ...draft, sort: params.sort });
    // Get the panel out of the way of the results. The count on the toggle
    // still shows what's active.
    setShowFilters(false);
  };

  const setField = <K extends keyof SearchParams>(
    key: K,
    value: SearchParams[K]
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const numFilters = countFilters(params);

  return (
    <>
      <Padded>
        <H2>Search</H2>
      </Padded>

      <form onSubmit={handleSubmit}>
        <SearchInput
          onChange={(e) => setField('q', e.target.value)}
          value={draft.q ?? ''}
        />

        <Padded className={style.filtersWrap}>
          <details
            onToggle={(e) => setShowFilters(e.currentTarget.open)}
            open={showFilters}
          >
            <summary className={style.filtersToggle}>
              Filters
              {numFilters > 0 && (
                // Keyed on the count so the pop replays whenever it changes.
                <span className={style.count} key={numFilters}>
                  {numFilters}
                  <span className='sr-only'>
                    {numFilters === 1 ? ' active filter' : ' active filters'}
                  </span>
                </span>
              )}
              <ChevronDown aria-hidden className={style.chevron} size={16} />
            </summary>

            <FiltersPanel
              draft={draft}
              highlight={highlight}
              // Only jump to a field when arriving at an empty search.
              shouldFocus={!hasCriteria(params)}
              onClear={() => {
                setDraft({ q: draft.q });
                go({ q: params.q, sort: params.sort });
              }}
              setField={setField}
            />
          </details>
        </Padded>
      </form>

      <Padded className={style.results}>
        <ResultsHeader
          isLoading={results.isLoading}
          onSortChange={(sort) =>
            router.replace(searchUrl({ ...params, sort }), { scroll: false })
          }
          params={params}
          total={results.total}
        />

        {results.error && (
          <p className={style.message}>
            Something went wrong loading results. Please try again.
          </p>
        )}

        {!results.error && (
          <GrexTable
            className={style.table}
            grexes={results.items}
            isLoading={results.isLoading}
          />
        )}

        {results.hasMore && (
          <div className={style.loadMore}>
            <Button
              className='cursor-pointer'
              disabled={results.isLoadingMore}
              onClick={results.loadMore}
              variant='outline'
            >
              {results.isLoadingMore
                ? 'Loading…'
                : hasCriteria(params)
                ? `Show more (${(
                    results.total - results.items.length
                  ).toLocaleString()} left)`
                : 'Show more'}
            </Button>
          </div>
        )}
      </Padded>
    </>
  );
}

// With no criteria this lists the whole registry, newest first.
function useSearchResults(params: SearchParams) {
  const qs = toQueryString(params);

  const { data, error, isLoading, size, setSize } =
    useSWRInfinite<SearchResult>(
      (pageIndex, previous: SearchResult | null) => {
        if (previous && pageIndex * PAGE_SIZE >= previous.total) return null;
        return `/api/search?${qs}&offset=${pageIndex * PAGE_SIZE}`;
      },
      fetcher,
      { revalidateFirstPage: false, revalidateOnFocus: false }
    );

  const items = React.useMemo(
    () => data?.flatMap((page) => page.results) ?? [],
    [data]
  );
  const total = data?.[0]?.total ?? 0;

  return {
    error,
    items,
    total,
    isLoading,
    isLoadingMore: !!data && size > data.length,
    hasMore: !!data && items.length < total,
    loadMore: () => setSize(size + 1),
  };
}

function ResultsHeader({
  isLoading,
  onSortChange,
  params,
  total,
}: {
  isLoading: boolean;
  onSortChange: (sort: SearchSort) => void;
  params: SearchParams;
  total: number;
}) {
  const sorts = SEARCH_SORTS.filter((s) => s !== 'relevance' || params.q);

  return (
    <div className={style.resultsHeader}>
      <H3>
        {!hasCriteria(params)
          ? 'All registrations'
          : isLoading
          ? 'Searching…'
          : total === 0
          ? 'No results'
          : `${total.toLocaleString()} ${total === 1 ? 'result' : 'results'}`}
      </H3>

      <Select
        aria-label='Sort results'
        className={style.sortSelect}
        onChange={(e) => onSortChange(e.target.value as SearchSort)}
        value={effectiveSort(params)}
      >
        {sorts.map((s) => (
          <option key={s} value={s}>
            {SORT_LABELS[s]}
          </option>
        ))}
      </Select>
    </div>
  );
}

// A native select with the browser's arrow swapped for our own chevron, so it
// lines up the same way in every browser.
function Select({
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn(style.selectWrap, className)}>
      <select {...props}>{children}</select>
      <ChevronDown aria-hidden className={style.selectIcon} size={16} />
    </span>
  );
}

// A segmented control where nothing selected is allowed (and means "no
// filter"): clicking the chosen option again clears it. Buttons rather than
// radios, since radios can't be unselected.
function ToggleGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T | undefined) => void;
  options: { value: T; label: string }[];
  value: T | undefined;
}) {
  // The option just selected doesn't show the "click to clear" strikethrough
  // until the pointer (or focus) leaves it, so it doesn't flash on right away.
  const [justSelected, setJustSelected] = React.useState<T>();

  return (
    <div aria-label={label} className={style.segmented} role='group'>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              style.segment,
              isSelected && style.selected,
              isSelected && style.filledSegment,
              isSelected && justSelected === option.value && style.noStrike
            )}
            key={option.value}
            onBlur={() => setJustSelected(undefined)}
            onClick={() => {
              setJustSelected(isSelected ? undefined : option.value);
              onChange(isSelected ? undefined : option.value);
            }}
            onMouseLeave={() => setJustSelected(undefined)}
            title={isSelected ? 'Click again to clear' : undefined}
            type='button'
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type SetField = <K extends keyof SearchParams>(
  key: K,
  value: SearchParams[K]
) => void;

function FiltersPanel({
  draft,
  highlight,
  onClear,
  setField,
  shouldFocus,
}: {
  draft: SearchParams;
  highlight?: FilterPanel;
  onClear: () => void;
  setField: SetField;
  shouldFocus: boolean;
}) {
  const hybridRef = React.useRef<HTMLElement>(null);
  const advancedRef = React.useRef<HTMLElement>(null);

  // Put the cursor in the first field of the highlighted group.
  React.useEffect(() => {
    if (!highlight || !shouldFocus) return;
    const group = highlight === 'hybrid' ? hybridRef : advancedRef;
    group.current?.querySelector<HTMLInputElement>('input')?.focus();
    // Run only when the highlight changes, not as the user types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight]);

  // The placeholder is the field's only visible label.
  const text = (key: TextFilterKey, label: string, isGenus = false) => (
    <FilterInput
      aria-label={label}
      isGenus={isGenus}
      name={key}
      onChange={(value) => setField(key, value)}
      placeholder={label}
      value={draft[key] ?? ''}
    />
  );

  const parent = (
    label: string,
    genusKey: 'g1' | 'g2',
    epithetKey: 'e1' | 'e2'
  ) => (
    <div className={style.parent} role='group' aria-label={label}>
      <FilterInput
        aria-label={`${label} genus`}
        isGenus
        name={genusKey}
        onChange={(value) => setField(genusKey, value)}
        placeholder='Genus'
        value={draft[genusKey] ?? ''}
      />
      <FilterInput
        aria-label={`${label} epithet`}
        name={epithetKey}
        onChange={(value) => setField(epithetKey, value)}
        placeholder='Epithet'
        value={draft[epithetKey] ?? ''}
      />
    </div>
  );

  return (
    <div className={style.filters} id='search-filters'>
      <section
        aria-labelledby='hybrid-search-title'
        className={cn(
          style.group,
          highlight === 'hybrid' && style.highlightHybrid
        )}
        ref={hybridRef}
      >
        <h3 className={style.groupTitle} id='hybrid-search-title'>
          Hybrid search
        </h3>
        <div className={style.cross}>
          {parent('Parent 1', 'g1', 'e1')}
          <span aria-hidden className={style.crossIcon}>
            &times;
          </span>
          {parent('Parent 2', 'g2', 'e2')}
        </div>
      </section>

      <section
        aria-labelledby='advanced-search-title'
        className={cn(
          style.group,
          highlight === 'advanced' && style.highlightAdvanced
        )}
        ref={advancedRef}
      >
        <h3 className={style.groupTitle} id='advanced-search-title'>
          Advanced search
        </h3>
        <div className={style.advancedGrid}>
          <div className={style.pair}>
            {text('genus', 'Genus', true)}
            {text('epithet', 'Epithet')}
          </div>
          <div className={style.pair}>
            {text('registrant', 'Registrant')}
            {text('originator', 'Originator')}
          </div>
          <div className={style.pair}>
            <DateField
              label='Registered from'
              max={draft.to}
              onChange={(v) => setField('from', v)}
              value={draft.from ?? ''}
            />
            <DateField
              label='Registered to'
              min={draft.from}
              onChange={(v) => setField('to', v)}
              value={draft.to ?? ''}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby='type-search-title' className={style.group}>
        <h3 className={style.groupTitle} id='type-search-title'>
          Type
        </h3>
        <div className={style.segmentRows}>
          <ToggleGroup<SearchType>
            label='Type'
            onChange={(value) => {
              setField('type', value);
              // Origin and genera only describe hybrids.
              if (value !== 'hybrid') {
                setField('origin', undefined);
                setField('natural', undefined);
                setField('intergeneric', undefined);
              }
            }}
            options={SEARCH_TYPES.map((t) => ({
              value: t,
              label: TYPE_LABELS[t],
            }))}
            value={draft.type}
          />

          {draft.type === 'hybrid' && (
            <div className={style.hybridRefine}>
              <ToggleGroup<SearchOrigin>
                label='Parentage'
                onChange={(value) => {
                  setField('origin', value);
                  // Natural hybrids are always primary.
                  if (value !== 'primary') setField('natural', undefined);
                }}
                options={SEARCH_ORIGINS.map((o) => ({
                  value: o,
                  label: ORIGIN_LABELS[o],
                }))}
                value={draft.origin}
              />
              {draft.origin === 'primary' && (
                <div className={style.slideOut}>
                  <ToggleGroup<'natural'>
                    label='Natural primary hybrids'
                    onChange={(value) =>
                      setField('natural', !!value || undefined)
                    }
                    options={[{ value: 'natural', label: 'Natural' }]}
                    value={draft.natural ? 'natural' : undefined}
                  />
                </div>
              )}
              <ToggleGroup<'intergeneric'>
                label='Parent genera'
                onChange={(value) =>
                  setField('intergeneric', !!value || undefined)
                }
                options={[{ value: 'intergeneric', label: 'Intergeneric' }]}
                value={draft.intergeneric ? 'intergeneric' : undefined}
              />
            </div>
          )}
        </div>
      </section>

      <div className={style.actions}>
        <Button className='cursor-pointer' type='submit'>
          Search
        </Button>
        <Button
          className='cursor-pointer'
          onClick={onClear}
          type='button'
          variant='ghost'
        >
          Clear filters
        </Button>
        <p className={style.hint}>
          Tip: put a value in &quot;quotes&quot; for an exact match
        </p>
      </div>
    </div>
  );
}

// The placeholder doubles as the visible label, as on the old search forms.
function FilterInput({
  isGenus,
  name,
  onChange,
  placeholder,
  value,
  ...rest
}: {
  'aria-label': string;
  isGenus?: boolean;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <input
      {...rest}
      autoCapitalize='off'
      autoCorrect='off'
      className={cn(isGenus && style.italic)}
      name={`${name}${INPUT_NAME_SUFFIX}`}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      type='search'
      value={value}
    />
  );
}

// Date pickers can't show a placeholder, so these two fields keep a small
// label above them.
function DateField({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string;
  max?: string;
  min?: string;
  onChange: (value?: string) => void;
  value: string;
}) {
  return (
    <label className={style.dateField}>
      <span>{label}</span>
      <input
        className={cn(!value && style.empty)}
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value || undefined)}
        type='date'
        value={value}
      />
    </label>
  );
}
