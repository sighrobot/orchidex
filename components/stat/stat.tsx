import { useStat } from 'lib/hooks/useStat';
import { getStatText, getStatTitle } from 'lib/stats';
import { Grex, Stat } from 'lib/types';
import cn from 'classnames';
import List from 'components/viz/list';
import { LinkPeople } from 'components/link';
import { Meter } from 'components/meter/meter';
import style from './style.module.scss';

export const StatBox = ({ className = '', children, heading }) => (
  <div className={cn(style.box, className)}>
    <h4 className={style.title}>{heading}</h4>
    {children}
  </div>
);

export const StatPercentage = ({ description, value }) => {
  return (
    <>
      <div>{description}</div>
      <Meter className={style.meter} value={value} />
    </>
  );
};

// People with a count each, e.g. who a person works with most. An empty name
// shows as N/A; the active person is bold rather than linked.
export const PeopleList = ({
  data,
  activeId,
  isLoading,
  limit = 5,
}: {
  data: { name: string | null; count: number }[];
  activeId?: string;
  isLoading?: boolean;
  limit?: number;
}) => (
  <List
    numItemsToLoad={2}
    className={style.statList}
    isLoading={isLoading}
    data={data.map((d) => ({
      score: d.count,
      grex: {
        genus: '',
        epithet: '',
        registrant_name: d.name || '__species',
      },
      id: d.name || '__species',
    }))}
    renderField={({ grex: g }) =>
      g.registrant_name === '__species' ? (
        <em>N/A</em>
      ) : activeId && activeId === g.registrant_name ? (
        <strong>{g.registrant_name}</strong>
      ) : g.registrant_name !== 'O/U' ? (
        <LinkPeople grex={g} kind='registrant' />
      ) : (
        g.registrant_name
      )
    }
    getCount={(d) => d.score}
    limit={limit}
  />
);

export const StatContent = ({
  stat,
  grex,
  data,
  activeId,
  isLoading,
}: {
  stat: Stat;
  grex: Grex;
  data: any;
  activeId: string;
  isLoading?: boolean;
}) => {
  switch (stat) {
    case 'registrant_genus_pct':
    case 'year_genus_pct': {
      const value = data?.[0]?.pct;
      const s = getStatText({ stat, grex, value });

      return value !== undefined ? (
        <StatPercentage description={s} value={value} />
      ) : (
        <em>Unfortunately, there was an error generating this statistic.</em>
      );
    }
    case 'seed_parent_registrants':
    case 'pollen_parent_registrants':
    case 'seed_parent_originators':
    case 'pollen_parent_originators': {
      return (
        <PeopleList
          activeId={activeId}
          data={data.map((d) => ({ name: d.r2, count: d.c }))}
          isLoading={isLoading}
        />
      );
    }
    default:
      return null;
  }
};

export const StatCard = ({
  grex,
  stat,
  activeId,
}: {
  grex: Grex;
  stat: Stat;
  activeId?: string;
}) => {
  const { data, loading } = useStat({ stat, grex });
  const t = getStatTitle({ stat });

  return (
    <StatBox className={style.stat} heading={t}>
      <StatContent
        isLoading={loading}
        activeId={activeId ?? ''}
        stat={stat}
        grex={grex}
        data={data}
      />
    </StatBox>
  );
};
