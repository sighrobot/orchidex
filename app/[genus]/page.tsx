import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

import { APP_TITLE } from 'app/constants';
import { fetchGenusMeta } from 'lib/fetchers/wikipedia';
import { capitalize } from 'lib/utils';
import { H2, H3 } from 'components/layout';
import { Padded } from 'components/container/container';
import RecentCards from './components/recent';
import Timeseries from './components/timeseries';

import style from './style.module.scss';
import RegistrantList from './components/registrants';
import { ParentageCTA } from 'app/learn/page';
import { StatCard } from 'components/stat/stat';
import { Sidebar } from './components/sidebar';
import GenusInput from 'components/genus-input';
import Router from 'next/dist/server/router';

export async function generateMetadata({
  params,
}: {
  params: { genus: string };
}): Promise<Metadata> {
  const genus = decodeURIComponent(params.genus);
  const capitalizedGenus = capitalize(genus);

  return {
    title: `${capitalizedGenus} orchid species and hybrids | ${APP_TITLE}`,
    description: `Explore the world of ${capitalizedGenus} orchid species and hybrids. Visualize their complex ancestries and learn about the people and organizations who grow and discover them.`,
  };
}

export default async function Genus({
  params: { genus } = { genus: '' },
} = {}) {
  const wikiMeta = await fetchGenusMeta(genus);
  const capitalizedGenus = capitalize(genus);

  return (
    <div className={style.genus}>
      <Padded className={style.header}>
        <section>
          <GenusInput value={genus} basePath='' />

          <H2>
            <em>{capitalizedGenus}</em>
          </H2>

          <p>
            {wikiMeta.extract ??
              `${capitalizedGenus} is a genus in the orchid family Orchidaceae.`}
          </p>

          {wikiMeta.extract && (
            <section>
              <cite>
                <Link href={wikiMeta.content_urls.desktop.page} target='_blank'>
                  Wikipedia
                </Link>{' '}
              </cite>{' '}
              <cite>
                <Link
                  href='https://creativecommons.org/licenses/by-sa/4.0/'
                  target='_blank'
                >
                  CC BY-SA 4.0
                </Link>
              </cite>
            </section>
          )}
        </section>

        <Timeseries id={`${genus}-hybrid-timeseries`} genus={genus} />
      </Padded>

      <div className={style.lists}>
        <Padded>
          <H3>Recently registered</H3>
          <RecentCards genus={genus} />
        </Padded>

        <Padded>
          <H3>Top registrants all-time</H3>
          <RegistrantList genus={genus} />
        </Padded>

        <Sidebar genus={genus} />
      </div>
    </div>
  );
}