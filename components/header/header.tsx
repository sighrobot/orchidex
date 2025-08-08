import Link from 'next/link';
import { createClient } from 'lib/supabase/server';

import SearchBar from 'app/(noSearch)/search/components/bar';

import style from './style.module.scss';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_LINKS = [
  { path: 'recent', label: 'Recent' },
  { path: 'learn', label: 'Explore' },
  { path: 'about', label: 'About' },
];

const LinkList = () => (
  <NavigationMenu className='text-sm'>
    <NavigationMenuList>
      {NAV_LINKS.map((l) => (
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href={`/${l.path}`}>{l.label}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}

      <User />
    </NavigationMenuList>
  </NavigationMenu>
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

          <div className={style.mobileNav}>
            <DropdownMenu>
              <DropdownMenuTrigger className='cursor-pointer'>
                <span
                  style={{
                    fontSize: '30px',
                    top: '-3px',
                    position: 'relative',
                  }}
                >
                  &#9776;
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {NAV_LINKS.map((l) => (
                  <DropdownMenuItem>
                    <Link href={`/${l.path}`}>{l.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
