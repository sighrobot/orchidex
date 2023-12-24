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
  as?: React.FC | keyof JSX.IntrinsicElements;
};

export const Name = ({
  as = 'span',
  className,
  grex,
  link = true,
}: NameProps) => {
  if (grex) {
    const formattedName = formatName(grex);
    const genus = formattedName.short.genus;
    const epithet = formattedName.short.epithet;

    const content = (
      <>
        <em>{genus}</em>{' '}
        {isSpecies(grex as Grex) ? <em>{epithet}</em> : epithet}
      </>
    );
    const Component = as;
    return (
      <Component className={cn(style.name, className)}>
        {link ? <LinkGrex grex={grex}>{content}</LinkGrex> : content}
      </Component>
    );
  }

  return null;
};
