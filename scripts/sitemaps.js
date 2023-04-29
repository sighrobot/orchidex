const readline = require('readline');
const fs = require('fs');
const { kebabCase } = require('lodash');

const BASE_URL = 'https://orchidex.org';

const encode = (s) => encodeURIComponent(kebabCase(s));

const input = fs.createReadStream('data/rhs/data.tsv').setEncoding('utf-8');
const face = readline.createInterface({ input });

let count = 0;
let page = 0;

const outputs = [
  fs.createWriteStream(`public/sitemaps/grex-${page}.xml`, {
    flags: 'w',
  }),
];

outputs[0].write('<?xml version="1.0" encoding="UTF-8"?>\n');
outputs[0].write(
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
);

const genuses = new Set();
const registrants = new Set();

face
  .on('line', (line) => {
    const split = line.split('\t');
    const [id, genus, epithet, , , , reg, orig] = split;

    if (genus[0] !== genus[0].toUpperCase() || !epithet) {
      return;
    }

    genuses.add(genus);
    registrants.add(reg);
    registrants.add(orig);

    if (count === 50000) {
      page++;

      outputs.push(
        fs.createWriteStream(`public/sitemaps/grex-${page}.xml`, {
          flags: 'w',
        }),
      );

      outputs[page].write('<?xml version="1.0" encoding="UTF-8"?>\n');
      outputs[page].write(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
      );

      count = 0;
    }

    outputs[page].write('  <url>\n');
    outputs[page].write(
      `    <loc>${BASE_URL}/${encode(genus)}/${encode(epithet)}/${id}</loc>\n`,
    );
    outputs[page].write('  </url>\n');

    count++;
  })
  .on('close', () => {
    for (let output of outputs) {
      output.write('</urlset>\n');
    }

    const regOutput = fs.createWriteStream(`public/sitemaps/reg.xml`, {
      flags: 'w',
    });

    regOutput.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    regOutput.write(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
    );

    for (let r of registrants) {
      regOutput.write('  <url>\n');
      regOutput.write(
        `    <loc>${BASE_URL}/registrant/${encodeURIComponent(r)}</loc>\n`,
      );
      regOutput.write('  </url>\n');
    }
    regOutput.write('</urlset>\n');
  });
