import React from 'react';
import useSWR from 'swr';
import { isSpecies } from 'components/pills/pills';
import { Grex } from 'lib/types';

export const useSpeciesAncestry = (grex: Grex | null) => {
  const fetcher = () =>
    grex
      ? fetch(
          `/api/ancestry2?genus=${encodeURIComponent(
            grex.genus
          )}&epithet=${encodeURIComponent(grex.epithet)}`
        ).then((resp) => resp.json())
      : [];
  const { data = [], isLoading } = useSWR<(Grex & { score: string })[]>(
    grex?.id,
    fetcher
  );

  const ancestry = data
    .filter(isSpecies)
    .map((g) => ({ grex: g, score: parseFloat(g.score) }));

  return { data: ancestry, isLoading };
};

type AncestryLink = {
  source: Grex['id'];
  target: Grex['id'];
  type: 'seed' | 'pollen';
  value: number;
};

type AncestryNodeMap = Record<Grex['id'], Grex>;

export const useAncestry = (grex: Grex, level = 2) => {
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
    grex
      ? fetch(
          `/api/ancestry2?genus=${encodeURIComponent(
            grex.genus
          )}&epithet=${encodeURIComponent(grex.epithet)}`
        ).then((resp) => resp.json())
      : [];
  const { data = [] } = useSWR<Grex[]>(
    grex ? [grex.genus, grex.epithet] : 'none',
    fetcher
  );

  React.useEffect(() => {
    if (data.length === 0) {
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
