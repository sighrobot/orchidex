import React from 'react';
import { Container } from 'components/container/container';
import { GrexCard } from 'components/grex/grex';
import { Name } from 'components/name/name';
import { SearchParentage } from 'components/search/parentage';
import { AncestryViz } from 'components/viz/ancestry';
import List from 'components/viz/list';
import { useSpeciesAncestry } from 'lib/hooks/useAncestry';
import { Grex } from 'lib/types';
import { Magic } from 'components/search/magic';
import { fetchGrex } from 'lib/hooks/useGrex';
import router, { useRouter } from 'next/router';
import { abbreviateGenus } from 'lib/string';

// const grex = {
//   id: "0123456789",
//   genus: "Phraglax",
//   epithet: "Ghost Berry",
//   seed_parent_genus: "Phragmipedium",
//   seed_parent_epithet: "Acker's Berry",
//   pollen_parent_genus: "Dendrophylax",
//   pollen_parent_epithet: "Gripp's Ghost",
//   hypothetical: true,
// };

export async function getServerSideProps(context) {
  const { seed: s, pollen: p } = context.query;

  const [seed, pollen] = await Promise.all([fetchGrex(s), fetchGrex(p)]);

  if (seed && pollen) {
    return { props: { seed, pollen } };
  }

  return { props: {} };
}

const INITIAL_STATE = {
  id: 'hypothetical',
  genus: 'Hypothesis',
  epithet: 'Grex',
  seed_parent_genus: '',
  seed_parent_epithet: '',
  pollen_parent_genus: '',
  pollen_parent_epithet: '',
  hypothetical: true,
};

const Hybridizer = ({ seed, pollen }) => {
  const router = useRouter();
  const [grex, setGrex] = React.useState(null);
  const [state, setState] = React.useState(INITIAL_STATE);
  const [seedParent, setSeedParent] = React.useState<Grex | null>(seed);
  const [pollenParent, setPollenParent] = React.useState<Grex | null>(pollen);
  const speciesAncestry = useSpeciesAncestry(grex);

  const handleSeedChange = (g: Grex) => {
    const field: Pick<Grex, 'seed_parent_genus' | 'seed_parent_epithet'> = {};

    if (g) {
      field.seed_parent_genus = g.genus;
      field.seed_parent_epithet = g.epithet;
    }

    setSeedParent(g);
    setState((s) => ({ ...s, ...field }));
  };

  const handlePollenChange = (g: Grex) => {
    const field: Pick<Grex, 'pollen_parent_genus' | 'pollen_parent_epithet'> =
      {};

    if (g) {
      field.pollen_parent_genus = g.genus;
      field.pollen_parent_epithet = g.epithet;
    }

    setPollenParent(g);
    setState((s) => ({ ...s, ...field }));
  };

  const handleSubmit = () => {
    setGrex(state);
    router.replace(
      `/learn/hybridizer?seed=${seedParent.id}&pollen=${pollenParent.id}`,
    );
  };

  React.useEffect(() => {
    if (seed && pollen) {
      handleSeedChange(seed);
      handlePollenChange(pollen);
    }
  }, [seed, pollen]);

  const title =
    seed && pollen
      ? `${abbreviateGenus(seedParent)} ${
          seedParent.epithet
        } × ${abbreviateGenus(pollenParent)} ${
          pollenParent.epithet
        } | Hybridizer | Orchidex`
      : 'Hybridizer | Orchidex';

  return (
    <Container
      // title={`${grex.genus} ${grex.epithet} | Orchidex`}
      title={title}
      heading='Hybridizer'
    >
      <Magic inlineMenu onChange={handleSeedChange} />

      {seedParent ? <GrexCard grex={seedParent} /> : '?'}

      <div>&times;</div>

      {pollenParent ? <GrexCard grex={pollenParent} /> : '?'}

      <Magic inlineMenu onChange={handlePollenChange} />

      <button type='submit' onClick={handleSubmit}>
        Hybridize!
      </button>

      <br />
      <br />
      <br />

      {grex && <GrexCard hideLink grex={grex} />}

      {grex && <AncestryViz grex={grex} />}

      <List
        data={speciesAncestry}
        getFields={(sa) => [sa.grex.epithet]}
        renderField={({ grex: g = {} }) => <Name grex={g} shouldAbbreviate />}
        getCount={(d) => d.score}
        renderCount={(score) =>
          `${(Math.round(score * 1000) / 10).toFixed(1)} %`
        }
      />
    </Container>
  );
};

export default Hybridizer;
