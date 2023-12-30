const jsdom = require('jsdom');
const { Pool } = require('pg');
const {
  escapeSingleQuotes,
  normalize,
  EXT_FIELDS,
  fetchReferencePageText,
} = require('./utils');

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
    OR seed_parent_epithet LIKE '%${UNKNOWN_CHAR}%'
    OR pollen_parent_epithet LIKE '%${UNKNOWN_CHAR}%'
)
ORDER BY id::int`;

async function pause() {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

function shouldReplaceField(curr, next) {
  return (
    curr?.includes(UNKNOWN_CHAR) &&
    curr !== next &&
    curr?.length === next?.length
  );
}

function getEpithet(name) {
  return name?.split(' ').slice(1).join(' ');
}

function getGrexFields(grex) {
  return {
    epithet: grex.epithet,
    registrant_name: grex.registrant_name,
    originator_name: grex.originator_name,
    seed_parent_epithet: grex.seed_parent_epithet,
    pollen_parent_epithet: grex.pollen_parent_epithet,
  };
}

function getReferenceFields(text) {
  const {
    window: { document },
  } = new JSDOM(text);

  const $title = document.querySelector('title');

  if ($title.textContent === 'Bluenanta') {
    return null;
  }

  const $h4 = document.querySelector('h4');

  const [seedParentName, pollenParentName] = Array.from(
    document.querySelectorAll('.p-2 .parent-text a')
  ).map((el) => el?.textContent?.trim());

  return {
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
}

async function correctNames() {
  const { rows } = await sql.query(SELECT_ALL_WITH_UNKNOWN_CHAR_IN_NAME_FIELDS);

  for (let grex of rows) {
    if (parseInt(grex.id, 10) < 989796) {
      continue;
    }
    console.log(grex.id);

    const text = await fetchReferencePageText(grex.id);

    const proposed = getReferenceFields(text);

    if (!proposed) {
      console.log('skipped', grex.id, grex.genus, grex.epithet);
      continue;
    }

    const correct = {};

    if (shouldReplaceField(grex.epithet, proposed.epithet)) {
      correct.epithet = proposed.epithet;
    }

    if (!proposed.registrant_name.includes(MOJIBAKE)) {
      if (shouldReplaceField(grex.registrant_name, proposed.registrant_name)) {
        correct.registrant_name = proposed.registrant_name;

        proposed.originator_name = grex.originator_name.replace(
          grex.registrant_name,
          proposed.registrant_name
        );

        if (
          shouldReplaceField(grex.originator_name, proposed.originator_name)
        ) {
          correct.originator_name = proposed.originator_name;
        }
      }
    }

    if (
      shouldReplaceField(
        grex.seed_parent_epithet.replace('Memoria ', ''),
        proposed.seed_parent_epithet?.replace('Mem. ', '')
      )
    ) {
      correct.seed_parent_epithet = proposed.seed_parent_epithet.replace(
        'Mem. ',
        'Memoria '
      );
    }

    if (
      shouldReplaceField(
        grex.pollen_parent_epithet.replace('Memoria ', ''),
        proposed.pollen_parent_epithet?.replace('Mem. ', '')
      )
    ) {
      correct.pollen_parent_epithet = proposed.pollen_parent_epithet.replace(
        'Mem. ',
        'Memoria '
      );
    }

    EXT_FIELDS.forEach((ext) => {
      const field = ext.replace('_normalized', '');
      if (correct[field]) {
        correct[ext] = normalize(correct[field]);
      }
    });

    console.log({
      id: grex.id,
      grex: getGrexFields(grex),
      proposed,
      correct,
    });

    const updates = Object.keys(correct)
      .map((k) => {
        return `${k} = '${escapeSingleQuotes(correct[k])}'`;
      })
      .join(', ');

    if (updates.length > 0) {
      const updateQuery = `UPDATE rhs SET ${updates} WHERE id = '${grex.id}'`;
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
