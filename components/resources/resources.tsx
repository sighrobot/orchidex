import { Grex } from 'lib/types';

import style from './style.module.scss';

const ORCHID_ROOTS_BASE_ID = 100000000;
export const EXTERNAL_LINK_PROPS = {
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
        {...EXTERNAL_LINK_PROPS}
        href={`https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${grex.id}`}
      >
        RHS
      </a>

      <a
        {...EXTERNAL_LINK_PROPS}
        href={`https://orchidroots.com/display/information/${
          blueNantaSpeciesId ?? String(orchidRootsIdNumber)
        }/?family=Orchidaceae`}
      >
        OrchidRoots
      </a>

      <a
        {...EXTERNAL_LINK_PROPS}
        href={`https://www.google.com/search?q=${encodeURIComponent(
          `"${grex.genus} ${grex.epithet}"`
        )}&tbm=isch`}
      >
        Google Images
      </a>
    </div>
  );
};
