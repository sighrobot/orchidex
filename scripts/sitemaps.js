const readline = require('readline');
const fs = require('fs');
const { kebabCase } = require('lodash');

const SITEMAPS_PATH = 'public/sitemaps';
const MAX_NUM_URLS = 40000;
const DATA_READ_PATH = 'data/rhs/data.tsv';
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
const genuses = new Set();
const registrants = new Set();

const handleLine = (line) => {
  const split = line.split('\t');
  const [id, genus, epithet, , , , reg, orig] = split;

  const thisId = parseInt(id, 10);

  if (genus[0] !== genus[0].toUpperCase() || !epithet || thisId === lastId) {
    return;
  }

  genuses.add(genus);
  registrants.add(reg);
  registrants.add(orig);

  if (count % MAX_NUM_URLS === 0) {
    page++;
    outputs.push(getOut(`${SITEMAPS_PATH}/grex-${page}.xml`));
    writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], outputs[page]);
    count = 0;
  }

  const grexUrl = `${BASE_URL}/${encodeKebab(genus)}/${encodeKebab(
    epithet,
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
  const regOut = getOut(`${SITEMAPS_PATH}/reg.xml`);
  writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], regOut);
  for (let r of registrants) {
    const regUrl = `${BASE_URL}/registrant/${encodeURIComponent(r)}`;
    writeLines(makeLocXml('url', regUrl), regOut);
  }
  writeLines(['</urlset>'], regOut);

  // STATIC sitemap
  const staticOut = getOut(`${SITEMAPS_PATH}/static.xml`);
  writeLines([XML_HEADER, getNamespacedTagOpen('urlset')], staticOut);
  for (let u of ['', 'recent', 'search', 'about', 'data']) {
    const url = `${BASE_URL}/${u}`;
    writeLines(makeLocXml('url', url), staticOut);
  }
  writeLines(['</urlset>'], staticOut);

  // SITEMAP INDEX
  const indexOut = getOut('public/sitemap_index.xml');
  writeLines([XML_HEADER, getNamespacedTagOpen('sitemapindex')], indexOut);
  writeLines(
    makeLocXml('sitemap', `${BASE_URL}/sitemaps/static.xml`),
    indexOut,
  );
  writeLines(makeLocXml('sitemap', `${BASE_URL}/sitemaps/reg.xml`), indexOut);
  for (let i = 0; i <= page; i++) {
    const url = `${BASE_URL}/sitemaps/grex-${i}.xml`;
    writeLines(makeLocXml('sitemap', url), indexOut);
  }
  writeLines(['</sitemapindex>'], indexOut);
};

reader.on('line', handleLine).on('close', handleClose);
