import { isSpecies } from 'components/pills/pills';
import { formatName } from 'lib/string';
import { Grex } from 'lib/types';

import style from './style.module.scss';

const ORCHID_ROOTS_BASE_ID = 100000000;
const SHARED_PROPS = {
  target: '_blank',
  rel: 'noreferrer noopener',
};

type ResourcesProps = {
  grex: Grex;
  blueNantaSpeciesId?: string;
};

export const Resources = ({ grex, blueNantaSpeciesId }: ResourcesProps) => {
  const idNumber = parseInt(grex.id, 10);
  const orchidRootsIdNumber = ORCHID_ROOTS_BASE_ID + idNumber;

  return (
    <div className={style.resources}>
      <a
        {...SHARED_PROPS}
        href={`https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${grex.id}`}
      >
        RHS IOR
      </a>

      <a
        {...SHARED_PROPS}
        href={`https://bluenanta.com/display/information/${
          blueNantaSpeciesId ?? String(orchidRootsIdNumber)
        }/?family=Orchidaceae`}
      >
        BlueNanta
      </a>

      <a
        {...SHARED_PROPS}
        href={`https://www.google.com/search?q=${encodeURIComponent(
          `"${grex.genus} ${grex.epithet}"`,
        )}&tbm=isch`}
      >
        Google Images
      </a>
    </div>
  );
};
