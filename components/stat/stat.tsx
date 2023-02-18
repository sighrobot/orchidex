import { useStat } from 'lib/hooks/useStat';
import { getStatText, getStatTitle } from 'lib/stats';
import { Grex, Stat } from 'lib/types';
import style from './style.module.scss';
import cn from 'classnames';
import List from 'components/viz/list';
import Link from 'next/link';
import { Meter } from 'components/meter/meter';

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

export const StatContent = ({
  stat,
  grex,
  data,
  activeId,
}: {
  stat: Stat;
  grex: Grex;
  data: any;
  activeId: string;
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
      const sum = data.reduce((acc, { c }) => acc + c, 0);
      return data.length > 0 ? (
        <List
          className={style.statList}
          data={data.map((d) => {
            // sometimes reg and orig names get flipped in the return columns
            const id = d.r1 === grex.registrant_name ? d.r2 : d.r1;
            return {
              score: d.c,
              grex: { genus: '', epithet: '', registrant_name: id },
              id,
            };
          })}
          renderField={({ grex: g = {} }) =>
            activeId && activeId === g.registrant_name ? (
              <strong>{g.registrant_name}</strong>
            ) : (
              <Link
                href={`/registrant/${encodeURIComponent(g.registrant_name)}`}
              >
                {g.registrant_name}
              </Link>
            )
          }
          getCount={(d) => d.score}
          renderCount={(score) => `${Math.round((score / sum) * 100)} %`}
          limit={5}
        />
      ) : (
        <em>
          The {stat.split('_')[0]} parents of hybrids registered by {activeId}{' '}
          have no recorded registrants.
        </em>
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
      {loading && 'Loading...'}
      {!loading && (
        <StatContent activeId={activeId} stat={stat} grex={grex} data={data} />
      )}
    </StatBox>
  );
};
