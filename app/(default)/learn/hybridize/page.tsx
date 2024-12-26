import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchGrex } from 'lib/fetchers/grex';
import { Grex, Grex as GrexType } from 'lib/types';
import GrexView from 'app/(default)/[genus]/[...genusRouteParams]/view';
import { fetchGrexChild } from 'lib/fetchers/grex-child';
import { formatName } from 'lib/string';
import Form from './form';

import style from './style.module.scss';

type SearchParams = Promise<{ s: string; p: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { s, p } = await searchParams;
  if (!s || !p) {
    return {
      title: 'Explore ancestry of any two orchids - Orchidex',
      description:
        'Explore the ancestry of any two orchids using the Hybridize feature, only on Orchidex.',
    };
  }

  const [sGrex, pGrex] = await fetchGrex(`${s},${p}`);

  const sName = formatName(sGrex).short.full;
  const pName = formatName(pGrex).short.full;

  return {
    title: `Explore ancestry of ${sName} and ${pName} - Orchidex`,
    description: `Explore the ancestry of ${sName} and ${pName} using the Hybridize feature, only on Orchidex.`,
  };
}

export default async function Hybridize({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { s, p } = await searchParams;
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

  // useSearchParams needs <Suspense />
  return (
    <>
      <Suspense>
        <Form />
      </Suspense>

      {selectedSeedParent && selectedPollenParent ? (
        <GrexView
          hybridizer
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
          Ancestry information will be displayed here after selecting seed and
          pollen parents.
        </aside>
      )}
    </>
  );
}
