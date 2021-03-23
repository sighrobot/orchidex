import React from "react";
import cache from "lib/cache";
import { repairMalformedNaturalHybridEpithet, UNKNOWN_CHAR } from "lib/string";

export const fetchGrexByName = async ({ genus, epithet }) => {
  if (!genus || !epithet) return null;

  const quotedGenus = `"${genus}"`;
  const quotedEpithet = epithet.includes(UNKNOWN_CHAR)
    ? epithet.replace(new RegExp(UNKNOWN_CHAR, "g"), "_")
    : `"${repairMalformedNaturalHybridEpithet({ epithet })}"`;

  const cached = cache.get(`${genus} ${epithet}`);

  if (cached) return cached;

  try {
    const fetched = await fetch(
      `/api/search?genus=${quotedGenus}&epithet=${quotedEpithet}`
    );
    const json = await fetched.json();
    return json[0];
  } catch (e) {
    return null;
  }
};

export const useAncestry = (grex, level = 2) => {
  const [ancestry, setAncestry] = React.useState({ nodes: [], links: [] });

  React.useEffect(() => {
    (async () => {
      const nodes = [grex];
      const links = [];

      let num = 0;
      let seed = 1;
      let pollen = 1;

      const fetchParents = async (child) => {
        const seedPromise = fetchGrexByName({
          genus: child.seed_parent_genus,
          epithet: child.seed_parent_epithet,
        }).then((parent) => {
          if (parent) {
            num++;
            const id = `${parent.id}-${num}`;
            // console.log(
            //   parent.genus,
            //   parent.epithet,
            //   "is the seed parent of",
            //   child.genus,
            //   child.epithet
            // );
            links.push({
              source: id,
              target: child.id,
              type: "seed",
              value: 1,
            });

            // if (find(nodes, { id: parent.id })) {
            //   return null;
            // }

            nodes.push({ ...parent, id, type: "seed", l: seed });
            cache.set(`${parent.genus} ${parent.epithet}`, parent);

            if (seed < level) {
              seed++;
              return fetchParents({ ...parent, id });
            }
          }
        });

        const pollenPromise = fetchGrexByName({
          genus: child.pollen_parent_genus,
          epithet: child.pollen_parent_epithet,
        }).then((parent) => {
          if (parent) {
            num++;
            const id = `${parent.id}-${num}`;
            // console.log(
            //   parent.genus,
            //   parent.epithet,
            //   "is the pollen parent of",
            //   child.genus,
            //   child.epithet
            // );
            links.push({
              source: id,
              target: child.id,
              type: "pollen",
              value: 1,
            });

            // if (find(nodes, { id: parent.id })) {
            //   return null;
            // }

            nodes.push({
              ...parent,
              id,
              type: "pollen",
              child: child.id,
              l: pollen,
            });
            cache.set(`${parent.genus} ${parent.epithet}`, parent);

            if (pollen < level) {
              pollen++;
              return fetchParents({ ...parent, id });
            }
          }
        });

        return Promise.all([seedPromise, pollenPromise]);
      };

      if (grex && (grex.seed_parent_genus || grex.pollen_parent_genus)) {
        await fetchParents(grex);

        if (nodes.length > 1) {
          setAncestry({ nodes, links });
        } else {
          setAncestry({ nodes: [], links: [] });
        }
      } else {
        setAncestry({ nodes: [grex], links: [] });
      }
    })();
  }, [grex]);

  return ancestry;
};
