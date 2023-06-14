import Link from 'next/link';
import { usePathname } from 'next/navigation';

import style from './style.module.scss';

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className={style.header}>
      <h1 className={style.brand}>
        <Link href='/'>
          <span className={style.orchi}>Orchi</span>
          <span className={style.dex}>dex</span>
        </Link>
        {/* <img src='/black.png' /> */}
      </h1>

      <mark className={style.beta}>Beta</mark>

      <nav>
        <Link
          href='/recent'
          className={pathname === '/recent' ? 'active' : undefined}
        >
          Recent
        </Link>

        <Link href='/search'>Search</Link>

        {/* <Link
          href='/learn/hybridizer'
          className={
            pathname === '/learn/hybridizer' ? 'active' : undefined
          }
        >
          Hybridize
        </Link> */}

        <Link href='/about'>About</Link>
      </nav>
    </header>
  );
};
