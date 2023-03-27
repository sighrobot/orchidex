import { Container } from 'components/container/container';
import { useRouter } from 'next/router';
import React from 'react';
import { ResponsiveTreeMapCanvas } from '@nivo/treemap';
import { groupBy, uniqBy } from 'lodash';
import { useTreemap } from 'lib/hooks/useTreemap';
import { grexToHref } from 'components/name/name';
import { useWcvp } from 'lib/hooks/useWcvp';
import { Grex } from 'lib/types';

import style from './style.module.scss';
import { capitalize } from 'lib/utils';

const DATA_THRESHOLD = 4000;

const Treemap = () => {
  React.useEffect(() => {
    (HTMLCanvasElement as any).prototype.getBBox = function () {
      return { width: this.offsetWidth, height: this.offsetHeight };
    };
  });

  const router = useRouter();
  const { genus = '' } = router.query;

  const [minProgeny, setMinProgeny] = React.useState(0);

  const handleMinProgeny = (e) => setMinProgeny(-e.target.value);

  const [parent, setParent] = React.useState<'seed' | 'pollen' | null>(null);
  const [type, setType] = React.useState<'species' | 'hybrid' | 'all'>('all');

  const { data: wcvpSpecies, loading: wcvpSpeciesLoading } = useWcvp({
    genus,
  } as Grex);
  const speciesEpithets = wcvpSpecies.map((s) =>
    s.taxon_name.replace(`${capitalize(genus as string)} `, ''),
  );

  const { data = [], isLoading } = useTreemap({
    genus: genus as string,
    parentType: parent,
  });

  const children = React.useMemo(() => {
    const preprocessed = uniqBy(
      data
        .map((g) => ({
          name: !parent
            ? g.parent
            : parent === 'seed'
            ? g.seed_parent_epithet
            : g.pollen_parent_epithet,
          value: Math.max(g.c, 1),
          zero: g.c === 0,
        }))
        .concat(
          speciesEpithets.map((s) => ({ name: s, value: 1, zero: true })),
        ),
      ({ name }) => name,
    ).filter((g: any) => {
      const isSpecies = g.name[0].toLowerCase() === g.name[0];
      if (type === 'species') {
        return isSpecies;
      }

      if (type === 'hybrid') {
        return !isSpecies;
      }

      return true;
    });

    const groupedByCount = groupBy(preprocessed, (d: any) =>
      d.zero ? 0 : d.value,
    );

    const shouldCondense =
      typeof window === 'undefined'
        ? DATA_THRESHOLD
        : window.innerWidth / preprocessed.length < 0.3;

    const final = [];

    Object.keys(groupedByCount).forEach((c) => {
      if (!shouldCondense || parseInt(c, 10) > 1) {
        final.push(...groupedByCount[c]);
      }
    });

    return final
      .concat(
        !shouldCondense
          ? []
          : [
              {
                name: `1 progeny`,
                value: groupedByCount[1]?.length,
                one: true,
              },
              {
                name: `0 progeny`,
                value: groupedByCount[0]?.length,
                zero: true,
              },
            ],
      )
      .filter((s) => (s.zero ? 0 : s.one ? 1 : s.value) >= minProgeny)
      .sort((a, b) =>
        !shouldCondense
          ? a.value < b.value
            ? 1
            : -1
          : a.zero || a.one || a.value < b.value
          ? 1
          : -1,
      );
  }, [data, genus, type, minProgeny, parent, speciesEpithets]);

  console.log({ isLoading, wcvpSpeciesLoading });

  const handleParent = React.useCallback((e) => {
    if (e.target.name === 'both') {
      setParent(null);
    } else {
      setParent(e.target.name);
    }
  }, []);

  const handleType = React.useCallback(
    (e) => setType(e.target.name),
    [setType],
  );

  const map = React.useMemo(() => {
    return (
      <div className={style.mapWrap}>
        {isLoading || wcvpSpeciesLoading ? (
          'Loading...'
        ) : (
          <ResponsiveTreeMapCanvas
            borderWidth={0}
            colors={(d: any) => {
              if (d.data.zero) {
                return 'rgba(0, 0, 0, 0.1)';
              }
              return `rgba(218, 112, 214, ${
                ((d.data.one ? 1 : d.value) / data[0]?.c ?? 1) * 0.75 + 0.25
              })`;
            }}
            tooltip={({ node }: any) => {
              if (node.data.zero && node.value > 1) {
                // grouped zero
                return (
                  <div className={style.tooltip}>
                    <strong>{node.value.toLocaleString()} orchids</strong>: 0
                    progeny
                  </div>
                );
              }
              if (node.data.one && node.value > 1) {
                // grouped one
                return (
                  <div className={style.tooltip}>
                    <strong>{node.value.toLocaleString()} orchids</strong>: 1
                    progeny
                  </div>
                );
              }
              return (
                <div className={style.tooltip}>
                  <strong>{node.id}</strong>: {node.data.zero ? 0 : node.value}{' '}
                  progeny
                </div>
              );
            }}
            data={{ children }}
            identity='name'
            innerPadding={1}
            outerPadding={1}
            label={(d) => {
              if (!d.id || d.width < 9 || d.height < 9) {
                return '';
              }
              const slice = d.id.slice(0, Math.max(d.width / 8, 2));
              if (
                (d.value / data[0]?.c > 0.02 && d.width > 16) ||
                d.width > 40 ||
                slice.length === d.id.length
              ) {
                return slice;
              }
              return '';
            }}
            labelTextColor={(d: any) =>
              `rgba(0, 0, 0, ${
                ((d.data.zero ? 0 : d.data.one ? 1 : d.value) /
                  (data[0] ? data[0]?.c || 1 : 1)) *
                  0.67 +
                0.33
              })`
            }
            leavesOnly
            onClick={(d: any) => {
              if (!d.data.zero && !d.data.one) {
                router.push(
                  grexToHref({ id: '', genus: genus as string, epithet: d.id }),
                );
              }
            }}
            onMouseMove={() => {}}
            orientLabel={false}
            value='value'
          />
        )}
      </div>
    );
  }, [children]);

  const capitalizedGenus = capitalize(genus as string);

  return (
    <Container
      className={style.treemap}
      heading={<em>{capitalizedGenus}</em>}
      title={`${genus} | Orchidex`}
    >
      <section>
        <p>
          This visualization shows the frequency with which{' '}
          <em>{capitalizedGenus}</em> orchids are used in creating new hybrids.
        </p>

        <div className={style.controlWrap}>
          <fieldset>
            <label>
              <input
                onChange={handleType}
                type='radio'
                radioGroup='type'
                name='all'
                checked={type === 'all'}
              />
              Any type
            </label>
            <label>
              <input
                onChange={handleType}
                type='radio'
                radioGroup='type'
                name='species'
                checked={type === 'species'}
              />
              Species
            </label>
            <label>
              <input
                onChange={handleType}
                type='radio'
                radioGroup='type'
                name='hybrid'
                checked={type === 'hybrid'}
              />
              Hybrid
            </label>
          </fieldset>

          <fieldset>
            <label>
              <input
                onChange={handleParent}
                type='radio'
                radioGroup='parent'
                name='both'
                checked={parent === null}
              />
              Any parent
            </label>
            <label>
              <input
                onChange={handleParent}
                type='radio'
                radioGroup='parent'
                name='seed'
                checked={parent === 'seed'}
              />
              Seed
            </label>
            <label>
              <input
                onChange={handleParent}
                type='radio'
                radioGroup='parent'
                name='pollen'
                checked={parent === 'pollen'}
              />
              Pollen
            </label>
          </fieldset>

          <fieldset>
            <label className={style.rangeLabel}>
              Hide &lt; <strong>{minProgeny}</strong> progeny{' '}
              <input
                type='range'
                min={-data[0]?.c}
                max={0}
                onChange={handleMinProgeny}
                step={1}
                value={-minProgeny}
              />
            </label>
          </fieldset>
        </div>
      </section>

      {map}
    </Container>
  );
};

export default Treemap;
