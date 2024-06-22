const fs = require('fs');
const jsdom = require('jsdom');
const fetch = require('fetch-retry')(global.fetch);
const { htmlTextToDelimitedRow } = require('./html-text-to-delimited-row');
const { SEARCH_URL, URL, FIELDS, EXT_FIELDS } = require('./utils');

const { JSDOM } = jsdom;

async function getIDsOnPage(page) {
  const fetched = await fetch(`${SEARCH_URL}&page=${page}`);
  const text = await fetched.text();

  const {
    window: { document },
  } = new JSDOM(text);

  const table = document.querySelector('.mcl.results.fifty50');

  if (!table) {
    return [];
  }

  const ids = Array.from(table.querySelectorAll('tbody a'))
    .map((e) => e.href)
    .filter((l) => l.includes('orchiddetails'))
    .map((l) => parseInt(l.split('=')[1], 10))
    .filter((_, idx) => (page === startPage ? idx >= startItem - 1 : true));

  return ids;
}

const args = process.argv.slice(2);
const outFilename = args[0];
const startPage = args[1] ? parseInt(args[1], 10) : 1;
const startItem = args[2] ? parseInt(args[2], 10) : 1;

if (!outFilename) {
  console.error('Error: no out file specified');
  return;
}

console.log('Writing to', `${outFilename}...\n`);

const get = async (id) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const fetched = await fetch(`${URL}?ID=${id}`);
      const text = await fetched.text();
      return resolve(htmlTextToDelimitedRow(id, text));
    }, 500);
  });
};

const stream = fs.createWriteStream(outFilename, { flags: 'w' });

stream.write(
  `${FIELDS.concat(EXT_FIELDS)
    .map((f) => f.toLowerCase().split(' ').join('_'))
    .join('\t')}\n`
);

let p = startPage;
let ids = [];

(async () => {
  do {
    ids = await getIDsOnPage(p);

    ids = ids ?? [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      try {
        const got = await get(id);
        const split = got.split('\t');

        if (got !== null) {
          console.log(
            `${p}\t${p === startPage ? i + startItem : i + 1}\t${
              split[0]
            }\t${split.slice(1, 3).join(' ')}`
          );
          stream.write(`${got}\n`);
        }
      } catch (e) {
        console.log(`grex ${id} could not fetch`);
      }
    }

    p++;
  } while (ids.length > 0);

  stream.end();
})();
