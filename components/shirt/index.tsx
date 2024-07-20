import Link from 'next/link';
import { EXTERNAL_LINK_PROPS } from 'components/resources/resources';

import style from './style.module.scss';

export default function Shirt() {
  return (
    <Link
      href='https://charliaorchids.com/Orchidex-Merch'
      {...EXTERNAL_LINK_PROPS}
    >
      <figure className={style.shirt}>
        <img alt='orchidex shirt' src='/shirt1.png' />
        <figcaption>
          <span>Buy</span>
        </figcaption>
      </figure>
    </Link>
  );
}
