
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const gateway = require("./index");
const { getConfig } = require("./utils/config-loader");
const config = getConfig();

gateway.configure(config);

const commands = {
  start: {
    command: "start",
    desc: "Start the Chia DataLayer Web2 Gateway",
    handler: gateway.start,
  },
};

async function run() {
  const argv = yargs(hideBin(process.argv))
    .command(commands.start)
    .demandCommand(1, "You need at least one command before moving on")
    .help()
    .alias("h", "help")
    .parse();
}

run();