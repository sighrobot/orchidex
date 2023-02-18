import Link from 'next/link';
import { useRouter } from 'next/router';

import style from './style.module.scss';

export const Header = () => {
  const router = useRouter();

  return (
    <header className={style.header}>
      <h1 className={style.brand}>
        <Link href='/'>
          <span style={{ color: 'orchid', fontStyle: 'italic' }}>Orchi</span>
          dex
        </Link>
        {/* <img src='/black.png' /> */}
      </h1>
      <nav>
        <Link
          href='/recent'
          className={router.pathname === '/recent' ? 'active' : undefined}
        >
          Recent
        </Link>

        <Link href='/search'>Search</Link>

        {/* <Link
          href='/learn/hybridizer'
          className={
            router.pathname === '/learn/hybridizer' ? 'active' : undefined
          }
        >
          Hybridize
        </Link> */}

        {/* <Link href='/about'>About</Link> */}
      </nav>
    </header>
  );
};
