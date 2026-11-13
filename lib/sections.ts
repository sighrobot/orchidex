import { EXPLORE_TOOLS } from 'lib/explore';

// Groups of related pages. Any page under a section's `base` path gets a strip
// under the header naming the section and linking to its other pages.
export type SectionPage = {
  label: string;
  href: string;
  // The path prefix that counts as being on this page, when it differs from
  // `href` (e.g. a link to one genus's chart that stands for every genus).
  match?: string;
};

export type Section = {
  label: string;
  base: string;
  pages: SectionPage[];
};

export const SECTIONS: Section[] = [
  {
    label: 'Explore',
    base: '/learn',
    pages: [
      { label: 'Overview', href: '/learn' },
      ...EXPLORE_TOOLS.map((tool) => ({
        label: tool.title,
        href: tool.href,
        match: tool.href.replace(/^(\/learn\/[^/]+).*/, '$1'),
      })),
    ],
  },
  {
    label: 'About',
    base: '/about',
    pages: [
      { label: 'Overview', href: '/about' },
      { label: 'Our data', href: '/about/data' },
    ],
  },
];

const isWithin = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const findSection = (pathname: string) => {
  const section = SECTIONS.find((s) => isWithin(pathname, s.base));
  if (!section) {
    return null;
  }

  // The most specific match wins, so "Overview" only lights up on the base path.
  const current = section.pages
    .filter((p) =>
      p.href === section.base
        ? pathname === section.base
        : isWithin(pathname, p.match ?? p.href),
    )
    .sort((a, b) => (b.match ?? b.href).length - (a.match ?? a.href).length)[0];

  return { section, current };
};
