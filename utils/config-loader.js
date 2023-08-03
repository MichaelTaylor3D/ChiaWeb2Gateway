const _ = require("lodash");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");
const defaultConfig = require("./defaultConfig");
const { getApplicationDataDirectory } = require("./chia-root");


const getConfig = _.memoize(() => {
  const configFile = getConfigurationFilePath();

  if (!fs.existsSync(configFile)) {
    createConfigurationFile(configFile);
  }

  return loadConfigFromYmlFile(configFile) || defaultConfig;
});

function getConfigurationFilePath() {
  const persistenceFolder = getApplicationDataDirectory();
  return path.resolve(`${persistenceFolder}/config.yaml`);
}

function createConfigurationFile(configFile) {
  try {
    const dir = path.dirname(configFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(configFile, yaml.dump(defaultConfig), "utf8");
  } catch (error) {
    logger.error(`Error creating config file: ${configFile}`, error);
  }
}

function loadConfigFromYmlFile(configFile) {
  try {
    const ymlContent = fs.readFileSync(configFile, "utf8");
    return yaml.load(ymlContent);
  } catch (error) {
    logger.error(
      `Config file not found or unreadable at: ${configFile}`,
      error
    );
  }
}

module.exports = {
  getConfig,
}