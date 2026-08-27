'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ResponsiveTreeMapCanvas } from '@nivo/treemap';
import { groupBy, uniqBy } from 'lodash';

import { H2 } from 'components/layout';
import { useTreemap } from 'lib/hooks/useTreemap';
import { makeHrefGrex } from 'components/link/grex';
import { useWcvp } from 'lib/hooks/useWcvp';
import { Grex } from 'lib/types';
import { capitalize } from 'lib/utils';

import GenusInput from 'components/genus-input';
import { ButtonSimple } from 'components/button-simple/button-simple';
import style from './style.module.scss';

type MapData = {
  name: string;
  value: number;
  zero?: boolean;
  one?: boolean;
};

// Parent epithets only expose a name, so species are detected the same way
// `isSpecies` does for a full grex: a lowercase, non-numeric first character.
const isSpeciesEpithet = (name: string) =>
  !!name &&
  name[0].toLowerCase() === name[0] &&
  !Number.isInteger(parseInt(name[0], 10));

const tally = (list: MapData[]) =>
  list.reduce(
    (acc, g) => {
      if (isSpeciesEpithet(g.name)) {
        acc.species += 1;
      } else {
        acc.hybrids += 1;
      }
      return acc;
    },
    { species: 0, hybrids: 0 }
  );

export default function Treemap({ genus }: { genus: string }) {
  React.useEffect(() => {
    (HTMLCanvasElement as any).prototype.getBBox = function () {
      return { width: this.offsetWidth, height: this.offsetHeight };
    };
  });
  const router = useRouter();

  const [minProgeny, setMinProgeny] = React.useState(0);

  const handleMinProgeny = (e) => setMinProgeny(-e.target.value);

  const [parent, setParent] = React.useState<'seed' | 'pollen' | null>(null);
  const [type, setType] = React.useState<'species' | 'hybrid' | 'all'>('all');

  const { data: wcvpSpecies, loading: wcvpSpeciesLoading } = useWcvp({
    genus,
  } as Grex);
  const speciesEpithets = wcvpSpecies.map((s) =>
    s.taxon_name.replace(`${capitalize(genus as string)} `, '')
  );

  const { data = [], isLoading: dataLoading } = useTreemap({
    genus: genus as string,
    parentType: parent,
  });

  const isLoading = dataLoading || wcvpSpeciesLoading;

  const combined: MapData[] = React.useMemo(
    () =>
      uniqBy(
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
          .filter((g) => g.name) // can't determine why a few records have null names :(
          .concat(
            speciesEpithets.map((s) => ({ name: s, value: 1, zero: true }))
          ),
        ({ name }) => name
      ),
    [parent, data, speciesEpithets]
  );

  // Everything matching the type filter, before the progeny threshold is
  // applied and before small values are condensed into grouped nodes.
  const preprocessed = React.useMemo(
    () =>
      combined.filter((g) => {
        if (type === 'species') {
          return isSpeciesEpithet(g.name);
        }

        if (type === 'hybrid') {
          return !isSpeciesEpithet(g.name);
        }

        return true;
      }),
    [combined.length, type] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Derived from `combined` rather than `preprocessed` so the summary always
  // reflects the current filters, even on renders where the memo below is
  // intentionally stale.
  const counts = React.useMemo(() => {
    const matchesType = (g: MapData) =>
      type === 'all' || (type === 'species') === isSpeciesEpithet(g.name);

    return {
      total: tally(combined),
      shown: tally(
        combined.filter(
          (g) => matchesType(g) && (g.zero ? 0 : g.value) >= minProgeny
        )
      ),
    };
  }, [combined, type, minProgeny]);

  const children = React.useMemo(() => {
    const groupedByCount = groupBy<MapData>(preprocessed, (d: any) =>
      d.zero ? 0 : d.value
    );

    const shouldCondense =
      typeof window === 'undefined' ||
      window.innerWidth / preprocessed.length < 0.3;

    const final: MapData[] = [];

    Object.keys(groupedByCount).forEach((c) => {
      if (!shouldCondense || parseInt(c, 10) > 1) {
        final.push(...(groupedByCount[c] as []));
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
            ]
      )
      .filter((s) => (s.zero ? 0 : s.one ? 1 : s.value) >= minProgeny)
      .sort((a, b) =>
        !shouldCondense
          ? a.value < b.value
            ? 1
            : -1
          : a.zero || a.one || a.value < b.value
          ? 1
          : -1
      );
  }, [preprocessed, minProgeny]);

  const handleParent = React.useCallback((e) => {
    if (e.target.name === 'both') {
      setParent(null);
    } else {
      setParent(e.target.name);
    }
  }, []);

  const handleType = React.useCallback(
    (e) => setType(e.target.name),
    [setType]
  );

  const handleReset = React.useCallback(() => {
    setType('all');
    setParent(null);
    setMinProgeny(0);
  }, []);

  const map = React.useMemo(() => {
    return (
      <div className={style.mapWrap}>
        {isLoading ? (
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
              const slice = d.id.slice(0, Math.max(d.width / 7, 2));
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
                  makeHrefGrex({
                    id: '',
                    genus: genus as string,
                    epithet: d.id,
                  })
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
  }, [data, genus, isLoading, router, children]);

  const capitalizedGenus = capitalize(genus);
  const isFiltered = type !== 'all' || minProgeny > 0;
  const isNeutral = !isFiltered && parent === null;

  return (
    <div className={style.treemap}>
      <div className={style.pageHeader}>
        <div>
          <GenusInput value={genus} basePath='/learn/parentage' />

          <H2>
            <em>{capitalizedGenus}</em> parentage
          </H2>

          <p>
            This visualization shows the frequency with which{' '}
            <Link href={`/${genus}`}>
              <em>{capitalizedGenus}</em>
            </Link>{' '}
            orchids are used in creating new hybrids.
          </p>

          <p className={style.counts}>
            {isLoading ? (
              <>&nbsp;</>
            ) : isFiltered ? (
              <>
                Showing <strong>{counts.shown.species.toLocaleString()}</strong>{' '}
                of {counts.total.species.toLocaleString()} species and{' '}
                <strong>{counts.shown.hybrids.toLocaleString()}</strong> of{' '}
                {counts.total.hybrids.toLocaleString()} hybrids.
              </>
            ) : (
              <>
                Showing all{' '}
                <strong>{counts.total.species.toLocaleString()}</strong> species
                and <strong>{counts.total.hybrids.toLocaleString()}</strong>{' '}
                hybrids.
              </>
            )}

            {!isLoading && !isNeutral && (
              <ButtonSimple className={style.reset} onClick={handleReset}>
                Reset
              </ButtonSimple>
            )}
          </p>
        </div>

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
              with at least <strong>{minProgeny}</strong> progeny{' '}
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
      </div>

      {map}
    </div>
  );
}
