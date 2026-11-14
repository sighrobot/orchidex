'use client';

import React from 'react';
import cn from 'classnames';

import style from './style.module.scss';

// Shares one navigation transition between the form (which starts it when a
// parent is picked) and the results below (which dim until the new cross
// arrives from the server).
const PendingContext = React.createContext<{
  pending: boolean;
  start: React.TransitionStartFunction;
}>({ pending: false, start: (fn) => fn() });

export const usePendingNav = () => React.useContext(PendingContext);

export function PendingProvider({ children }: { children: React.ReactNode }) {
  const [pending, start] = React.useTransition();
  const value = React.useMemo(() => ({ pending, start }), [pending]);
  return (
    <PendingContext.Provider value={value}>{children}</PendingContext.Provider>
  );
}

export function Results({ children }: { children: React.ReactNode }) {
  const { pending } = usePendingNav();
  return (
    <div
      aria-busy={pending}
      className={cn(style.results, { [style.pending]: pending })}
    >
      {children}
    </div>
  );
}
