import GrexView from 'app/(default)/[genus]/[...params]/view';
import { fetchGrex } from 'lib/hooks/useGrex';
import { Grex as GrexType } from 'lib/types';
import { notFound } from 'next/navigation';

export default async function Hybridize(props: {
  grex: Partial<GrexType>;
  seedParent: GrexType;
  pollenParent: GrexType;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { s, p } = props.searchParams;
  let seedParent: GrexType | undefined = undefined;
  let pollenParent: GrexType | undefined = undefined;

  if (parseInt(s as string, 10)) {
    seedParent = await fetchGrex(s);
  }

  if (parseInt(p as string, 10)) {
    pollenParent = await fetchGrex(p);
  }

  if (seedParent && pollenParent) {
    return (
      <GrexView
        grex={{
          id: '0000',
          hypothetical: true,
          genus: 'Hypothesis',
          epithet: 'Grex',
          seed_parent_id: s as string,
          seed_parent_genus: seedParent.genus,
          seed_parent_epithet: seedParent.epithet,
          pollen_parent_id: p as string,
          pollen_parent_genus: pollenParent.genus,
          pollen_parent_epithet: pollenParent.epithet,
        }}
        seedParent={seedParent}
        pollenParent={pollenParent}
        isHypothetical
      />
    );
  }

  notFound();
}
