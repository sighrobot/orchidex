const fs = require("fs");
const jsdom = require("jsdom");
const request = require("superagent");

const { JSDOM } = jsdom;

const MAX = 1042000; // 1000008;
const URL = `https://apps.rhs.org.uk/horticulturaldatabase/orchidregister/orchiddetails.asp`;
const FIELDS = [
  "ID",
  "Genus",
  "Epithet",
  "Synonym Flag",
  "Registrant Name",
  "Originator Name",
  "Date of registration",
  "Seed parent Genus",
  "Seed parent Epithet",
  "Pollen parent Genus",
  "Pollen parent Epithet",
];

const args = process.argv.slice(2);

if (!args[0]) {
  throw new Error("no start index");
}

console.log({ args });

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

    if (fieldIdx === 6) {
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

  return data.join("\t");
};

const startArg = parseInt(args[0], 10);

let i = startArg ? startArg : 1;
i = i - 1;

const END_AFTER = 50;
let nullsInARow = 0;

const skip = [169023, 900000];

const stream = fs.createWriteStream("/root/rhs/stable.tsv", {
  flags: startArg ? "a" : "w",
});

if (!startArg) {
  stream.write(
    `${FIELDS.map((f) => f.toLowerCase().split(" ").join("_")).join("\t")}\n`
  );
}

const interval = setInterval(async () => {
  i++;
  if (i <= skip[0] || i >= skip[1]) {
    try {
      const got = await get(i);

      console.log(got);
      if (got !== null) {
        stream.write(`${got}\n`);
        nullsInARow = 0;
      } else {
        nullsInARow++;
      }
    } catch {
      console.log(`could not fetch ${i}`);
    }

    if ((!startArg && i > MAX) || (startArg && nullsInARow >= END_AFTER)) {
      clearInterval(interval);
      stream.end();
    }
  } else {
    i = skip[1] - 1;
  }
}, 250);
