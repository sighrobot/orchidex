import styles from './pills.module.scss';
import cn from 'classnames';

type PillStates =
  | 'hypothetical'
  | 'species'
  | 'natural'
  | 'intergeneric'
  | 'primary';

type PillProps = {
  types: PillStates[];
};

export const Pill = ({ types }: PillProps) => {
  return (
    <span className={cn(styles.pill, ...types.map((t) => styles[t]))}>
      {types.join(' ')}
    </span>
  );
};
