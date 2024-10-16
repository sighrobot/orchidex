const readline = require('readline');
const fs = require('fs');
const { kebabCase } = require('lodash');

const SITEMAPS_PATH = '.next/static/sitemaps';
const MAX_NUM_URLS = 40000;
const DATA_READ_PATH = 'data/rhs/data.csv';
const BASE_URL = 'https://orchidex.org';
const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const getNamespacedTagOpen = (tag) =>
  `<${tag} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

const writeLines = (lines, out) => {
  out.write([...lines, ''].join('\n'));
};

const makeLocXml = (tag, url) => {
  return [`  <${tag}>`, `    <loc>${url}</loc>`, `  </${tag}>`];
};

const encodeKebab = (s) => encodeURIComponent(kebabCase(s));

const reader = readline.createInterface({
  input: fs.createReadStream(DATA_READ_PATH).setEncoding('utf-8'),
});

const getOut = (path) => fs.createWriteStream(path, { flags: 'w' });

let count = 0;
let page = -1;
let lastId = 0;

const outputs = [];
const genera = new Set();
const registrants = new Set();

const handleLine = (line) => {
  const split = line.split(',');
  const [id, genus, epithet, , , , reg, orig] = split;

  const thisId = parseInt(id, 10);

  if (genus[0] !== genus[0].toUpperCase() || !epithet || thisId === lastId) {
    return;
  }

  genera.add(genus);
  registrants.add(reg);
  registrants.add(orig);

  if (count % MAX_NUM_URLS === 0) {
    page++;
    outputs.push(getOut(`${SITEMAPS_PATH}/grex--${page}.xml`));
    writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], outputs[page]);
    count = 0;
  }

  const grexUrl = `${BASE_URL}/${encodeKebab(genus)}/${encodeKebab(
    epithet
  )}/${id}`;
  writeLines(makeLocXml('url', grexUrl), outputs[page]);
  count++;

  lastId = parseInt(id, 10);
};

const handleClose = () => {
  for (let o of outputs) {
    writeLines(['</urlset>'], o);
  }

  // REGISTRANT sitemap
  const regOut = getOut(`${SITEMAPS_PATH}/registrant.xml`);
  writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], regOut);
  for (let r of registrants) {
    const regUrl = `${BASE_URL}/registrant/${encodeURIComponent(r)}`;
    writeLines(makeLocXml('url', regUrl), regOut);
  }
  writeLines(['</urlset>'], regOut);

  // LEARN-PARENTAGE sitemap
  const generaOut = getOut(`${SITEMAPS_PATH}/learn-parentage.xml`);
  writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], generaOut);
  for (let g of genera) {
    const genUrl = `${BASE_URL}/learn/parentage/${encodeURIComponent(
      g.toLowerCase()
    )}`;
    writeLines(makeLocXml('url', genUrl), generaOut);
  }
  writeLines(['</urlset>'], generaOut);

  // GENUS sitemap
  const genusPageOut = getOut(`${SITEMAPS_PATH}/genus.xml`);
  writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], genusPageOut);
  for (let g of genera) {
    const genUrl = `${BASE_URL}/${encodeURIComponent(g.toLowerCase())}`;
    writeLines(makeLocXml('url', genUrl), genusPageOut);
  }
  writeLines(['</urlset>'], genusPageOut);

  // STATIC sitemap
  const staticOut = getOut(`${SITEMAPS_PATH}/pages.xml`);
  writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], staticOut);
  for (let u of [
    '',
    'recent',
    'search',
    'search-advanced',
    'about',
    'about/data',
  ]) {
    const url = `${BASE_URL}/${u}`;
    writeLines(makeLocXml('url', url), staticOut);
  }
  writeLines(['</urlset>'], staticOut);

  // SITEMAP INDEX
  const indexOut = getOut('.next/static/sitemap_index.xml');
  writeLines([XML_HEADER, getNamespacedTagOpen('sitemapindex')], indexOut);
  writeLines(
    makeLocXml('sitemap', `${BASE_URL}/_next/static/sitemaps/pages.xml`),
    indexOut
  );
  writeLines(
    makeLocXml('sitemap', `${BASE_URL}/_next/static/sitemaps/registrant.xml`),
    indexOut
  );
  writeLines(
    makeLocXml(
      'sitemap',
      `${BASE_URL}/_next/static/sitemaps/learn-parentage.xml`
    ),
    indexOut
  );
  writeLines(
    makeLocXml('sitemap', `${BASE_URL}/_next/static/sitemaps/genus.xml`),
    indexOut
  );
  for (let i = 0; i <= page; i++) {
    const url = `${BASE_URL}/_next/static/sitemaps/grex--${i}.xml`;
    writeLines(makeLocXml('sitemap', url), indexOut);
  }
  writeLines(['</sitemapindex>'], indexOut);
};

reader.on('line', handleLine).on('close', handleClose);
