import React from 'react';
import { nameCache, ancestryIdCache } from 'lib/cache';
import { repairMalformedNaturalHybridEpithet, UNKNOWN_CHAR } from 'lib/string';
import { find, flatten, partition } from 'lodash';
import { isSpecies } from 'components/pills/pills';
import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';
import useSWR from 'swr';

export const fetchGrexByName = async ({ genus, epithet }): Promise<Grex> => {
  if (!genus || !epithet) return null;

  const quotedGenus = `"${genus}"`;
  const quotedEpithet = epithet.includes(UNKNOWN_CHAR)
    ? epithet.replace(new RegExp(UNKNOWN_CHAR, 'g'), '_')
    : `"${repairMalformedNaturalHybridEpithet({ epithet })}"`;

  const cached = nameCache.get(`${genus} ${epithet}`);

  if (cached) {
    return cached;
  }

  try {
    const fetched = await fetch(
      `${APP_URL}/api/search?genus=${quotedGenus}&epithet=${quotedEpithet}`
    );
    const json = await fetched.json();

    let match;

    if (json.length === 1) {
      match = json[0];
    } else {
      match = find(json, (g) => g.epithet.length === epithet.length);
    }

    if (match) {
      nameCache.set(`${match.genus} ${match.epithet}`, match);
    }

    return match;
  } catch (e) {
    return null;
  }
};

const getNextGeneration = async (names = []) => {
  const [namesHave, namesNeed] = partition(names, (n) => {
    return nameCache.has(`${n.genus} ${n.epithet}`);
  });

  const have = namesHave.map((n) => nameCache.get(`${n.genus} ${n.epithet}`));

  if (namesNeed.length === 0) {
    return have;
  }

  // https://stackoverflow.com/a/44687374/2502505
  let [lists, chunkSize] = [namesNeed, 24];
  lists = [...Array(Math.ceil(lists.length / chunkSize))].map((_) =>
    lists.splice(0, chunkSize)
  );

  const fetches = await Promise.all(
    lists.map((list) =>
      fetch('/api/ancestry', {
        method: 'POST',
        body: JSON.stringify(list),
      })
    )
  );

  const gen = [];

  for (let f of fetches) {
    const genPart = await f.json();
    genPart.forEach((g) => {
      nameCache.set(`${g.genus} ${g.epithet}`, g);
    });
    gen.push(...genPart);
  }

  return [...have, ...gen];
};

const levels = async (grex, level = 1) => {
  const map = { [grex.id]: grex };
  const scores = {};
  let generation = [grex];

  for (let i = 0; i < level; i++) {
    const genScore = 1 / 2 ** i;

    generation.forEach((g) => {
      if (isSpecies(g) && g.genus && g.genus.length > 2) {
        map[g.id] = g;

        if (scores[g.id]) {
          scores[g.id] += genScore;
        } else {
          scores[g.id] = genScore;
        }
      }
    });

    generation = await getNextGeneration(
      flatten(
        generation.map((g) => [
          { genus: g.seed_parent_genus, epithet: g.seed_parent_epithet },
          { genus: g.pollen_parent_genus, epithet: g.pollen_parent_epithet },
        ])
      ).filter((f) => f.genus && f.epithet)
    );

    if (generation.length === 0) {
      break;
    }
  }

  return { scores, map };
};

export const useSpeciesAncestry = (grex: Grex | null) => {
  const fetcher = () => (grex ? levels(grex, 100) : null);
  const { data, isLoading } = useSWR(grex?.id, fetcher);

  if (grex) {
    ancestryIdCache.set(grex.id, true);
  }

  let ancestry = data
    ? Object.keys(data.scores ?? {}).map((k) => ({
        score: data.scores[k],
        grex: data.map[k],
      }))
    : null;

  return { data: ancestry, isLoading };
};

export const useAncestry = (grex, level = 2) => {
  const [ancestry, setAncestry] = React.useState({
    nodes: [],
    links: [],
    nodeMap: {},
  });

  const fetcher = () =>
    fetch(
      `/api/ancestry2?genus=${encodeURIComponent(
        grex.genus
      )}&epithet=${encodeURIComponent(grex.epithet)}`
    ).then((resp) => resp.json());
  const { data = [] } = useSWR([grex.genus, grex.epithet], fetcher);

  React.useEffect(() => {
    if (data.length === 0) {
      return;
    }

    (async () => {
      data.forEach((d) => {
        nameCache.set(`${d.genus} ${d.epithet}`, d);
      });

      const nodes = [grex];
      const links = [];
      const nodeMap = { [grex.id]: grex };

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

      const handleSeed = (parent, child, n = 0) => {
        if (parent) {
          num++;
          const id = `${parent.id}-${num}`;

          addParentToGraph('seed', n, parent, child, id);

          if (n < level) {
            return fetchParents({ ...parent, id }, n);
          }
        }
      };

      const handlePollen = (parent, child, n = 0) => {
        if (parent) {
          num++;
          const id = `${parent.id}-${num}`;

          addParentToGraph('pollen', n, parent, child, id);

          if (n < level) {
            return fetchParents({ ...parent, id }, n);
          }
        }
      };

      const fetchParents = async (child, n = 0) => {
        const seedPromise = fetchGrexByName({
          genus: child.seed_parent_genus,
          epithet: child.seed_parent_epithet,
        }).then((parent) => handleSeed(parent, child, n + 1));

        const pollenPromise = fetchGrexByName({
          genus: child.pollen_parent_genus,
          epithet: child.pollen_parent_epithet,
        }).then((parent) => handlePollen(parent, child, n + 1));

        return Promise.all([seedPromise, pollenPromise]);
      };

      if (grex && (grex.seed_parent_genus || grex.pollen_parent_genus)) {
        await fetchParents(grex);

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
