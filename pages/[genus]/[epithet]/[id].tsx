import React from 'react';
import { kebabCase, orderBy } from 'lodash';

import { Container, Padded } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { fetchGrex } from 'lib/hooks/useGrex';
import { useProgeny } from 'lib/hooks/useProgeny';
import { useDate } from 'lib/hooks/useDate';
import Link from 'next/link';
import { Resources } from 'components/resources/resources';
import { description, formatName } from 'lib/string';
import { AncestryViz } from 'components/viz/ancestry';
import List from 'components/viz/list';
import { fetchGrexByName, useSpeciesAncestry } from 'lib/hooks/useAncestry';
import { Name } from 'components/name/name';
import { useRouter } from 'next/router';
import { Tabs } from 'components/tabs/tabs';
import { isSpecies } from 'components/pills/pills';

export async function getServerSideProps(context) {
  const { id, g, e } = context.query;

  if (parseInt(id, 10)) {
    const data = await fetchGrex(id);

    if (data) {
      return { props: { grex: data } };
    }
  }

  if (g && e) {
    const data = await fetchGrexByName({ genus: g, epithet: e });

    if (data) {
      return { props: { grex: data } };
    }
  }

  return {
    notFound: true,
  };
}

const SpeciesAncestry = ({ grex }) => {
  const speciesAncestry = useSpeciesAncestry(grex);

  return (
    <List
      data={speciesAncestry}
      getFields={(sa) => [sa.grex.epithet]}
      renderField={({ grex: g = {} }) => <Name grex={g} shouldAbbreviate />}
      getCount={(d) => d.score}
      renderCount={(score) => `${(Math.round(score * 1000) / 10).toFixed(1)} %`}
    />
  );
};

export const Grex = ({ grex }) => {
  const router = useRouter();
  const onDate = useDate({ d: grex?.date_of_registration });
  const progeny = useProgeny(grex);
  const name = formatName(grex);

  const byRegistrant = onDate.filter(
    (f) => f.id !== grex.id && f.registrant_name === grex?.registrant_name,
  );

  if (!grex) {
    return <Container>loading&hellip;</Container>;
  }

  React.useEffect(() => {
    const split = router.asPath.split('/');
    console.log(split);
    if (split.length === 3 || isNaN(parseInt(split[split.length - 1], 10))) {
      router.replace(
        `/${kebabCase(name.long.genus)}/${kebabCase(name.long.epithet)}/${
          grex.id
        }`,
      );
    }
  }, [router.asPath]);

  const isGrexSpecies = isSpecies(grex);

  return (
    <Container
      title={`${name.short.full} | Orchidex`}
      description={description(grex)}
    >
      <Padded style={{ background: 'white' }}>
        <GrexCard heading grex={grex} hideLink />
        <Resources grex={grex} />
      </Padded>

      <Tabs
        padding
        identifier={grex.id}
        config={[
          {
            label: 'Ancestry',
            disabled: isGrexSpecies,
            component: (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <AncestryViz grex={grex} />
              </div>
            ),
          },
          {
            label: 'Species Ancestors',
            disabled: isGrexSpecies,
            component: <SpeciesAncestry grex={grex} />,
          },
          {
            label: `Progeny`,
            count: progeny.length,
            component: (
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
          {
            label: `Same-Date`,
            count: byRegistrant.length,
            disabled: !grex?.date_of_registration,
            component: (
              <>
                {orderBy(byRegistrant, ['genus', 'epithet']).map(
                  (grexOnDate, idx) => {
                    return (
                      <GrexCard
                        key={`${idx}-${grexOnDate.id}`}
                        grex={grexOnDate}
                        hideReg
                      />
                    );
                  },
                )}
              </>
            ),
          },
        ]}
      />

      {'raw' in router.query && (
        <section>
          <details>
            <summary>Raw Data</summary>
            <div>
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
                            <Link href={href}>
                              <a target={target} rel={rel}>
                                {grex[k]}
                              </a>
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
            </div>
          </details>
        </section>
      )}
    </Container>
  );
};

export default Grex;