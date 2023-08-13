'use client';

import Link from 'next/link';

import { Padded } from 'components/container/container';
import { StatCard } from 'components/stat/stat';

import style from './sidebar.module.scss';
import Image from 'next/image';
import { H3 } from 'components/layout';
import { capitalize } from 'lib/utils';
import { Grex } from 'lib/types';

function ParentageCTA({ genus = '' }: { genus?: string }) {
  const capitalizedGenus = capitalize(genus);
  return (
    <Link href={genus ? `/learn/parentage/${genus}` : '/learn/parentage'}>
      <article className={style.cta}>
        <H3>
          <em>{genus && `${capitalizedGenus} `}</em>
          {genus ? 'parentage' : 'Parentage'} map
        </H3>
        <figure>
          <Image
            alt='Image of parentage visualization'
            src='/learn/parentage.png'
            fill
          />
        </figure>
        <p>
          Visualize the frequency with which all {<em>{capitalizedGenus} </em>}
          orchids
          {!genus && ' of a given genus'} are used in creating new hybrids.
        </p>
      </article>
    </Link>
  );
}

export function Sidebar({ genus }: { genus: string }) {
  return (
    <Padded>
      <Padded className={style.searchAllWrapper}>
        <Link className={style.searchAll} href={`/search?genus="${genus}"`}>
          Search all
        </Link>
      </Padded>

      <StatCard
        grex={
          {
            id: 'foo',
            genus: capitalize(genus),
            date_of_registration: '2023-01-01',
          } as Grex
        }
        stat='year_genus_pct'
      />

      <ParentageCTA genus={genus} />
    </Padded>
  );
}
