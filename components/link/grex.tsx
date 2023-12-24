import Link, { LinkProps } from 'next/link';
import { kebabCase } from 'lodash';
import { formatName } from 'lib/string';
import { Grex } from 'lib/types';

type MinGrex = Pick<Grex, 'genus' | 'epithet'> & { id?: Grex['id'] };

export const makeHrefGrex = (grex: MinGrex) => {
  if (!grex.id) {
    return `/${encodeURIComponent(grex.genus)}/${encodeURIComponent(
      grex.epithet
    )}`;
  }

  const formattedName = formatName(grex);

  return `/${kebabCase(formattedName.long.genus)}/${kebabCase(
    formattedName.long.epithet
  )}/${grex.id}`;
};

export const LinkGrex = ({
  grex,
  children,
  ...linkProps
}: Omit<LinkProps, 'href'> & {
  grex: MinGrex;
  children: React.ReactNode;
}) => {
  return (
    <Link {...linkProps} href={makeHrefGrex(grex)}>
      {children}
    </Link>
  );
};
