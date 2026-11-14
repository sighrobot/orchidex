'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftRight, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { H2 } from 'components/layout';
import GrexPicker from 'components/grex-picker';
import { useGrex } from 'lib/hooks/useGrex';
import { Grex } from 'lib/types';

import { usePendingNav } from './pending';
import style from './style.module.scss';

const PARAM_SEED = 's';
const PARAM_POLLEN = 'p';

type Slot = typeof PARAM_SEED | typeof PARAM_POLLEN;

// The two parent pickers, with a swap button between them and a clear button
// at the far end. The cross lives in the URL (?s=<seed id>&p=<pollen id>).
export default function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pending, start } = usePendingNav();
  const seedId = searchParams?.get(PARAM_SEED) || undefined;
  const pollenId = searchParams?.get(PARAM_POLLEN) || undefined;
  const [seedParent] = useGrex({ id: seedId });
  const [pollenParent] = useGrex({ id: pollenId });

  // Picks (or clears, as null) shown straight away, while the page catches up
  // with the URL. Once it has, they agree with the URL; if the URL moves on
  // some other way (Back), it wins.
  const [picked, setPicked] = React.useState<
    Partial<Record<Slot, Grex | null>>
  >({});
  // Which picker shows the spinner.
  const [changing, setChanging] = React.useState<Slot | 'both' | null>(null);

  const shown = (slot: Slot, id: string | undefined, fetched?: Grex) =>
    slot in picked && (pending || picked[slot]?.id === id)
      ? (picked[slot] ?? undefined)
      : fetched;
  const seed = shown(PARAM_SEED, seedId, seedParent);
  const pollen = shown(PARAM_POLLEN, pollenId, pollenParent);

  const go = (ids: Partial<Record<Slot, string>>, slot: Slot | 'both') => {
    const params = new URLSearchParams();
    // `s` before `p`, so links read seed first.
    if (ids.s) params.set(PARAM_SEED, ids.s);
    if (ids.p) params.set(PARAM_POLLEN, ids.p);
    const qs = params.toString();
    setChanging(slot);
    start(() =>
      router.push(`/learn/hybridize${qs ? `?${qs}` : ''}`, { scroll: false }),
    );
  };

  const pick = (slot: Slot) => (g: Grex) => {
    setPicked((prev) => ({ ...prev, [slot]: g }));
    go({ s: seed?.id, p: pollen?.id, [slot]: g.id }, slot);
  };

  const swap = () => {
    setPicked({ s: pollen ?? null, p: seed ?? null });
    go({ s: pollen?.id, p: seed?.id }, 'both');
  };

  const clear = () => {
    setPicked({ s: null, p: null });
    go({}, 'both');
  };

  const busy = (slot: Slot) =>
    pending && (changing === slot || changing === 'both');

  return (
    <>
      {/* The section strip names the page; the heading stays for screen readers. */}
      <H2 className='sr-only'>Hybridizer tool</H2>

      <div className={style.pickers}>
        <div className={style.slot}>
          <GrexPicker
            label='Seed parent'
            grex={seed}
            pending={busy(PARAM_SEED)}
            onPick={pick(PARAM_SEED)}
          />
        </div>

        <Button
          variant='outline'
          size='icon'
          className={style.swap}
          aria-label='Swap seed and pollen parents'
          title='Swap seed and pollen parents'
          disabled={!seed && !pollen}
          onClick={swap}
        >
          <ArrowLeftRight />
        </Button>

        <div className={style.slot}>
          <GrexPicker
            label='Pollen parent'
            grex={pollen}
            pending={busy(PARAM_POLLEN)}
            onPick={pick(PARAM_POLLEN)}
          />
        </div>

        <Button
          variant='outline'
          className={style.clear}
          disabled={!seed && !pollen}
          onClick={clear}
        >
          <X />
          Clear
        </Button>
      </div>
    </>
  );
}
