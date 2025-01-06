import { Grex } from 'lib/types';

export const RegDate = ({
  className,
  grex,
}: {
  className?: string;
  grex: Grex;
}) => {
  const parts = new Date(`${grex.date_of_registration}T00:00:00`)
    .toString()
    .slice(4, 15)
    .split(' ');

  const dateStr = `${parts[0]} ${parseInt(parts[1], 10)} ${parts[2]}`;

  return <span className={className}>{dateStr}</span>;
};
