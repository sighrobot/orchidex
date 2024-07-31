import Link, { LinkProps } from 'next/link';
import { Grex } from 'lib/types';

type PeopleKind = 'registrant' | 'originator';
type MinGrex = Pick<Grex, 'registrant_name'>;

export const makeHrefPeople = (grex: MinGrex, kind: PeopleKind) => {
  return `/registrant/${encodeURIComponent(grex[`${kind}_name`])}`;
};

export const LinkPeople = ({
  grex,
  kind,
  ...linkProps
}: Omit<LinkProps, 'href'> & {
  grex: MinGrex;
  kind: PeopleKind;
}) => {
  return (
    <Link {...linkProps} href={makeHrefPeople(grex, kind)} prefetch={false}>
      {grex[`${kind}_name`]}
    </Link>
  );
};
