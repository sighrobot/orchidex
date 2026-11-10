import { Heart } from 'lucide-react';

import ExternalLink, { EXTERNAL_LINK_PROPS } from 'components/link/external';

import style from './style.module.scss';

export default function Donate() {
  return (
    <ExternalLink
      className={style.button}
      {...EXTERNAL_LINK_PROPS}
      href='https://buymeacoffee.com/orchidex'
      trackArgs={['Click Support Orchidex']}
    >
      <Heart aria-hidden className={style.icon} size={14} />
      Support Orchidex
    </ExternalLink>
  );
}
