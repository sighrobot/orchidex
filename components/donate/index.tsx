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
      💸 Support Orchidex
    </ExternalLink>
  );
}
