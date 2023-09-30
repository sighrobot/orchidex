import Link from 'next/link';

import SearchBar from 'app/(noSearch)/search/components/bar';

import style from './style.module.scss';

export const Header = ({ hasSearch }) => {
  return (
    <header className={style.header}>
      <div className={style.inner}>
        <h1 className={style.brand}>
          <Link href='/'>
            <span className={style.orchi}>Orchi</span>
            <span className={style.dex}>dex</span>
          </Link>
        </h1>

        {hasSearch && <SearchBar className={style.search} hasButton={false} />}

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
      </div>
    </header>
  );
};
