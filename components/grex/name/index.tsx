import cn from 'classnames';
import { formatName } from 'lib/string';
import { Grex } from 'lib/types';
import { LinkGrex } from 'components/link';
import { isSpecies } from 'components/pills/pills';

import style from './style.module.scss';

type NameProps = {
  className?: string;
  grex?: {
    id?: Grex['id'];
    genus: Grex['genus'];
    epithet: Grex['epithet'];
  };
  link?: boolean;
  abbreviate?: boolean;
};

export const Name = ({
  className,
  grex,
  link = true,
  abbreviate,
}: NameProps) => {
  if (grex) {
    const formattedName = formatName(grex);
    const nameVersion = formattedName[abbreviate ? 'short' : 'long'];
    const genus = nameVersion.genus;
    const epithet = nameVersion.epithet;

    const content = (
      <>
        <em>{genus}</em>{' '}
        {isSpecies(grex as Grex) ? <em>{epithet}</em> : epithet}
      </>
    );
    return (
      <span className={cn(style.name, className)}>
        {link ? (
          <LinkGrex prefetch={false} grex={grex}>
            {content}
          </LinkGrex>
        ) : (
          content
        )}
      </span>
    );
  }

  return null;
};
