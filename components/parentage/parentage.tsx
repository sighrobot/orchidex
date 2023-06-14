import { Name } from 'components/name/name';
import { Grex } from 'lib/types';
import { isSpecies } from 'components/pills/pills';

import styles from './style.module.scss';

type ParentageProps = {
  grex?: Grex;
  seedParent?: Grex;
  pollenParent?: Grex;
  hideLink?: boolean;
  shouldAbbreviateParentage?: boolean;
};

export const Parentage = ({
  grex,
  seedParent,
  pollenParent,
  hideLink,
  shouldAbbreviateParentage = true,
}: ParentageProps) => {
  if (!grex || isSpecies(grex)) {
    return null;
  }

  const {
    seed_parent_genus,
    seed_parent_epithet,
    pollen_parent_genus,
    pollen_parent_epithet,
  } = grex;

  return (
    <span className={styles.parentage}>
      {seed_parent_genus && seed_parent_epithet ? (
        <Name
          shouldAbbreviate={shouldAbbreviateParentage}
          link={!hideLink}
          linkAsSearch={!seedParent}
          grex={{
            genus: seed_parent_genus,
            epithet: seed_parent_epithet,
            ...seedParent,
          }}
        />
      ) : (
        '?'
      )}{' '}
      &times;{' '}
      {pollen_parent_genus && pollen_parent_epithet ? (
        <Name
          shouldAbbreviate={shouldAbbreviateParentage}
          link={!hideLink}
          linkAsSearch={!pollenParent}
          grex={{
            genus: pollen_parent_genus,
            epithet: pollen_parent_epithet,
            ...pollenParent,
          }}
        />
      ) : (
        '?'
      )}
    </span>
  );
};
