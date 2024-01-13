const fs = require('fs');
const jsdom = require('jsdom');
const { Pool } = require('pg');

const sql = new Pool({ connectionString: process.env.SB_PG_POOL_URL });

const { normalize, URL, FIELDS, EXT_FIELDS } = require('./utils');

const { JSDOM } = jsdom;

const args = process.argv.slice(2);

const startIndex = parseInt(args[0], 10);
const outFilename = args[1];

if (!startIndex) {
  console.error(`Error: bad start index '${args[0]}'`);
  return;
}

if (!outFilename) {
  console.error('Error: no out file specified');
  return;
}

const shouldWriteDb = args[2] === 'true';

console.log(
  '\nStarting at',
  startIndex,
  'and writing to',
  `${outFilename}...\n`
);

const get = async (id) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const fetched = await fetch(`${URL}?ID=${id}`);
      const text = await fetched.text();

      const {
        window: { document },
      } = new JSDOM(text);

      const data = new Array(FIELDS.length);

      data[0] = id.toString();

      const mainTableRows = document.querySelectorAll(
        '.mcl.results.fifty50 tr'
      );

      mainTableRows.forEach((row) => {
        const fieldIdx = FIELDS.indexOf(
          row.querySelector('td:first-of-type').textContent
        );

        const textContent = row.querySelector('td:last-of-type').textContent;

        if (fieldIdx === 8) {
          // date
          const [d, m, y] = textContent.split('/');
          data[fieldIdx] = `${y}-${m}-${d}`;
        } else {
          data[fieldIdx] = textContent;
        }
      });

      const secondaryTableRows = Array.from(
        document.querySelectorAll('.results.spread.thirds tr')
      );

      if (secondaryTableRows.length > 0) {
        let seedParentColIdx = -1;
        let pollenParentColIdx = -1;

        secondaryTableRows[0].querySelectorAll('th').forEach((th, colIdx) => {
          if (th.textContent === 'Seed parent') {
            seedParentColIdx = colIdx;
          }

          if (th.textContent === 'Pollen parent') {
            pollenParentColIdx = colIdx;
          }
        });

        secondaryTableRows.slice(1).forEach((row, idx) => {
          const cells = row.querySelectorAll('th, td');
          const subFieldName = cells[0].textContent;

          cells.forEach((cell, cellIdx) => {
            if (cellIdx > 0) {
              let fieldName;

              if (cellIdx === seedParentColIdx) {
                fieldName = `Seed parent ${subFieldName}`;
              } else if (cellIdx === pollenParentColIdx) {
                fieldName = `Pollen parent ${subFieldName}`;
              }

              const fieldIdx = FIELDS.indexOf(fieldName);

              data[fieldIdx] = cell.textContent;
            }
          });
        });
      }

      if (data.slice(1).every((d) => d === undefined)) {
        return resolve(null);
      }

      data.push(normalize(data[2]));
      data.push(normalize(data[6]));
      data.push(normalize(data[7]));
      data.push(normalize(data[10]));
      data.push(normalize(data[12]));

      return resolve(data.join('\t'));
    }, 200);
  });
};

const LAST_GOOD = 1061779;
const END_AFTER = 200;
let nullsInARow = 0;

const stream = fs.createWriteStream(outFilename, { flags: 'w' });

stream.write(
  `${FIELDS.concat(EXT_FIELDS)
    .map((f) => f.toLowerCase().split(' ').join('_'))
    .join('\t')}\n`
);

let i = startIndex;

(async () => {
  while (i < LAST_GOOD || nullsInARow < END_AFTER) {
    try {
      const got = await get(i);

      if (got !== null) {
        const split = got.split('\t');

        if (shouldWriteDb) {
          await sql.query(
            `INSERT INTO rhs (${FIELDS.concat(EXT_FIELDS)
              .map((f) => f.toLowerCase().split(' ').join('_'))
              .join(', ')}) VALUES (${split
              .map((s) => `'${s.replace(/'/g, "''")}'`)
              .join(', ')})`
          );
        }

        console.log(`${split.slice(0, 3).join(' ')}`);
        stream.write(`${got}\n`);
        nullsInARow = 0;
      } else {
        console.log(`${i} could not fetch`);
        nullsInARow++;
      }
    } catch (e) {
      // process.stdout.clearLine();
      // process.stdout.cursorTo(0);
      console.log(e);
      nullsInARow++;
    }

    i++;
  }

  if (shouldWriteDb) {
    // fill in seed_parent_id
    // THIS QUERY MUST STAY IN SYNC WITH data/init-pg.sql !!!
    await sql.query(
      `
    UPDATE rhs
    SET seed_parent_id=subquery.seed_parent_id
    FROM (
        SELECT r1.id, r2.id AS seed_parent_id
        FROM rhs r1
        LEFT JOIN rhs r2
            ON r1.seed_parent_genus = r2.genus
            AND r1.seed_parent_epithet = r2.epithet
    ) AS subquery
    WHERE rhs.id=subquery.id
        AND rhs.epithet != ''
        AND rhs.date_of_registration != ''
        AND rhs.seed_parent_id is NULL
    `.trim()
    );

    // fill in pollen_parent_id
    // THIS QUERY MUST STAY IN SYNC WITH data/init-pg.sql !!!
    await sql.query(
      `
    UPDATE rhs
    SET pollen_parent_id=subquery.pollen_parent_id
    FROM (
        SELECT r1.id, r2.id AS pollen_parent_id
        FROM rhs r1
        LEFT JOIN rhs r2
            ON r1.pollen_parent_genus = r2.genus
            AND r1.pollen_parent_epithet = r2.epithet
    ) AS subquery
    WHERE rhs.id=subquery.id
        AND rhs.epithet != ''
        AND rhs.date_of_registration != ''
        AND rhs.pollen_parent_id is NULL
    `.trim()
    );
  }

  stream.end();
})();
