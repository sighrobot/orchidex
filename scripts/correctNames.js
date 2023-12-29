const jsdom = require('jsdom');
const { Pool } = require('pg');
const { escapeSingleQuotes, normalize, EXT_FIELDS } = require('./utils');

const sql = new Pool({ connectionString: process.env.SB_PG_URL });

const { JSDOM } = jsdom;

const UNKNOWN_CHAR = '�';
const MOJIBAKE = 'ï¿½';
const SELECT_ALL_WITH_UNKNOWN_CHAR_IN_NAME_FIELDS = `
SELECT *
FROM rhs
WHERE epithet != ''
AND (
    epithet LIKE '%${UNKNOWN_CHAR}%'
    OR registrant_name LIKE '%${UNKNOWN_CHAR}%'
    OR originator_name LIKE '%${UNKNOWN_CHAR}%'
)
ORDER BY id::int`;

async function pause() {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

function shouldReplaceField(original, correct) {
  return (
    original.includes(UNKNOWN_CHAR) &&
    original !== correct &&
    original.length === correct.length
  );
}

function getEpithet(name) {
  return name.split(' ').slice(1).join(' ');
}

async function correctNames() {
  const { rows } = await sql.query(SELECT_ALL_WITH_UNKNOWN_CHAR_IN_NAME_FIELDS);

  for (let original of rows) {
    const padding = Array(8 - original.id.length)
      .fill(0)
      .join('');
    const id = `1${padding}${original.id}`;

    const fetched = await fetch(
      `https://bluenanta.com/display/information/${id}/?family=Orchidaceae`
    );
    const text = await fetched.text();
    const {
      window: { document },
    } = new JSDOM(text);

    const $title = document.querySelector('title');

    if ($title.textContent === 'Bluenanta') {
      console.log('skipped', original.id, original.genus, original.epithet);
      continue;
    }

    const $h4 = document.querySelector('h4');

    const [seedParentName, pollenParentName] = Array.from(
      document.querySelectorAll('.p-2 .parent-text a')
    ).map((el) => el?.textContent?.trim());

    const proposed = {
      epithet: getEpithet($title.textContent),
      registrant_name: $h4.textContent
        .trim()
        .split('\n')[2]
        .trim()
        .replace($title.textContent, '')
        .trim(),
      seed_parent_epithet: getEpithet(seedParentName),
      pollen_parent_epithet: getEpithet(pollenParentName),
    };

    const correct = {};

    if (shouldReplaceField(original.epithet, proposed.epithet)) {
      correct.epithet = proposed.epithet;
    }

    if (!proposed.registrant_name.includes(MOJIBAKE)) {
      if (
        shouldReplaceField(original.registrant_name, proposed.registrant_name)
      ) {
        correct.registrant_name = proposed.registrant_name;

        proposed.originator_name = original.originator_name.replace(
          original.registrant_name,
          proposed.registrant_name
        );

        if (
          shouldReplaceField(original.originator_name, proposed.originator_name)
        ) {
          correct.originator_name = proposed.originator_name;
        }
      }
    }

    if (
      shouldReplaceField(
        original.seed_parent_epithet,
        proposed.seed_parent_epithet
      )
    ) {
      correct.seed_parent_epithet = proposed.seed_parent_epithet;
    }

    if (
      shouldReplaceField(
        original.pollen_parent_epithet,
        proposed.pollen_parent_epithet
      )
    ) {
      correct.pollen_parent_epithet = proposed.pollen_parent_epithet;
    }

    EXT_FIELDS.forEach((ext) => {
      const field = ext.replace('_normalized', '');
      if (correct[field]) {
        correct[ext] = normalize(correct[field]);
      }
    });

    // console.log({
    //   original: {
    //     epithet: original.epithet,
    //     registrant_name: original.registrant_name,
    //     originator_name: original.originator_name,
    //     seed_parent_epithet: original.seed_parent_epithet,
    //     pollen_parent_epithet: original.pollen_parent_epithet,
    //   },
    //   proposed,
    //   correct,
    // });

    const updates = Object.keys(correct)
      .map((k) => {
        return `${k} = '${escapeSingleQuotes(correct[k])}'`;
      })
      .join(', ');

    if (updates.length > 0) {
      const updateQuery = `UPDATE rhs SET ${updates} WHERE id = '${original.id}'`;
      console.log(updateQuery);
      await sql.query(updateQuery);
    } else {
      console.log('NO UPDATE');
    }

    await pause();

    console.log('');
  }
}

correctNames();
