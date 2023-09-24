'use client';

import Link from 'next/link';
import Image from 'next/image';

import { Padded } from 'components/container/container';
import { H3 } from 'components/layout';
import { capitalize } from 'lib/utils';

import style from './sidebar.module.scss';

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
        <Link
          className={style.searchAll}
          href={`/search-advanced?genus="${genus}"`}
        >
          Search all
        </Link>
      </Padded>

      <ParentageCTA genus={genus} />
    </Padded>
  );
}
