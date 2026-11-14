import { EXPLORE_TOOLS } from 'lib/explore';

// Groups of related pages. Any page under a section's `base` path gets a strip
// under the header naming the section and linking to its other pages. The
// section's own label links to `base`, so `pages` doesn't list it.
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
    pages: [{ label: 'Our data', href: '/about/data' }],
  },
];

const isWithin = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Which of a section's pages `pathname` is on. The most specific match wins;
// no match means the section's base page or something else inside it.
export const matchSection = (section: Section, pathname: string) => {
  const current = section.pages
    .filter((p) => isWithin(pathname, p.match ?? p.href))
    .sort((a, b) => (b.match ?? b.href).length - (a.match ?? a.href).length)[0];

  return { current, isBase: pathname === section.base };
};

export const findSection = (pathname: string) =>
  SECTIONS.find((s) => isWithin(pathname, s.base)) ?? null;
