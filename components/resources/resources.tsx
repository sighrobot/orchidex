import { Grex } from 'lib/types';
import ExternalLink from 'components/link/external';

import style from './style.module.scss';

const ORCHID_ROOTS_BASE_ID = 100000000;

type ResourcesProps = {
  grex: Grex;
  blueNantaSpeciesId?: string;
};

export const Resources = ({ grex, blueNantaSpeciesId }: ResourcesProps) => {
  const idNumber = parseInt(grex.id, 10);
  const orchidRootsIdNumber = ORCHID_ROOTS_BASE_ID + idNumber;

  return (
    <div className={style.resources}>
      <ExternalLink
        href={`https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${grex.id}`}
        trackArgs={['Click RHS', { grex: grex.id }]}
      >
        RHS
      </ExternalLink>

      <ExternalLink
        href={`https://orchidroots.com/display/information/${
          blueNantaSpeciesId ?? String(orchidRootsIdNumber)
        }/?family=Orchidaceae`}
        trackArgs={['Click OrchidRoots', { grex: grex.id }]}
      >
        OrchidRoots
      </ExternalLink>

      <ExternalLink
        href={`https://www.google.com/search?q=${encodeURIComponent(
          `"${grex.genus} ${grex.epithet}"`
        )}&tbm=isch`}
        trackArgs={['Click Google Images', { grex: grex.id }]}
      >
        Google Images
      </ExternalLink>
    </div>
  );
};
