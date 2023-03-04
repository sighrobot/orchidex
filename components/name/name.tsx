import { formatName } from 'lib/string';
import { Grex } from 'lib/types';
import { kebabCase } from 'lodash';
import Link from 'next/link';
import style from './style.module.scss';
import cn from 'classnames';

type NameProps = {
  className?: string;
  grex?: {
    id?: Grex['id'];
    genus: Grex['genus'];
    epithet: Grex['epithet'];
  };
  link?: boolean;
  linkAsSearch?: boolean;
  shouldAbbreviate?: boolean;
  as?: keyof JSX.IntrinsicElements;
};

export const grexToHref = (grex: Grex) => {
  const formattedName = formatName(grex);
  const href = grex.id
    ? `/${kebabCase(formattedName.long.genus)}/${kebabCase(
        formattedName.long.epithet,
      )}/${grex.id}`
    : `/${encodeURIComponent(grex.genus)}/${encodeURIComponent(grex.epithet)}`;
  return href;
};

export const Name = ({
  as = 'span',
  className,
  grex,
  link = true,
  linkAsSearch = false,
  shouldAbbreviate = false,
}: NameProps) => {
  if (grex) {
    const formattedName = formatName(grex);

    const genus = shouldAbbreviate
      ? formattedName.short.genus
      : formattedName.long.genus;
    const epithet = shouldAbbreviate
      ? formattedName.short.epithet
      : formattedName.long.epithet;

    const href = linkAsSearch
      ? `/${encodeURIComponent(grex.genus)}/${encodeURIComponent(grex.epithet)}`
      : `/${kebabCase(formattedName.long.genus)}/${kebabCase(
          formattedName.long.epithet,
        )}/${grex.id}`;

    const isSpecies =
      epithet &&
      isNaN(Number(epithet[0])) &&
      epithet[0] === epithet[0].toLowerCase();

    const content = (
      <>
        <em>{genus}</em> {isSpecies ? <em>{epithet}</em> : epithet}
      </>
    );
    const Component = as;
    return (
      <Component className={cn(style.name, className)}>
        {link ? (
          <Link
            href={href}
            as={
              linkAsSearch
                ? `/${encodeURIComponent(
                    formattedName.long.genus,
                  )}/${encodeURIComponent(formattedName.long.epithet)}`
                : undefined
            }
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </Component>
    );
  }

  return null;
};
