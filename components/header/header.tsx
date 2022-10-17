import Link from 'next/link';
import { useRouter } from 'next/router';
import { Magic } from '../search/magic';

import style from './style.module.scss';

export const Header = () => {
  const router = useRouter();

  const handleSubmit = ({ genus, epithet }) => {
    const params = [];

    if (genus) {
      params.push(`genus=${genus}`);
    }

    if (epithet) {
      params.push(`epithet=${epithet}`);
    }

    router.push(`/?${params.join('&')}`);
  };

  const handleChange = (grex) => {
    if (grex) {
      router.push(`/grex/${grex.id}`);
    }
  };

  return (
    <header className={style.header}>
      <nav>
        {/* <Link href="/viz">
          <a className={router.pathname === "/viz" ? "active" : undefined}>
            Treemap
          </a>
        </Link> */}

        <div>
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
        </div>

        <h1>
          <Link href='/'>
            <a>
              <span style={{ color: 'orchid' }}>Orchi</span>dex
            </a>
          </Link>
        </h1>

        <div>
          <Link href='/'>
            <a>Search</a>
          </Link>
        </div>
      </nav>
    </header>
  );
};
