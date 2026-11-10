import Image from 'next/image';
import Link from 'next/link';

import { capitalize } from 'lib/utils';

import style from './parentage-card.module.scss';

// A small card linking to this genus's parentage map, styled like the
// Explore cards on the home page.
export function ParentageCard({ genus }: { genus: string }) {
  return (
    <Link className={style.card} href={`/learn/parentage/${genus}`}>
      <Image
        alt=''
        className={style.image}
        height={175}
        sizes='320px'
        src='/learn/parentage.png'
        width={400}
      />
      <span className={style.text}>
        <span className={style.title}>
          <em>{capitalize(genus)}</em> parentage map
        </span>
        <span className={style.tagline}>
          How often each orchid is used as a parent
        </span>
      </span>
    </Link>
  );
}
