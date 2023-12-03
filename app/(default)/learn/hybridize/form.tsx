'use client';

import React from 'react';
import { Padded } from 'components/container/container';
import GrexAutocomplete from 'components/search/grex-autocomplete';
import { Grex } from 'lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGrex } from 'lib/hooks/useGrex';

import style from './style.module.scss';

export default function Form2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { s, p } = Object.fromEntries(searchParams?.entries());

  const ss = useGrex({ id: s });
  const pp = useGrex({ id: p });

  const [seed, setSeed] = React.useState<Grex>();
  const [pollen, setPollen] = React.useState<Grex>();

  const handleSeedParentChange = (g: Grex) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    params.set('s', g.id);
    router.replace(
      `${window.location.origin}${
        window.location.pathname
      }?${params.toString()}`
    );
  };
  const handlePollenParentChange = (g) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    params.set('p', g.id);
    router.replace(
      `${window.location.origin}${
        window.location.pathname
      }?${params.toString()}`
    );
  };
  const handleReverse = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams ?? undefined);

    params.set('s', searchParams?.get('p') ?? '');
    params.set('p', searchParams?.get('s') ?? '');

    if (!params.get('s')) {
      params.delete('s');
    }

    if (!params.get('p')) {
      params.delete('p');
    }

    router.replace(
      `${window.location.origin}${
        window.location.pathname
      }?${params.toString()}`
    );
  };

  return (
    <Padded className={style.controls}>
      <article>
        <GrexAutocomplete
          grex={ss}
          name='Seed Parent'
          onChange={handleSeedParentChange}
        />
      </article>

      <button className={style.crossChar} onClick={handleReverse}>
        &#8651; Swap
      </button>

      <article>
        <GrexAutocomplete
          grex={pp}
          name='Pollen Parent'
          onChange={handlePollenParentChange}
        />
      </article>
    </Padded>
  );
}
