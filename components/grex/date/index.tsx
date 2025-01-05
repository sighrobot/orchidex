import { Grex } from 'lib/types';

export const RegDate = ({ grex }: { grex: Grex }) => {
  const dateStr = new Date(`${grex.date_of_registration}T00:00:00`)
    .toString()
    .slice(4, 15);

  return dateStr;
};
