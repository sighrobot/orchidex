import Link from 'next/link';

import SearchBar from 'app/(noSearch)/search/components/bar';

import style from './style.module.scss';

const NAV_LINKS = [
  { path: 'recent', label: 'Recent' },
  // { path: 'search', label: 'Search' },
  { path: 'learn', label: 'Explore' },
  { path: 'about', label: 'About' },
];

const LinkList = () => (
  <ul className={style.linkList}>
    {NAV_LINKS.map((l) => (
      <li key={l.path}>
        <Link href={`/${l.path}`}>
          <span>
            {l.label}
            {l.new && (
              <sup>
                <mark>NEW</mark>
              </sup>
            )}
          </span>
        </Link>
      </li>
    ))}
  </ul>
);

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

        <div className={style.navLockup}>
          {hasSearch && <SearchBar className={style.search} />}

          <nav className={style.nav}>
            <LinkList />
          </nav>
        </div>
      </div>

      <details className={style.mobileNav}>
        <summary>&#9776;</summary>
        <nav>
          <LinkList />
        </nav>
      </details>
    </header>
  );
};
