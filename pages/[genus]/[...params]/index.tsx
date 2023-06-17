import React from 'react';
import { capitalize, kebabCase, orderBy } from 'lodash';

import { Container, Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { fetchGrex } from 'lib/hooks/useGrex';
import { useProgeny } from 'lib/hooks/useProgeny';
import Link from 'next/link';
import { Resources } from 'components/resources/resources';
import { description, formatName } from 'lib/string';
import { AncestryViz } from 'components/viz/ancestry';
import List from 'components/viz/list';
import { fetchGrexByName, useSpeciesAncestry } from 'lib/hooks/useAncestry';
import { Name } from 'components/name/name';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs } from 'components/tabs/tabs';
import { isNaturalHybrid, isSpecies } from 'components/pills/pills';
import { StatBox, StatCard } from 'components/stat/stat';
import style from './style.module.scss';
import { Grex as GrexType } from 'lib/types';

import { useWcvp } from 'lib/hooks/useWcvp';
import { ResponsiveTreeMapCanvas } from '@nivo/treemap';

export async function getServerSideProps(context) {
  const { genus: g, params } = context.query;
  const [e, id] = params;

  let grex: GrexType | undefined = undefined;

  if (parseInt(id, 10)) {
    grex = await fetchGrex(id);
  } else if (g && e) {
    grex = await fetchGrexByName({ genus: g, epithet: e });
  }

  if (grex) {
    return { props: { grex } };
  }

  return {
    notFound: true,
  };
}

export const SpeciesAncestry = ({ grex }) => {
  const { data, isLoading } = useSpeciesAncestry(grex);

  if (isLoading) {
    return <>Loading...</>;
  }

  return (
    <List
      className={style.speciesAncestry}
      data={data}
      getFields={(sa) => [sa.grex.epithet]}
      renderField={({ grex: g = {} }) => (
        <Name className={style.speciesAncestryName} grex={g} shouldAbbreviate />
      )}
      getCount={(d) => d.score}
      renderCount={(score) => `${(Math.round(score * 1000) / 10).toFixed(1)} %`}
    />
  );
};

export const Grex = ({ grex, seedParent, pollenParent }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const progeny = useProgeny(grex);
  const name = formatName(grex);
  const { data: wcvp = [] } = useWcvp(grex);
  const wcvpSpecies =
    wcvp.length === 1
      ? wcvp[0]
      : wcvp.filter((w) => w.taxon_rank === 'Species')[0];

  React.useEffect(() => {
    const split = pathname?.split('/') ?? [''];
    if (split.length === 3 || isNaN(parseInt(split[split.length - 1], 10))) {
      router.replace(
        `/${kebabCase(name.long.genus)}/${kebabCase(name.long.epithet)}/${
          grex.id
        }`,
      );
    }
  }, [pathname]);

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  const isGrexSpecies = isSpecies(grex);

  return (
    <Container
      title={`${name.short.full} | Orchidex`}
      description={description(grex)}
    >
      <Padded>
        <GrexCard
          heading
          grex={grex}
          seedParent={seedParent}
          pollenParent={pollenParent}
          hideLink
        />
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
        <Resources
          grex={grex}
          blueNantaSpeciesId={wcvpSpecies?.plant_name_id}
        />
      </Padded>

      <div className={style.content}>
        <Tabs
          padding
          renderToSide={
            <aside className={style.sidebar}>
              <StatBox heading='Genus Parentage'>
                <p>
                  Click below to view the <em>{grex.genus}</em> parentage map:
                </p>
                <br />
                <Link href={`/viz/${grex.genus.toLowerCase()}`}>
                  <div className={style.minimap}>
                    <ResponsiveTreeMapCanvas
                      isInteractive={false}
                      innerPadding={1}
                      borderWidth={0}
                      value='value'
                      enableLabel={false}
                      identity='id'
                      colors={(d: any) =>
                        `rgba(0,0,0, ${(d.data.value / 21) * 0.75 + 0.25})`
                      }
                      data={{
                        children: [
                          { value: 21, id: 8 },
                          { value: 13, id: 7 },
                          { value: 8, id: 6 },
                          { value: 5, id: 5 },
                          { value: 3, id: 4 },
                          { value: 2, id: 3 },
                          { value: 1, id: 2 },
                          { value: 1, id: 1 },
                        ],
                      }}
                    />
                  </div>
                </Link>
              </StatBox>
              {!isSpecies(grex) && !isNaturalHybrid(grex) && (
                <StatCard stat='registrant_genus_pct' grex={grex} />
              )}
              {!isSpecies(grex) && !isNaturalHybrid(grex) && (
                <StatCard stat='year_genus_pct' grex={grex} />
              )}
              {!isSpecies(grex) && grex.genus && grex.epithet && (
                <StatBox heading='Species Ancestry'>
                  <SpeciesAncestry grex={grex} />
                </StatBox>
              )}
            </aside>
          }
          config={[
            {
              label: 'Ancestry',
              disabled: isGrexSpecies,
              disablePadding: true,
              component: () => <AncestryViz grex={grex} />,
            },
            {
              label: `Progeny`,
              count: progeny.length,
              component: () => (
                <>
                  {orderBy(
                    progeny.filter((d) => d.synonym_flag.includes('not')),
                    ['date_of_registration', 'genus', 'epithet'],
                    ['desc'],
                  ).map((grexOnDate) => {
                    return <GrexCard key={grexOnDate.id} grex={grexOnDate} />;
                  })}
                </>
              ),
            },
          ]}
        />
      </div>

      {searchParams?.get('debug') && (
        <table>
          <tbody>
            {Object.keys(grex).map((k) => {
              const field = grex[k];
              let href;
              let rel;
              let target;

              switch (k) {
                case 'id':
                  href = `https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${field}`;
                  rel = 'noopener noreferrer';
                  target = '_blank';
                  break;
                case 'genus':
                  href = `/?genus="${field}"`;
                  break;
                case 'epithet':
                  href = `/?epithet="${field}"`;
                  break;
                case 'registrant_name':
                  href = `/?registrant_name="${field}"`;
                  break;
                case 'date_of_registration':
                  href = `/date/${field}`;
                  break;
                case 'seed_parent_genus':
                  href = `/?seed_parent_genus="${field}"`;
                  break;
                case 'seed_parent_epithet':
                  href = `/?seed_parent_epithet="${field}"`;
                  break;
                case 'pollen_parent_genus':
                  href = `/?pollen_parent_genus="${field}"`;
                  break;
                case 'pollen_parent_epithet':
                  href = `/?pollen_parent_epithet="${field}"`;
                  break;
                default:
                  break;
              }

              return (
                <tr key={k}>
                  <th>{k.replace(/_/g, ' ')}:</th>
                  <td>
                    {href ? (
                      <Link href={href} target={target} rel={rel}>
                        {grex[k]}
                      </Link>
                    ) : (
                      grex[k]
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Container>
  );
};

export default Grex;
