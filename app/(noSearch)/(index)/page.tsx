'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Padded } from 'components/container/container';
import { GrexTable } from 'components/grex/table';
import { H2, H3 } from 'components/layout';
import { useDate } from 'lib/hooks/useDate';
import { APP_DESCRIPTION } from 'lib/constants';
import { EXPLORE_TOOLS } from 'lib/explore';

import SearchBar, { AdvSearchCTA } from '../search/components/bar';

import style from './style.module.scss';

export default function IndexPage() {
  const { isLoading, data: recent = [] } = useDate();

  return (
    <>
      <Padded className={style.heroHead}>
        <H2 className={style.heroTitle}>Discover orchids.</H2>
      </Padded>

      {/* Intro and search on the left, links to the Explore tools on the right. */}
      <div className={style.hero}>
        <div>
          <Padded className={style.homeHero}>
            <p className={style.heroDescription}>{APP_DESCRIPTION}</p>
          </Padded>

          <SearchBar />
          <AdvSearchCTA />
        </div>

        <nav aria-label='Explore the data' className={style.explore}>
          <ul className={style.exploreList}>
            {EXPLORE_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link className={style.exploreCard} href={tool.href}>
                  <Image
                    alt=''
                    className={style.exploreThumb}
                    height={175}
                    sizes='(max-width: 900px) 50vw, 20vw'
                    src={tool.src}
                    width={400}
                  />
                  <span className={style.exploreText}>
                    <span className={style.exploreCardTitle}>{tool.title}</span>
                    <span className={style.exploreTagline}>{tool.tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <section className={style.recent}>
        <H3>Recently registered</H3>

        <GrexTable
          className={style.table}
          grexes={recent}
          isLoading={isLoading}
          numRowsLoading={3}
        />

        <Link className={style.more} href='/search?type=hybrid'>
          See all recent registrations
          <ArrowRight aria-hidden className={style.moreArrow} size={16} />
        </Link>
      </section>
    </>
  );
}
