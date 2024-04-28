'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Padded } from 'components/container/container';
import GrexAutocomplete from 'components/search/grex-autocomplete';
import { Grex } from 'lib/types';
import { useGrex } from 'lib/hooks/useGrex';
import { H2 } from 'components/layout';

import style from './style.module.scss';

const PARAM_SEED = 's';
const PARAM_POLLEN = 'p';

export default function Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seedParentId = searchParams?.get(PARAM_SEED);
  const pollenParentId = searchParams?.get(PARAM_POLLEN);
  const [seedParent] = useGrex({ id: seedParentId });
  const [pollenParent] = useGrex({ id: pollenParentId });

  const handleParams = (
    params: URLSearchParams,
    action: 'push' | 'replace'
  ) => {
    params.sort();
    return router[action](
      `${window.location.origin}${window.location.pathname}?${params
        .toString()
        .split('&')
        .reverse() // reverse the sort so `s` comes before `p`
        .join('&')}`
    );
  };

  const replaceParams = (params: URLSearchParams) =>
    handleParams(params, 'replace');
  const pushParams = (params: URLSearchParams) => handleParams(params, 'push');

  const handleParentChange = (grexId: string, param: string) => {
    const newParams = new URLSearchParams(searchParams ?? undefined);
    newParams.set(param, grexId);

    if (seedParent && pollenParent) {
      pushParams(newParams);
    } else {
      replaceParams(newParams);
    }
  };

  const handleSeedParentChange = (g: Grex) =>
    handleParentChange(g.id, PARAM_SEED);
  const handlePollenParentChange = (g: Grex) =>
    handleParentChange(g.id, PARAM_POLLEN);

  const handleSwap = () => {
    const newParams = new URLSearchParams(searchParams ?? undefined);

    newParams.set(PARAM_SEED, searchParams?.get(PARAM_POLLEN) ?? '');
    newParams.set(PARAM_POLLEN, searchParams?.get(PARAM_SEED) ?? '');

    if (!newParams.get(PARAM_SEED)) {
      newParams.delete(PARAM_SEED);
    }
    if (!newParams.get(PARAM_POLLEN)) {
      newParams.delete(PARAM_POLLEN);
    }

    replaceParams(newParams);
  };

  return (
    <>
      <aside className={style.hybridize}>
        <H2>
          Hybridize{' '}
          <sup className={style.beta}>
            <mark>BETA</mark>
          </sup>
        </H2>

        <p>
          Explore the ancestry of a hybrid formed from any two orchids by
          selecting its parents below.
        </p>

        <Padded className={style.controls}>
          <article className={style.input}>
            <GrexAutocomplete
              grex={seedParent}
              name='Seed Parent'
              onChange={handleSeedParentChange}
            />
          </article>

          <div className={style.swapWrap}>
            <button
              className={style.swap}
              disabled={!seedParent && !pollenParent}
              onClick={handleSwap}
            >
              &#8651; Swap
            </button>
          </div>

          <article className={style.input}>
            <GrexAutocomplete
              grex={pollenParent}
              name='Pollen Parent'
              onChange={handlePollenParentChange}
            />
          </article>
        </Padded>
      </aside>
    </>
  );
}
