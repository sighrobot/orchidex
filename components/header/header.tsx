import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Magic } from '../search/magic';

import style from './style.module.scss';

export const Header = () => {
  const router = useRouter();

  return (
    <header className={style.header}>
      <nav>
        <h1 className={style.brand}>
          <Link href='/'>
            <a>
              <span style={{ color: 'orchid', fontStyle: 'italic' }}>
                Orchi
              </span>
              dex
            </a>
          </Link>
          <img src='/transparent.png' />
        </h1>

        <Link href='/recent'>
          <a
            title='Recently registered'
            className={router.pathname === '/recent' ? 'active' : undefined}
          >
            Recents
          </a>
        </Link>

        <Link href='/learn/hybridizer'>
          <a
            className={
              router.pathname === '/learn/hybridizer' ? 'active' : undefined
            }
          >
            Hybridizer
          </a>
        </Link>

        <Link href='/'>
          <a>Search</a>
        </Link>
      </nav>
    </header>
  );
};
