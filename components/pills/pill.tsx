'use client';

import cn from 'classnames';

import styles from './pills.module.scss';

export type PillStates =
  | 'hypothetical'
  | 'species'
  | 'natural'
  | 'intergeneric'
  | 'primary';

const EXPLAINERS_BY_TYPE: Record<
  Exclude<PillStates, 'hypothetical'>,
  string
> = {
  species:
    'A species is an orchid that was originally found growing in the wild.',
  natural:
    'A natural hybrid is a hybrid whose parents are species, that arose naturally in the wild.',
  intergeneric:
    'An intergeneric hybrid is a hybrid whose parents are of different genera.',
  primary: 'A primary hybrid is a hybrid whose parents are both species.',
};

type PillProps = {
  isInteractive?: boolean;
  types: PillStates[];
};

export const Pill = ({ isInteractive = true, types }: PillProps) => {
  const handleClick = isInteractive
    ? () => alert(types.map((t) => EXPLAINERS_BY_TYPE[t]).join('\n\n'))
    : undefined;

  return (
    <span
      onClick={handleClick}
      className={cn(styles.pill, ...types.map((t) => styles[t]), {
        [styles.interactive]: isInteractive,
      })}
    >
      {types.join(' ')}
    </span>
  );
};
