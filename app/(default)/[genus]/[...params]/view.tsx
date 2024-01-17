'use client';

import React from 'react';
import { capitalize, kebabCase, orderBy } from 'lodash';

import { Container, Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';

import { useProgeny } from 'lib/hooks/useProgeny';
import Link from 'next/link';
import { Resources } from 'components/resources/resources';
import { formatName } from 'lib/string';
import { AncestryViz } from 'components/viz/ancestry';
import VizList from 'components/viz/list';
import { useSpeciesAncestry } from 'lib/hooks/useAncestry';
import { Name } from 'components/name/name';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs } from 'components/tabs/tabs';
import { isNaturalHybrid, isSpecies } from 'components/pills/pills';
import { StatBox, StatCard } from 'components/stat/stat';
import { Grex as GrexType } from 'lib/types';
import { useWcvp } from 'lib/hooks/useWcvp';
import List from 'components/list';

import style from './style.module.scss';

export const SpeciesAncestry = ({ grex, seedParent, pollenParent }) => {
  const { data, isLoading } = useSpeciesAncestry(
    grex.hypothetical ? [seedParent, pollenParent] : grex
  );

  return (
    <VizList
      className={style.speciesAncestry}
      isLoading={isLoading}
      data={data}
      numItemsToLoad={10}
      getFields={(sa) => [sa.grex.epithet]}
      renderField={({ grex: g = {} }) => (
        <Name className={style.speciesAncestryName} abbreviate grex={g} />
      )}
      getCount={(d) => d.score}
      renderCount={(score) => {
        const countString = (score * 100).toFixed(1);
        return `${countString === '0.0' ? '< 0.1' : countString} %`;
      }}
    />
  );
};

export default function GrexView({
  grex,
  seedParent,
  pollenParent,
  shouldRedirect = true,
}: {
  grex: GrexType;
  seedParent?: GrexType;
  pollenParent?: GrexType;
  shouldRedirect?: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: isProgenyLoading, data: progeny = [] } = useProgeny(grex);
  const name = formatName(grex);
  const { data: wcvp = [] } = useWcvp(grex);
  const wcvpSpecies =
    wcvp.length === 1
      ? wcvp[0]
      : wcvp.filter((w) => w.taxon_rank === 'Species')[0];

  React.useEffect(() => {
    if (!grex.hypothetical && shouldRedirect) {
      const split = pathname?.split('/') ?? [''];
      if (split.length === 3 || isNaN(parseInt(split[split.length - 1], 10))) {
        router.replace(
          `/${kebabCase(name.long.genus)}/${kebabCase(name.long.epithet)}/${
            grex.id
          }`
        );
      }
    }
  }, [pathname, grex.hypothetical, shouldRedirect]);

  const handleFullScreenOpen = () => setIsDialogOpen(true);
  const handleFullScreenClose = () => setIsDialogOpen(false);

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  const isGrexSpecies = isSpecies(grex);

  const Viz = (
    <AncestryViz
      grex={grex}
      seedParent={seedParent}
      pollenParent={pollenParent}
      isFullScreen={isDialogOpen}
      onFullScreenOpen={handleFullScreenOpen}
      onFullScreenClose={handleFullScreenClose}
    />
  );

  return (
    <>
      <Padded className={style.heading}>
        {!grex.hypothetical && (
          <GrexCard
            heading
            grex={grex}
            seedParent={seedParent}
            pollenParent={pollenParent}
            hideLink
          />
        )}
        {wcvpSpecies && (
          <div style={{ marginTop: '5px' }}>
            {[
              capitalize(wcvpSpecies.lifeform_description),
              wcvpSpecies.climate_description,
              wcvpSpecies.geographic_area,
            ]
              .filter((s) => s)
              .join('; ')}
          </div>
        )}
        {wcvpSpecies && (
          <div style={{ marginTop: '2.5px' }}>
            {wcvpSpecies.primary_author} {wcvpSpecies.first_published}
          </div>
        )}
        {!grex.hypothetical && (
          <Resources
            grex={grex}
            blueNantaSpeciesId={wcvpSpecies?.plant_name_id}
          />
        )}
      </Padded>

      <div className={style.content}>
        <Tabs
          padding
          renderToSide={
            <aside className={style.sidebar}>
              {!grex.hypothetical && (
                <StatBox heading='Genus Info'>
                  <p>
                    <Link
                      href={`/${grex.genus.toLowerCase()}`}
                      style={{ textDecoration: 'underline' }}
                    >
                      Learn more about <em>{grex.genus}</em> species and
                      hybrids!
                    </Link>
                  </p>
                </StatBox>
              )}
              {!grex.hypothetical &&
                !isSpecies(grex) &&
                !isNaturalHybrid(grex) && (
                  <StatCard stat='registrant_genus_pct' grex={grex} />
                )}
              {!grex.hypothetical &&
                !isSpecies(grex) &&
                !isNaturalHybrid(grex) && (
                  <StatCard stat='year_genus_pct' grex={grex} />
                )}
              {!isSpecies(grex) && grex.genus && grex.epithet && (
                <StatBox heading='Species Ancestry'>
                  <SpeciesAncestry
                    grex={grex}
                    seedParent={seedParent}
                    pollenParent={pollenParent}
                  />
                </StatBox>
              )}
            </aside>
          }
          config={[
            {
              label: 'Ancestry',
              disabled: isGrexSpecies,
              disablePadding: true,
              component: () => !isDialogOpen && Viz,
            },
            {
              label: `Progeny`,
              hidden: grex.hypothetical,
              count: progeny.length,
              component: () => (
                <List<GrexType>
                  items={orderBy(
                    progeny,
                    ['date_of_registration', 'genus', 'epithet'],
                    ['desc']
                  )}
                  renderItem={(item) => <GrexCard grex={item} />}
                  itemMinHeight={72}
                  numItemsToLoad={5}
                  isLoading={isProgenyLoading}
                />
              ),
            },
          ]}
        />
      </div>

      {isDialogOpen && (
        <dialog open className={style.dialog}>
          {Viz}
        </dialog>
      )}
    </>
  );
}
