'use client';

import React from 'react';
import { X } from 'lucide-react';

import style from './style.module.scss';

const MAX_SUGGESTIONS = 8;

type Genus = { name: string; abbr: string };

// A text input that turns picked genera into removable tokens. Suggestions
// match the start of a genus's name or abbreviation first, then anywhere in
// it, and within each group keep the all-time ranking `genera` is sorted by.
export default function GenusTokens({
  genera,
  selected,
  colorOf,
  onAdd,
  onRemove,
  onClear,
}: {
  genera: Genus[];
  selected: number[];
  colorOf: (g: number) => string;
  onAdd: (g: number) => void;
  onRemove: (g: number) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const suggestions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(selected);
    const starts: number[] = [];
    const contains: number[] = [];
    genera.forEach((g, i) => {
      if (taken.has(i)) return;
      const name = g.name.toLowerCase();
      const abbr = g.abbr.toLowerCase();
      if (name.startsWith(q) || abbr.startsWith(q)) starts.push(i);
      else if (name.includes(q) || abbr.includes(q)) contains.push(i);
    });
    return starts.concat(contains).slice(0, MAX_SUGGESTIONS);
  }, [genera, query, selected]);

  const showList = open && suggestions.length > 0;
  const current = Math.min(active, suggestions.length - 1);

  const pick = (g: number) => {
    onAdd(g);
    setQuery('');
    setActive(0);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((current + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((current - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && showList) {
      e.preventDefault();
      pick(suggestions[current]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && !query && selected.length) {
      onRemove(selected[selected.length - 1]);
    }
  };

  return (
    <div className={style.tokens}>
      <div
        className={style.tokenField}
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((g) => (
          <span key={g} className={style.token}>
            <span className={style.swatch} style={{ background: colorOf(g) }} />
            {genera[g].name}
            <button
              type='button'
              aria-label={`Remove ${genera[g].name}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(g);
              }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          placeholder={selected.length ? 'Add genus…' : 'Highlight genera…'}
          role='combobox'
          aria-label='Highlight genera'
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete='list'
          aria-activedescendant={
            showList ? `${listId}-${suggestions[current]}` : undefined
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {selected.length > 0 && (
          <button
            type='button'
            className={style.clear}
            aria-label='Clear highlighted genera'
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            Clear
          </button>
        )}
      </div>

      {showList && (
        <ul id={listId} role='listbox' className={style.suggestions}>
          {suggestions.map((g, k) => (
            <li
              key={g}
              id={`${listId}-${g}`}
              role='option'
              aria-selected={k === current}
              data-active={k === current}
              // Keep focus in the input so the list doesn't close first.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(k)}
              onClick={() => pick(g)}
            >
              <span
                className={style.swatch}
                style={{ background: colorOf(g) }}
              />
              {genera[g].name}
              {genera[g].abbr !== genera[g].name && (
                <span className={style.muted}>{genera[g].abbr}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
