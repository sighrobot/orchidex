import { formatName } from 'lib/string';
import { Grex } from 'lib/types';
import { kebabCase } from 'lodash';
import Link from 'next/link';
import style from './style.module.scss';

type NameProps = {
  grex?: {
    id?: Grex['id'];
    genus: Grex['genus'];
    epithet: Grex['epithet'];
  };
  link?: boolean;
  linkAsSearch?: boolean;
  shouldAbbreviate?: boolean;
};

export const Name = ({
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
      ? `/g/s?g=${grex.genus}&e=${grex.epithet}`
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
    return (
      <span className={style.name}>
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
            <a>{content}</a>
          </Link>
        ) : (
          content
        )}
      </span>
    );
  }

  return null;
};