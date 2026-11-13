'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cn from 'classnames';

import { findSection } from 'lib/sections';

import style from './style.module.scss';

// A thin strip under the header on pages that belong to a group (Explore,
// About): where you are, and what else sits alongside it.
export const SectionNav = () => {
  const pathname = usePathname();
  const found = findSection(pathname ?? '');
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On narrow screens the list scrolls sideways; keep the current page in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

  if (!found) {
    return null;
  }

  const { section, current } = found;

  return (
    <nav aria-label={section.label} className={style.sectionNav}>
      <div className={style.inner}>
        <Link className={style.section} href={section.base}>
          {section.label}
        </Link>

        <ul className={style.pages}>
          {section.pages.map((page) => {
            const isCurrent = page === current;
            return (
              <li key={page.href}>
                <Link
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(style.page, isCurrent && style.current)}
                  href={page.href}
                  ref={isCurrent ? activeRef : undefined}
                >
                  {page.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default SectionNav;
