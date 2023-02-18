import cn from 'classnames';
import style from './style.module.scss';

export const Meter = ({
  className = '',
  value,
}: {
  className?: string;
  value: number;
}) => {
  return (
    <div className={cn(style.meter, className)}>
      <div className={style.track} />
      <div className={style.value} style={{ width: `${value * 100}%` }} />
    </div>
  );
};
