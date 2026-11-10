import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Padded } from 'components/container/container';
import { H2 } from 'components/layout';
import { APP_TITLE } from 'lib/constants';
import { EXPLORE_TOOLS } from 'lib/explore';

import style from './style.module.scss';

export const metadata: Metadata = {
  title: `Learn | ${APP_TITLE}`,
};

export default function Learn() {
  return (
    <Padded>
      <H2>Explore the data</H2>
      <p className={style.intro}>
        Interactive tools and visualizations built on the RHS orchid registry.
      </p>

      <ul className={style.grid}>
        {EXPLORE_TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link className={style.card} href={tool.href}>
              <Image
                alt=''
                className={style.image}
                height={450}
                sizes='(max-width: 700px) 100vw, 50vw'
                src={tool.src}
                width={800}
              />
              <span className={style.text}>
                <span className={style.title}>{tool.title}</span>
                <span className={style.description}>{tool.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Padded>
  );
}
