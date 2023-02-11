import { Container } from 'components/container/container';
import { useRouter } from 'next/router';
import React from 'react';
import { ResponsiveTreeMap, ResponsiveTreeMapCanvas } from '@nivo/treemap';
import { countBy } from 'lodash';
import { APP_URL } from 'lib/constants';
import { Tabs } from 'components/tabs/tabs';

const Treemap = () => {
  const router = useRouter();
  const { genus = '' } = router.query;
  const [parent, setParent] = React.useState('seed');
  const [type, setType] = React.useState<'species' | 'hybrid' | 'all'>('all');

  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      if (genus) {
        const fetched = await fetch(`${APP_URL}/api/parentGenus/${genus}`);
        const json = await fetched.json();

        setData(json);
      }
    })();
  }, [genus]);

  const filtered = React.useMemo(
    () => data.filter((d) => d[`${parent}_parent_genus`] === genus),
    [parent, genus, data],
  );

  const grouped = React.useMemo(
    () =>
      countBy(
        filtered,
        (d) =>
          `${d[`${parent}_parent_genus`]} ${d[`${parent}_parent_epithet`]}`,
      ),
    [filtered, parent],
  );

  const children = React.useMemo(
    () =>
      Object.keys(grouped)
        .map((g) => ({
          name: g.split(`${genus} `)[1],
          value: grouped[g],
        }))
        .filter((g) => {
          if (g.value <= 1) return false;
          const isSpecies = g.name[0].toLowerCase() === g.name[0];
          if (type === 'species') {
            return isSpecies;
          }

          if (type === 'hybrid') {
            return !isSpecies;
          }

          return true;
        })
        .sort((a, b) => (a.value < b.value ? 1 : -1)),
    [grouped, genus, type],
  );

  const handleParent = React.useCallback(
    (c) => setParent(c.label.split(' ')[0].toLowerCase()),
    [setParent],
  );

  const handleType = React.useCallback(
    (e) => setType(e.target.name),
    [setType],
  );

  const map = React.useMemo(() => {
    return (
      <div style={{ height: '800px' }}>
        <ResponsiveTreeMapCanvas
          data={{ children: children }}
          leavesOnly
          borderColor='white'
          orientLabel={false}
          outerPadding={1}
          labelTextColor='#333'
          colors={(d) =>
            `rgb(255, ${(1 - d.value / children[0]?.value ?? 1) * 255}, 128)`
          }
          nodeOpacity={1}
          label={(d) => {
            if (!d.id || d.width < 12 || d.height < 12) {
              return '';
            }
            if (d.labelRotation === 0) {
              return d.id.slice(0, d.width / 7);
            }
            return d.id.slice(0, d.height / 8);
          }}
          value='value'
          identity='name'
          animate={false}
          isInteractive
        />
      </div>
    );
  }, [children]);

  return (
    <Container title={`${genus} | Orchidex`}>
      <h2>{genus}</h2>

      <div>
        <label>
          <input
            onChange={handleType}
            type='radio'
            radioGroup='type'
            name='all'
            checked={type === 'all'}
          />
          all
        </label>
        <label>
          <input
            onChange={handleType}
            type='radio'
            radioGroup='type'
            name='species'
            checked={type === 'species'}
          />
          species
        </label>
        <label>
          <input
            onChange={handleType}
            type='radio'
            radioGroup='type'
            name='hybrid'
            checked={type === 'hybrid'}
          />
          hybrid
        </label>
      </div>

      <Tabs
        padding={false}
        onClick={handleParent}
        config={[
          { label: 'Seed Parent', component: map },
          { label: 'Pollen Parent', component: map },
        ]}
      />
    </Container>
  );
};

export default Treemap;
