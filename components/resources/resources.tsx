import cn from 'classnames';
import { ArrowUpRight } from 'lucide-react';

import ExternalLink from 'components/link/external';
import { Grex } from 'lib/types';

import style from './style.module.scss';

const ORCHID_ROOTS_BASE_ID = 100000000;

type ResourcesProps = {
  className?: string;
  grex: Grex;
  blueNantaSpeciesId?: string;
};

export const Resources = ({
  className,
  grex,
  blueNantaSpeciesId,
}: ResourcesProps) => {
  const hasIpni = Boolean(grex.ipni_id);
  const hasRhs = grex.ipni_id !== grex.id;
  const idNumber = parseInt(grex.id, 10);
  const orchidRootsIdNumber = ORCHID_ROOTS_BASE_ID + idNumber;

  type ResourceLink = {
    label: string;
    href: string;
    event: string;
  };
  const links = [
    hasRhs && {
      label: 'RHS',
      href: `https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp?ID=${grex.id}`,
      event: 'Click RHS',
    },
    hasIpni && {
      label: 'POWO',
      href: `https://powo.science.kew.org/taxon/${grex.ipni_id}`,
      event: 'Click POWO',
    },
    hasIpni && {
      label: 'IPNI',
      href: `https://www.ipni.org/n/${grex.ipni_id}`,
      event: 'Click IPNI',
    },
    {
      label: 'OrchidRoots',
      href: `https://orchidroots.com/display/summary/orchidaceae/${
        blueNantaSpeciesId ?? String(orchidRootsIdNumber)
      }/`,
      event: 'Click OrchidRoots',
    },
    {
      label: 'Google Images',
      href: `https://www.google.com/search?q=${encodeURIComponent(
        `"${grex.genus} ${grex.epithet}"`
      )}&tbm=isch`,
      event: 'Click Google Images',
    },
  ].filter((l): l is ResourceLink => Boolean(l));

  return (
    <nav className={cn(style.resources, className)} aria-label='Elsewhere'>
      <ul>
        {links.map(({ label, href, event }) => (
          <li key={label}>
            <ExternalLink href={href} trackArgs={[event, { grex: grex.id }]}>
              {label}
              <ArrowUpRight aria-hidden className={style.arrow} />
            </ExternalLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
