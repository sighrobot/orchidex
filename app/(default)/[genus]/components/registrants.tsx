'use client';
import Link from 'next/link';

import { Padded } from 'components/container/container';
import List from 'components/viz/list';
import { useRegistrantCounts } from 'lib/fetchers/counts/registrant';
import { Grex } from 'lib/types';

import style from './registrant.module.scss';

export default function RegistrantList({ genus }: { genus: string }) {
  const { data, isLoading } = useRegistrantCounts({ genus });

  if (!isLoading && data.length === 0) {
    return <Padded>No registrants found.</Padded>;
  }

  return (
    <List
      isLoading={isLoading}
      data={data.map((d) => {
        return {
          score: d.c,
          grex: {
            genus: '',
            epithet: '',
            registrant_name: d.r || '__species',
          },
          id: d.r || '__species',
        };
      })}
      renderField={({ grex: g = {} }: { grex: Partial<Grex> }, idx) => (
        <div className={style.rank}>
          <span>{idx + 1}.</span>
          <Link href={`/registrant/${encodeURIComponent(g.registrant_name)}`}>
            {g.registrant_name}
          </Link>
        </div>
      )}
      getCount={(d) => d.score}
      limit={25}
      showBars={false}
      numItemsToLoad={25}
    />
  );
}
