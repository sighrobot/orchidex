import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { APP_TITLE } from 'lib/constants';
import { fetchGenusMeta } from 'lib/fetchers/wikipedia';
import { capitalize } from 'lib/utils';
import { H2, H3 } from 'components/layout';
import { Padded } from 'components/container/container';
import GenusInput from 'components/genus-input';
import { GENUS_TO_ABBREVIATION } from 'lib/abbreviations';
import { searchUrl } from 'lib/search/params';
import { ParentageCard } from './components/parentage-card';
import RecentRegistrations from './components/recent';
import RegistrantList from './components/registrants';
import Timeseries from './components/timeseries';

import style from './style.module.scss';

type Params = Promise<{ genus: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { genus: rawGenus } = await params;
  const genus = decodeURIComponent(rawGenus);
  const capitalizedGenus = capitalize(genus);

  return {
    title: `${capitalizedGenus} orchid species and hybrids - ${APP_TITLE}`,
    description: `Explore the world of ${capitalizedGenus} orchid species and hybrids. Visualize their complex ancestries and learn about the people and organizations who grow and discover them.`,
  };
}

export default async function Genus({ params }: { params: Params }) {
  const { genus } = await params;

  if (!GENUS_TO_ABBREVIATION[capitalize(genus)]) {
    notFound();
  }

  const wikiMeta = await fetchGenusMeta(genus);
  const capitalizedGenus = capitalize(genus);

  return (
    <div className={style.genus}>
      {/* About the genus on the left, registrations per year on the right. */}
      <section className={style.top}>
        <Padded className={style.intro}>
          <GenusInput value={genus} basePath='' />

          <H2 className={style.title}>
            <em>{capitalizedGenus}</em>
          </H2>

          <p className={style.extract}>
            {wikiMeta.extract ??
              `${capitalizedGenus} is a genus in the orchid family Orchidaceae.`}
          </p>

          {wikiMeta.extract && wikiMeta.content_urls?.desktop?.page && (
            <p className={style.credit}>
              <Link href={wikiMeta.content_urls.desktop.page} target='_blank'>
                Wikipedia
              </Link>{' '}
              ·{' '}
              <Link
                href='https://creativecommons.org/licenses/by-sa/4.0/'
                target='_blank'
              >
                CC BY-SA 4.0
              </Link>
            </p>
          )}
        </Padded>

        <div className={style.chart}>
          <h3 className={style.chartTitle}>
            <em>{capitalizedGenus}</em> hybrids registered per year
          </h3>
          <Timeseries id={`${genus}-hybrid-timeseries`} genus={genus} />
        </div>
      </section>

      <div className={style.body}>
        <Padded className={style.main}>
          <H3>Recently registered</H3>
          <RecentRegistrations genus={genus} />

          <Link
            className={style.button}
            href={searchUrl({ genus: `"${genus}"`, type: 'hybrid' })}
          >
            All <em>{capitalizedGenus}</em> hybrids
            <ArrowRight aria-hidden className={style.arrow} size={16} />
          </Link>
        </Padded>

        <aside className={style.aside}>
          <Padded>
            <H3>Top registrants</H3>
            <RegistrantList genus={genus} />
          </Padded>

          <ParentageCard genus={genus} />
        </aside>
      </div>
    </div>
  );
}
