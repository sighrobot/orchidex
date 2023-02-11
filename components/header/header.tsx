import Link from 'next/link';
import { useRouter } from 'next/router';

import style from './style.module.scss';

export const Header = () => {
  const router = useRouter();

  return (
    <header className={style.header}>
      <nav>
        <h1 className={style.brand}>
          <Link href='/'>
            <span style={{ color: 'orchid', fontStyle: 'italic' }}>Orchi</span>
            dex
          </Link>
          <img src='/transparent.png' />
        </h1>

        <Link
          href='/recent'
          className={router.pathname === '/recent' ? 'active' : undefined}
        >
          Recents
        </Link>

        <Link
          href='/learn/hybridizer'
          className={
            router.pathname === '/learn/hybridizer' ? 'active' : undefined
          }
        >
          Hybridizer
        </Link>

        <Link href='/'>Search</Link>
      </nav>
    </header>
  );
};
