import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

import GrexView from 'app/(default)/[genus]/[...genusRouteParams]/view';
import { Padded } from 'components/container/container';
import { Name } from 'components/grex/name';
import { queryGrexById, queryGrexChild } from 'lib/queries/grex';
import { formatName } from 'lib/string';
import { Grex } from 'lib/types';

import Form from './form';
import { PendingProvider, Results } from './pending';
import style from './style.module.scss';

type SearchParams = Promise<{ s?: string; p?: string }>;

// Only plain numeric ids get as far as a query.
const toId = (v?: string) => (v && /^\d+$/.test(v) ? v : undefined);

// Crosses to start from, one of each kind, each within one genus and never
// registered in either direction.
const EXAMPLES: {
  s: string;
  p: string;
  kind: string;
  label: React.ReactNode;
}[] = [
  {
    s: '99694',
    p: '1043',
    kind: 'Primary',
    label: (
      <>
        <i>Den. cuthbertsonii</i> × <i>Den. kingianum</i>
      </>
    ),
  },
  {
    s: '1442',
    p: '30326',
    kind: 'Species × hybrid',
    label: (
      <>
        <i>Phal. gigantea</i> × <i>Phal.</i> Artemis
      </>
    ),
  },
  {
    s: '121544',
    p: '1039467',
    kind: 'Complex',
    label: (
      <>
        <i>Dlax.</i> Gripp’s Ghost × <i>Dlax.</i> Little Ghost
      </>
    ),
  },
];

const fetchCross = async (s?: string, p?: string) => {
  const ids = [s, p].filter(Boolean);
  const parents = ids.length ? await queryGrexById(ids.join(',')) : [];
  const seed = parents.find((g) => g.id === s);
  const pollen = parents.find((g) => g.id === p);
  const [registered] =
    seed && pollen ? await queryGrexChild(seed.id, pollen.id) : [];
  return { seed, pollen, registered };
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const { seed, pollen } = await fetchCross(toId(params.s), toId(params.p));

  if (!seed || !pollen) {
    return {
      title: 'Hybridizer tool - Learn | Orchidex',
      description:
        'Pick any two orchids and explore the combined ancestry of a cross between them.',
    };
  }

  const sName = formatName(seed).short.full;
  const pName = formatName(pollen).short.full;

  return {
    title: `${sName} × ${pName} - Hybridizer tool | Orchidex`,
    description: `Explore the combined ancestry of ${sName} × ${pName}, and whether the cross has been registered.`,
  };
}

// Shown until both parents are picked.
const EmptyState = ({ seed, pollen }: { seed?: Grex; pollen?: Grex }) => {
  const missing = seed ? 'pollen' : pollen ? 'seed' : null;
  return (
    <section className={style.empty}>
      <h3>
        {missing ? `Now pick a ${missing} parent` : 'Cross any two orchids'}
      </h3>
      <p>
        {missing
          ? `Once both parents are set you’ll see the ancestry their hybrid would have, and whether anyone has registered it.`
          : `Pick a seed parent and a pollen parent above to see the ancestry their hybrid would have, and whether anyone has registered it.`}
      </p>

      {!missing && (
        <div className={style.examples}>
          <span>Try</span>
          <ul>
            {EXAMPLES.map((e) => (
              <li key={`${e.s}-${e.p}`}>
                <Link
                  href={`/learn/hybridize?s=${e.s}&p=${e.p}`}
                  scroll={false}
                >
                  <span className={style.kind}>{e.kind}</span>
                  {e.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default async function Hybridize({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { seed, pollen, registered } = await fetchCross(
    toId(params.s),
    toId(params.p),
  );

  return (
    <PendingProvider>
      {/* useSearchParams needs <Suspense /> */}
      <Suspense>
        <Form />
      </Suspense>

      <Results>
        {seed && pollen ? (
          <>
            {registered ? (
              <p className={style.status} data-kind='registered'>
                <Check />
                This cross has already been registered
                {registered.seed_parent_id !== seed.id &&
                  ' with the parents reversed'}
                .
              </p>
            ) : (
              <Padded>
                <header className={style.hypothetical}>
                  <p className={style.status} data-kind='hypothetical'>
                    <Sparkles />
                    Not registered
                  </p>
                  <h1>
                    <Name grex={seed} /> <span className={style.cross}>×</span>{' '}
                    <Name grex={pollen} />
                  </h1>
                  <p>
                    No one has registered this cross with the RHS. Below is the
                    ancestry its hybrid would have, drawn from both parents’
                    registrations.
                  </p>
                </header>
              </Padded>
            )}

            <GrexView
              hybridizer
              shouldRedirect={false}
              grex={
                registered ??
                ({
                  id: `${seed.id}-${pollen.id}`,
                  hypothetical: true,
                  genus: ' ',
                  epithet: 'Your Hybrid',
                  seed_parent_id: seed.id,
                  seed_parent_genus: seed.genus,
                  seed_parent_epithet: seed.epithet,
                  pollen_parent_id: pollen.id,
                  pollen_parent_genus: pollen.genus,
                  pollen_parent_epithet: pollen.epithet,
                } as Grex)
              }
              seedParent={registered ? undefined : seed}
              pollenParent={registered ? undefined : pollen}
            />
          </>
        ) : (
          <EmptyState seed={seed} pollen={pollen} />
        )}
      </Results>
    </PendingProvider>
  );
}
