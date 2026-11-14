'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import cn from 'classnames';

import { findSection, matchSection, Section } from 'lib/sections';

import style from './style.module.scss';

// A thin strip under the header on pages that belong to a group (Explore,
// About, a genus): where you are, and what else sits alongside it.
export const SectionStrip = ({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) => {
  const pathname = usePathname() ?? '';
  const { current, isBase } = matchSection(section, pathname);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On narrow screens the list scrolls sideways; keep the current page in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

  return (
    <nav aria-label={section.label} className={cn(style.sectionNav, className)}>
      <div className={style.inner}>
        <Link
          aria-current={isBase ? 'page' : undefined}
          className={style.section}
          href={section.base}
        >
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
                  data-label={page.label}
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

// The strip for the fixed sections in lib/sections.ts, picked by path.
export const SectionNav = () => {
  const section = findSection(usePathname() ?? '');
  return section ? <SectionStrip section={section} /> : null;
};

export default SectionNav;
