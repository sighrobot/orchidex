import { fetchGrex } from 'lib/hooks/useGrex';
import { Grex as GrexType } from 'lib/types';
import Grex from 'pages/[genus]/[...params]';

export async function getServerSideProps(context) {
  const { s, p } = context.query;

  let seedParent: GrexType | undefined = undefined;
  let pollenParent: GrexType | undefined = undefined;

  if (parseInt(s, 10)) {
    seedParent = await fetchGrex(s);
  }

  if (parseInt(s, 10)) {
    pollenParent = await fetchGrex(p);
  }

  if (seedParent && pollenParent) {
    return {
      props: {
        grex: {
          id: '0000',
          hypothetical: true,
          genus: 'Hypothesis',
          epithet: 'Grex',
          date_of_registration: '2023-07-25',
          registrant_name: 'You',
          originator_name: 'You',
          seed_parent_genus: seedParent.genus,
          seed_parent_epithet: seedParent.epithet,
          pollen_parent_genus: pollenParent.genus,
          pollen_parent_epithet: pollenParent.epithet,
        },
        seedParent,
        pollenParent,
      },
    };
  }

  return {
    notFound: true,
  };
}

export const Hybridized = (props: {
  grex: Partial<GrexType>;
  seedParent: GrexType;
  pollenParent: GrexType;
}) => {
  return <Grex {...props} isHypothetical />;
};

export default Hybridized;
