import Link from 'next/link';

import style from './style.module.scss';

export const Header = () => {
  return (
    <header className={style.header}>
      <h1 className={style.brand}>
        <Link href='/'>
          <span className={style.orchi}>Orchi</span>
          <span className={style.dex}>dex</span>
        </Link>
      </h1>

      <mark className={style.beta}>Beta</mark>

      <nav>
        <Link href='/recent'>Recent</Link>
        <Link href='/search'>Search</Link>
        <Link href='/about'>About</Link>

        {/* <Link
          href='/learn/hybridizer'
          className={
            pathname === '/learn/hybridizer' ? 'active' : undefined
          }
        >
          Hybridize
        </Link> */}
      </nav>
    </header>
  );
};
