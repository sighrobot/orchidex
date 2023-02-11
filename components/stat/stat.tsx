import { useStat } from 'lib/hooks/useStat';
import { getStatSql, getStatText, getStatTitle } from 'lib/stats';
import { Grex, Stat } from 'lib/types';
import style from './style.module.scss';
import cn from 'classnames';

export const StatBox = ({ className = '', children, heading }) => (
  <div className={cn(style.box, className)}>
    <h4 className={style.title}>{heading}</h4>
    {children}
  </div>
);

export const StatCard = ({ grex, stat }: { grex: Grex; stat: Stat }) => {
  const q = getStatSql({ grex, stat });
  const { data, loading } = useStat({ stat, grex });
  const s = getStatText({ stat, grex, value: data?.[0]?.pct });
  const t = getStatTitle({ stat });

  const isValid = !loading && data?.[0]?.pct !== undefined;

  return (
    <StatBox className={style.stat} heading={t}>
      {loading && 'Loading...'}
      {isValid && <div>{s}</div>}
      {isValid && <meter value={data?.[0]?.pct} />}
      {!loading && !isValid && (
        <em>Unfortunately, there was an error generating this statistic.</em>
      )}
    </StatBox>
  );
};
