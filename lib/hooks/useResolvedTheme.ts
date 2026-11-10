'use client';

import React from 'react';

import type { ResolvedTheme } from 'lib/theme';

const current = (): ResolvedTheme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

// The theme actually showing, for things CSS can't reach (chart colours).
// Follows the class on <html>, so it updates whenever the theme changes.
export function useResolvedTheme(): ResolvedTheme {
  const [theme, setTheme] = React.useState<ResolvedTheme>('light');

  React.useEffect(() => {
    setTheme(current());
    const observer = new MutationObserver(() => setTheme(current()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
