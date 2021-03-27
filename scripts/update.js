const fs = require("fs");
const jsdom = require("jsdom");
const request = require("superagent");

const { JSDOM } = jsdom;

const normalize = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const URL = `https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp`;
const FIELDS = [
  "ID",
  "Genus",
  "Epithet",
  "Synonym Flag",
  "Synonym Genus Name",
  "Synonym Epithet Name",
  "Registrant Name",
  "Originator Name",
  "Date of registration",
  "Seed parent Genus",
  "Seed parent Epithet",
  "Pollen parent Genus",
  "Pollen parent Epithet",
];

const args = process.argv.slice(2);

const startIndex = parseInt(args[0], 10);
const outFilename = args[1];

if (!startIndex) {
  console.error(`Error: bad start index '${args[0]}'`);
  return;
}

if (!outFilename) {
  console.error("Error: no out file specified");
  return;
}

console.log(
  "\nStarting at",
  startIndex,
  "and writing to",
  `${outFilename}...\n`
);

const get = async (id) => {
  const { text } = await request(`${URL}?ID=${id}`);
  const {
    window: { document },
  } = new JSDOM(text);

  const data = new Array(FIELDS.length);

  data[0] = id.toString();

  const mainTableRows = document.querySelectorAll(".mcl.results.fifty50 tr");

  mainTableRows.forEach((row) => {
    const fieldIdx = FIELDS.indexOf(
      row.querySelector("td:first-of-type").textContent
    );

    const textContent = row.querySelector("td:last-of-type").textContent;

    if (fieldIdx === 8) {
      // date
      const [d, m, y] = textContent.split("/");
      data[fieldIdx] = `${y}-${m}-${d}`;
    } else {
      data[fieldIdx] = textContent;
    }
  });

  const secondaryTableRows = Array.from(
    document.querySelectorAll(".results.spread.thirds tr")
  );

  if (secondaryTableRows.length > 0) {
    let seedParentColIdx = -1;
    let pollenParentColIdx = -1;

    secondaryTableRows[0].querySelectorAll("th").forEach((th, colIdx) => {
      if (th.textContent === "Seed parent") {
        seedParentColIdx = colIdx;
      }

      if (th.textContent === "Pollen parent") {
        pollenParentColIdx = colIdx;
      }
    });

    secondaryTableRows.slice(1).forEach((row, idx) => {
      const cells = row.querySelectorAll("th, td");
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
    return null;
  }

  data.push(normalize(data[2]));
  data.push(normalize(data[6]));
  data.push(normalize(data[7]));
  data.push(normalize(data[10]));
  data.push(normalize(data[12]));

  return data.join("\t");
};

let i = startIndex;
i = i - 1;

const END_AFTER = 100;
let nullsInARow = 0;

const skip = [169023, 900000];

const stream = fs.createWriteStream(outFilename, { flags: "w" });

const EXT_FIELDS = [
  "epithet_normalized",
  "registrant_name_normalized",
  "originator_name_normalized",
  "seed_parent_epithet_normalized",
  "pollen_parent_epithet_normalized",
];

stream.write(
  `${FIELDS.concat(EXT_FIELDS)
    .map((f) => f.toLowerCase().split(" ").join("_"))
    .join("\t")}\n`
);

const interval = setInterval(async () => {
  i++;
  if (i <= skip[0] || i >= skip[1]) {
    try {
      const got = await get(i);
      const split = got.split("\t");

      process.stdout.clearLine();
      process.stdout.cursorTo(0);

      if (got !== null) {
        process.stdout.write(`${split.slice(0, 3).join(" ")}`);
        stream.write(`${got}\n`);
        nullsInARow = 0;
      } else {
        nullsInARow++;
      }
    } catch (e) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${i} could not fetch`);
      nullsInARow++;
    }

    if (nullsInARow >= END_AFTER) {
      clearInterval(interval);
      stream.end();
    }
  } else {
    i = skip[1] - 1;
  }
}, 250);
