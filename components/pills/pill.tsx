import cn from 'classnames';

import styles from './pills.module.scss';

export type PillStates =
  | 'hypothetical'
  | 'species'
  | 'natural'
  | 'intergeneric'
  | 'primary';

type PillProps = {
  types: PillStates[];
};

export const Pill = ({ types }: PillProps) => (
  <span className={cn(styles.pill, ...types.map((t) => styles[t]))}>
    {types.join(' ')}
  </span>
);
