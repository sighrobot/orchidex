import Link from 'next/link';
import { createClient } from 'lib/supabase/server';

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
    <User />
  </ul>
);

const User = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }

  return (
    <div className={style.user}>
      <Link className={style.user} href='/account'>
        👤
      </Link>
    </div>
  );
};

export const Header = async ({ hasSearch }) => {
  return (
    <header className={style.header}>
      <div className={style.inner}>
        <h1 className={style.brand}>
          <Link href='/'>
            <img alt='Orchidex logo' src='/orchidex.png' />
            <sup>™</sup>
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
