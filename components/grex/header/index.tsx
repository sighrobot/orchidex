import cn from 'classnames';
import { capitalize } from 'lodash';

import { RegDate } from 'components/grex/date';
import { Name } from 'components/grex/name';
import { Parentage } from 'components/grex/parentage';
import { LinkPeople } from 'components/link';
import { isSpecies, Pills } from 'components/pills/pills';
import { Resources } from 'components/resources/resources';

import styles from './style.module.scss';
import type { Grex } from 'lib/types';

// The subset of a WCVP row the header shows for species.
type WcvpSpecies = {
  plant_name_id?: string;
  lifeform_description?: string;
  climate_description?: string;
  geographic_area?: string;
  primary_author?: string;
  first_published?: string;
};

type GrexHeaderProps = {
  grex: Grex;
  seedParent?: Grex;
  pollenParent?: Grex;
  wcvp?: WcvpSpecies;
  // Tints the header, used when the hybridizer finds an existing grex.
  emphasize?: boolean;
  hideResources?: boolean;
};

const UNKNOWN_PERSON = 'O/U';

const Person = ({
  grex,
  kind,
}: {
  grex: Grex;
  kind: 'registrant' | 'originator';
}) =>
  grex[`${kind}_name`] === UNKNOWN_PERSON ? (
    <>an unknown {kind}</>
  ) : (
    <LinkPeople grex={grex} kind={kind} />
  );

const Registration = ({ grex }: { grex: Grex }) => {
  if (
    !grex.date_of_registration ||
    grex.registrant_name?.includes('natural hybrid')
  ) {
    return null;
  }

  const hasOriginator =
    grex.originator_name && grex.originator_name !== grex.registrant_name;

  return (
    <p className={styles.line}>
      Registered <RegDate grex={grex} /> by{' '}
      <Person grex={grex} kind='registrant' />
      {hasOriginator && (
        <>
          , originated by <Person grex={grex} kind='originator' />
        </>
      )}
    </p>
  );
};

export const GrexHeader = ({
  grex,
  seedParent,
  pollenParent,
  wcvp,
  emphasize,
  hideResources,
}: GrexHeaderProps) => {
  const species = isSpecies(grex);
  const speciesDetails = wcvp
    ? [
        [capitalize(wcvp.lifeform_description ?? ''), wcvp.climate_description]
          .filter(Boolean)
          .join(', '),
        wcvp.geographic_area,
      ].filter(Boolean)
    : [];

  return (
    <header className={cn(styles.header, { [styles.emphasize]: emphasize })}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>
          <Name link={false} grex={grex} />
        </h1>
        <div className={styles.pills}>
          <Pills grex={grex} />
        </div>
      </div>

      {(!species || speciesDetails.length > 0) && (
        <p className={styles.summary}>
          {species ? (
            speciesDetails.join(' · ')
          ) : (
            <span className={styles.parentage}>
              <Parentage
                grex={grex}
                seedParent={seedParent}
                pollenParent={pollenParent}
              />
            </span>
          )}
        </p>
      )}

      <Registration grex={grex} />

      {wcvp?.primary_author && (
        <p className={styles.line}>
          Described by {wcvp.primary_author}
          {wcvp.first_published && ` ${wcvp.first_published}`}
        </p>
      )}

      {!hideResources && (
        <Resources
          className={styles.resources}
          grex={grex}
          blueNantaSpeciesId={wcvp?.plant_name_id}
        />
      )}
    </header>
  );
};
