import { fetchGrex } from 'lib/hooks/useGrex';
import { Grex, Grex as GrexType } from 'lib/types';
import GrexView from 'app/(default)/[genus]/[...params]/view';
import { fetchGrexChild } from 'lib/hooks/useGrexChild';
import Form from './form';

import style from './style.module.scss';

export default async function Hybridize({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { s, p } = searchParams;
  let selectedSeedParent: GrexType | undefined = undefined;
  let selectedPollenParent: GrexType | undefined = undefined;
  let existingGrex: GrexType | undefined = undefined;

  const sId = parseInt(s as string, 10);
  const pId = parseInt(p as string, 10);

  if (sId && pId) {
    const parents = await fetchGrex(`${sId},${pId}`);
    selectedSeedParent = parents.find((parent) => parent.id === s);
    selectedPollenParent = parents.find((parent) => parent.id === p);
  } else if (sId) {
    [selectedSeedParent] = await fetchGrex(s);
  } else if (pId) {
    [selectedPollenParent] = await fetchGrex(p);
  }

  if (s && p) {
    [existingGrex] = await fetchGrexChild(s as string, p as string);
  }

  return (
    <>
      <Form />

      {selectedSeedParent && selectedPollenParent ? (
        <GrexView
          shouldRedirect={false}
          grex={
            existingGrex ??
            ({
              id: `${selectedSeedParent.id}-${selectedPollenParent.id}`,
              hypothetical: true,
              genus: ' ',
              epithet: 'Your Hybrid',
              seed_parent_id: s as string,
              seed_parent_genus: selectedSeedParent.genus,
              seed_parent_epithet: selectedSeedParent.epithet,
              pollen_parent_id: p as string,
              pollen_parent_genus: selectedPollenParent.genus,
              pollen_parent_epithet: selectedPollenParent.epithet,
            } as Grex)
          }
          seedParent={existingGrex ? undefined : selectedSeedParent}
          pollenParent={existingGrex ? undefined : selectedPollenParent}
        />
      ) : (
        <aside className={style.empty}>
          The ancestry of your hybrid will appear here after selecting a seed
          and pollen parent.
        </aside>
      )}
    </>
  );
}
