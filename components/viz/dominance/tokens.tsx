'use client';

import React from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import style from './style.module.scss';

const MAX_SUGGESTIONS = 8;

type Item = { name: string; abbr: string };

// A text input that turns picked items (genera or registrants) into removable
// tokens. Suggestions match the start of an item's name or abbreviation
// first, then anywhere in it, and within each group keep the all-time
// ranking `items` is sorted by.
export default function Tokens({
  items,
  noun,
  italic,
  selected,
  colorOf,
  onAdd,
  onRemove,
  onClear,
}: {
  items: Item[];
  // What the items are called, plural, for the placeholder.
  noun: string;
  // Whether names are italicized, as scientific names are.
  italic: boolean;
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
  const Name = italic ? 'i' : 'span';

  const suggestions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(selected);
    const starts: number[] = [];
    const contains: number[] = [];
    items.forEach((g, i) => {
      if (taken.has(i)) return;
      const name = g.name.toLowerCase();
      const abbr = g.abbr.toLowerCase();
      if (name.startsWith(q) || abbr.startsWith(q)) starts.push(i);
      else if (name.includes(q) || abbr.includes(q)) contains.push(i);
    });
    return starts.concat(contains).slice(0, MAX_SUGGESTIONS);
  }, [items, query, selected]);

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
            <Name>{items[g].name}</Name>
            <button
              type='button'
              aria-label={`Remove ${items[g].name}`}
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
          placeholder={`Search ${noun}`}
          role='combobox'
          aria-label={`Search ${noun}`}
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
          <Button
            type='button'
            variant='outline'
            size='sm'
            className={style.clear}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              inputRef.current?.focus();
            }}
          >
            <X />
            Clear all
          </Button>
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
              <Name>{items[g].name}</Name>
              {items[g].abbr !== items[g].name && (
                <Name className={style.muted}>{items[g].abbr}</Name>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
