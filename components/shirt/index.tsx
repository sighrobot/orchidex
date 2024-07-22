import ExternalLink from 'components/link/external';

import style from './style.module.scss';

export const SHIRT_TRACK_NAME = 'Buy t-shirt';

export default function Shirt({ page }: { page: string }) {
  return (
    <ExternalLink
      href='https://charliaorchids.com/Orchidex-Merch'
      trackArgs={[SHIRT_TRACK_NAME, { type: 'image', page }]}
    >
      <figure className={style.shirt}>
        <img alt='orchidex shirt' src='/shirt1.png' />
        <figcaption>
          <span>Buy</span>
        </figcaption>
      </figure>
    </ExternalLink>
  );
}
