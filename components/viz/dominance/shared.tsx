'use client';

import React from 'react';

// What carries over when you switch between the genus and registrant charts:
// the years in view and which labels are shown. Shares and groups differ
// between the two, so the vertical zoom and the selection start fresh.
export type LabelMode = 'all' | 'current';
export type Carried = { years: { x0: number; x1: number } | null };

const DominanceContext = React.createContext<{
  carried: React.RefObject<Carried>;
  labelMode: LabelMode;
  setLabelMode: (m: LabelMode) => void;
} | null>(null);

// Lives in the dominance layout, which stays mounted as you switch charts.
export function DominanceProvider({ children }: { children: React.ReactNode }) {
  const carried = React.useRef<Carried>({ years: null });
  const [labelMode, setLabelMode] = React.useState<LabelMode>('all');
  const value = React.useMemo(
    () => ({ carried, labelMode, setLabelMode }),
    [labelMode],
  );
  return (
    <DominanceContext.Provider value={value}>
      {children}
    </DominanceContext.Provider>
  );
}

// The shared state, or a chart-local stand-in outside the provider.
export function useDominanceShared() {
  const ctx = React.useContext(DominanceContext);
  const carried = React.useRef<Carried>({ years: null });
  const [labelMode, setLabelMode] = React.useState<LabelMode>('all');
  return ctx ?? { carried, labelMode, setLabelMode };
}
