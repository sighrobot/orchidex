const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const run = async () => {
  const { stdout } = await exec("tail -n1 data/rhs/data.tsv");

  console.log(stdout.split("\t")[0]);
};

run();
