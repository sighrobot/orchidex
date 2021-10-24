import React from 'react';
import { nameCache, ancestryIdCache } from 'lib/cache';
import { repairMalformedNaturalHybridEpithet, UNKNOWN_CHAR } from 'lib/string';
import { find, flatten, partition } from 'lodash';
import { isSpecies } from 'components/pills/pills';
import { APP_URL } from 'lib/constants';
import { Grex } from 'lib/types';

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
      `${APP_URL}/api/search?genus=${quotedGenus}&epithet=${quotedEpithet}`,
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

  const f = await fetch('/api/ancestry', {
    method: 'POST',
    body: JSON.stringify(namesNeed),
  });

  const gen = await f.json();

  gen.forEach((g) => {
    nameCache.set(`${g.genus} ${g.epithet}`, g);
  });

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
        ]),
      ).filter((f) => f.genus && f.epithet),
    );

    if (generation.length === 0) {
      break;
    }
  }

  return { scores, map };
};

export const useSpeciesAncestry = (grex) => {
  const [ancestry, setAncestry] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);

    if (grex.id) {
      const { scores, map } = await levels(grex, 100);

      setAncestry(
        Object.keys(scores).map((k) => ({
          score: scores[k],
          grex: map[k],
        })),
      );
      setLoading(false);
      ancestryIdCache.set(grex.id, true);
    }
  }, [grex.id]);

  React.useEffect(() => {
    if (ancestryIdCache.get(grex.id)) {
      load();
    } else {
      setAncestry(null);
    }
  }, [load, grex.id]);

  return { data: ancestry, loading, load };
};

export const useAncestry = (grex, level = 2) => {
  const [ancestry, setAncestry] = React.useState({
    nodes: [],
    links: [],
    nodeMap: {},
  });

  React.useEffect(() => {
    (async () => {
      const nodes = [grex];
      const links = [];
      const nodeMap = { [grex.id]: grex };

      let num = 0;
      let seed = 1;
      let pollen = 1;

      const handleParent = (type, counter, parent, child, id) => {
        links.push({
          source: id,
          target: child.id,
          type,
          value: 1,
        });

        nodes.push({ ...parent, id, type, l: counter });
        nodeMap[id] = { ...parent, id, type, l: counter };
        nameCache.set(`${parent.genus} ${parent.epithet}`, parent);
      };

      const handleSeed = (parent, child) => {
        if (parent) {
          num++;
          const id = `${parent.id}-${num}`;

          handleParent('seed', seed, parent, child, id);

          if (seed < level) {
            seed++;
            return fetchParents({ ...parent, id });
          }
        }
      };

      const handlePollen = (parent, child) => {
        if (parent) {
          num++;
          const id = `${parent.id}-${num}`;

          handleParent('pollen', pollen, parent, child, id);

          if (pollen < level) {
            pollen++;
            return fetchParents({ ...parent, id });
          }
        }
      };

      const fetchParents = async (child) => {
        const seedPromise = fetchGrexByName({
          genus: child.seed_parent_genus,
          epithet: child.seed_parent_epithet,
        }).then((parent) => handleSeed(parent, child));

        const pollenPromise = fetchGrexByName({
          genus: child.pollen_parent_genus,
          epithet: child.pollen_parent_epithet,
        }).then((parent) => handlePollen(parent, child));

        return Promise.all([seedPromise, pollenPromise]);
      };

      if (grex && (grex.seed_parent_genus || grex.pollen_parent_genus)) {
        await fetchParents(grex);

        if (nodes.length > 1) {
          setAncestry({ nodes, links, nodeMap });
        } else {
          setAncestry({ nodes: [], links: [], nodeMap: {} });
        }
      } else {
        setAncestry({ nodes: [grex], links: [], nodeMap });
      }
    })();
  }, [grex]);

  return ancestry;
};
