'use client';

import React from 'react';
import cn from 'classnames';

import style from './style.module.scss';

// The narrowest the search gets before the secondary controls move to their
// own line. Matches .search's flex-basis in the stylesheet.
const SEARCH_MIN_WIDTH = 160;

// A chart's controls, on one line when they fit:
//
//   [leading] [search] [secondary …]                              [end]
//
// When they don't, the secondary controls move to a second line, left-
// aligned, and `end` (the guide's button) stays at the far end of the first.
// On phones each part gets its own line, with `end` beside `leading` (or the
// search, if there's no leading part).
export const Toolbar = ({
  leading,
  search,
  secondary,
  end,
}: {
  leading?: React.ReactNode;
  search?: React.ReactNode;
  secondary?: React.ReactNode;
  end?: React.ReactNode;
}) => {
  const barRef = React.useRef<HTMLDivElement>(null);
  const secondaryRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = React.useState(false);

  // Everything but the search keeps its own width (the secondary part's is
  // the sum of its children's), so whether the parts fit on one line can be
  // worked out from those widths whichever layout is showing.
  React.useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const gapOf = (el: HTMLElement) =>
      parseFloat(getComputedStyle(el).columnGap) || 0;
    const widthOf = (el: HTMLElement) => {
      if (el === searchRef.current) return SEARCH_MIN_WIDTH;
      if (el === secondaryRef.current) {
        const parts = Array.from(el.children) as HTMLElement[];
        return (
          parts.reduce((w, p) => w + p.offsetWidth, 0) +
          gapOf(el) * Math.max(parts.length - 1, 0)
        );
      }
      return el.offsetWidth;
    };
    const measure = () => {
      const items = Array.from(bar.children) as HTMLElement[];
      const need = items.reduce(
        (w, el) => w + widthOf(el),
        gapOf(bar) * Math.max(items.length - 1, 0),
      );
      setStacked(need > bar.clientWidth);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    Array.from(bar.children).forEach((el) => ro.observe(el));
    Array.from(secondaryRef.current?.children ?? []).forEach((el) =>
      ro.observe(el),
    );
    return () => ro.disconnect();
  }, [Boolean(leading), Boolean(search), Boolean(secondary), Boolean(end)]);

  return (
    <div
      ref={barRef}
      className={cn(style.toolbar, {
        [style.stacked]: stacked,
        [style.hasLeading]: Boolean(leading),
      })}
    >
      {leading && <div className={style.leading}>{leading}</div>}
      {search && (
        <div ref={searchRef} className={style.search}>
          {search}
        </div>
      )}
      {secondary && (
        <div ref={secondaryRef} className={style.secondary}>
          {secondary}
        </div>
      )}
      {end && <div className={style.end}>{end}</div>}
    </div>
  );
};

export default Toolbar;
