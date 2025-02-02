import { Grex } from 'lib/types';
import ExternalLink from 'components/link/external';

import style from './style.module.scss';

const ORCHID_ROOTS_BASE_ID = 100000000;

type ResourcesProps = {
  grex: Grex;
  blueNantaSpeciesId?: string;
};

export const Resources = ({ grex, blueNantaSpeciesId }: ResourcesProps) => {
  const hasIpni = Boolean(grex.ipni_id);
  const hasRhs = grex.ipni_id !== grex.id;
  const idNumber = parseInt(grex.id, 10);
  const orchidRootsIdNumber = ORCHID_ROOTS_BASE_ID + idNumber;

  return (
    <div className={style.resources}>
      {hasRhs && (
        <ExternalLink
          href={`https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${grex.id}`}
          trackArgs={['Click RHS', { grex: grex.id }]}
        >
          RHS
        </ExternalLink>
      )}

      {hasIpni && (
        <ExternalLink
          href={`https://powo.science.kew.org/taxon/${grex.ipni_id}`}
          trackArgs={['Click POWO', { grex: grex.id }]}
        >
          POWO
        </ExternalLink>
      )}

      {hasIpni && (
        <ExternalLink
          href={`https://www.ipni.org/n/${grex.ipni_id}`}
          trackArgs={['Click IPNI', { grex: grex.id }]}
        >
          IPNI
        </ExternalLink>
      )}

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
