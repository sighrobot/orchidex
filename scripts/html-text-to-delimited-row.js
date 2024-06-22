const jsdom = require('jsdom');
const { normalize, FIELDS } = require('./utils');

const { JSDOM } = jsdom;

const htmlTextToDelimitedRow = (id, text) => {
  const {
    window: { document },
  } = new JSDOM(text);

  const data = new Array(FIELDS.length);

  data[0] = id.toString();

  const mainTableRows = document.querySelectorAll('.mcl.results.fifty50 tr');

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
    return null;
  }

  data.push(normalize(data[2]));
  data.push(normalize(data[6]));
  data.push(normalize(data[7]));
  data.push(normalize(data[10]));
  data.push(normalize(data[12]));

  return data.join('\t');
};

module.exports = { htmlTextToDelimitedRow };
