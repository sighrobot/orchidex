import React from 'react';
import useSWR from 'swr';
import { isSpecies } from 'components/pills/pills';
import { Grex } from 'lib/types';
import { fetchJson } from 'lib/utils';

type Progeny = Grex | [Grex, Grex] | null;
type RawScoredGrex = Grex & { score: string };
type ScoredGrex = { grex: Grex; score: number };

const makeUrl = (grex: Grex) =>
  `/api/ancestry?genus=${encodeURIComponent(
    grex.genus
  )}&epithet=${encodeURIComponent(grex.epithet)}`;

const parseResponse = (response: RawScoredGrex[]): ScoredGrex[] =>
  response
    .filter(isSpecies)
    .map((g) => ({ grex: g, score: parseFloat(g.score) }));

export const useSpeciesAncestrySingle = (grex: Grex, enabled = false) => {
  const fetcher = () =>
    enabled ? fetchJson<RawScoredGrex>(makeUrl(grex)) : [];

  const { data = [], isLoading } = useSWR(['single', grex], fetcher);

  const ancestry = parseResponse(data);

  return { data: ancestry, isLoading };
};

export const useSpeciesAncestryMulti = (
  progeny: [Grex, Grex],
  enabled = false
) => {
  const fetcher = () =>
    progeny && enabled
      ? Promise.all(progeny.map((g) => fetchJson<RawScoredGrex>(makeUrl(g))))
      : [];

  const { data = [], isLoading } = useSWR<RawScoredGrex[][]>(
    ['multi', progeny],
    fetcher
  );

  const grexMap = {};

  data[0]?.forEach((g) => {
    grexMap[g.id] = { ...g, score: parseFloat(g.score) / 2 };
  });

  data[1]?.forEach((g) => {
    if (grexMap[g.id]) {
      grexMap[g.id].score += parseFloat(g.score) / 2;
    } else {
      grexMap[g.id] = { ...g, score: parseFloat(g.score) / 2 };
    }
  });

  const ancestry = parseResponse(Object.values(grexMap));

  return { data: ancestry, isLoading };
};

export const useSpeciesAncestry = (progeny: Progeny) => {
  const isMulti = Array.isArray(progeny);

  const { data: single, isLoading: isLoadingSingle } = useSpeciesAncestrySingle(
    progeny as Grex,
    !isMulti
  );

  const { data: multi, isLoading: isLoadingMulti } = useSpeciesAncestryMulti(
    progeny as [Grex, Grex],
    isMulti
  );

  // if (isMulti) {
  //   const scored = (data as RawScoredGrex[][]).map(parseResponse);
  //   const ancestry: ScoredGrex[] = [];

  //   (data[0] as RawScoredGrex[]).forEach((g) => {
  //     ancestry.push({ ...g, score: parseFloat(g.score) / 2 });
  //   });

  //   // (data[1] as RawScoredGrex[]).forEach((g) => {

  //   //   ancestry.push({ ...g, score: g.score / 2 });
  //   // });
  // }

  return {
    data: isMulti ? multi : single,
    isLoading: isLoadingSingle || isLoadingMulti,
  };
};

type AncestryLink = {
  source: Grex['id'];
  target: Grex['id'];
  type: 'seed' | 'pollen';
  value: number;
};

type AncestryNodeMap = Record<Grex['id'], Grex>;

export const useAncestry = (grex?: Grex, level = 2) => {
  const [ancestry, setAncestry] = React.useState<{
    nodes: Grex[];
    links: AncestryLink[];
    nodeMap: AncestryNodeMap;
  }>({
    nodes: [],
    links: [],
    nodeMap: {},
  });

  const fetcher = () =>
    grex && !grex.hypothetical
      ? fetch(
          `/api/ancestry?genus=${encodeURIComponent(
            grex.genus
          )}&epithet=${encodeURIComponent(grex.epithet)}`
        ).then((resp) => resp.json())
      : [];
  const { data = [] } = useSWR<Grex[]>(
    grex ? [grex.genus, grex.epithet] : 'none',
    fetcher
  );

  React.useEffect(() => {
    if (!grex || data.length === 0) {
      return;
    }

    (async () => {
      const nodes: (Grex & { maxL?: number })[] = [grex];
      const links: AncestryLink[] = [];
      const nodeMap: AncestryNodeMap = { [grex.id]: grex };

      let num = 0;
      let maxL = 0;

      const addParentToGraph = (type, counter, parent, child, id) => {
        links.push({
          source: id,
          target: child.id,
          type,
          value: 1,
        });

        nodes.push({ ...parent, id, type, l: counter });

        maxL = counter;
      };

      const handleParent = (
        parent: Grex | undefined,
        child: Grex | undefined,
        n = 0,
        type: AncestryLink['type']
      ) => {
        if (parent) {
          num++;
          const id = `${parent.id}-${num}`;

          addParentToGraph(type, n, parent, child, id);

          if (n < level) {
            return fetchParents({ ...parent, id }, n);
          }
        }
      };

      const fetchParents = (child: Grex, n = 0) => {
        const seedParent = data.find((d) => d.id === child.seed_parent_id);
        const pollenParent = data.find((d) => d.id === child.pollen_parent_id);

        handleParent(seedParent, child, n + 1, 'seed');
        handleParent(pollenParent, child, n + 1, 'pollen');

        return [seedParent, pollenParent];
      };

      if (grex && (grex.seed_parent_genus || grex.pollen_parent_genus)) {
        fetchParents(grex);

        nodes.forEach((n) => {
          n.maxL = maxL;
          nodeMap[n.id] = n;
        });

        if (nodes.length > 1) {
          setAncestry({ nodes, links, nodeMap });
        } else {
          setAncestry({ nodes: [], links: [], nodeMap: {} });
        }
      } else {
        setAncestry({ nodes: [grex], links: [], nodeMap });
      }
    })();
  }, [grex, data, level]);

  return ancestry;
};
