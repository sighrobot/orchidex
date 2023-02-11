import styles from './pills.module.scss';

type PillStates =
  | 'hypothetical'
  | 'species'
  | 'natural'
  | 'intergeneric'
  | 'primary';

type PillProps = {
  type: PillStates;
};

export const Pill = ({ type }: PillProps) => {
  return (
    <span className={`${styles.pill} ${styles[type.toLowerCase()]}`}>
      {type}
    </span>
  );
};
