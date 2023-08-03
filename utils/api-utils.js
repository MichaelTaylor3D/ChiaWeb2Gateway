const os = require("os");
const path = require("path");
const fs = require("fs");

const { getChiaRoot } = require("./chia-root");
const { getConfig } = require("./config-loader");
const CONFIG = getConfig();

const getBaseOptions = () => {
  const chiaRoot = getChiaRoot();
  let certificateFolderPath =
    CONFIG.CERTIFICATE_FOLDER_PATH || `${chiaRoot}/config/ssl`;

  // If certificateFolderPath starts with "~", replace it with the home directory
  if (certificateFolderPath.startsWith("~")) {
    certificateFolderPath = path.join(
      os.homedir(),
      certificateFolderPath.slice(1)
    );
  }

  const certFile = path.resolve(
    `${certificateFolderPath}/data_layer/private_data_layer.crt`
  );
  const keyFile = path.resolve(
    `${certificateFolderPath}/data_layer/private_data_layer.key`
  );

  const baseOptions = {
    method: "POST",
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
    timeout: 300000,
  };

  return baseOptions;
};

function isValidJSON(text) {
    try {
        JSON.parse(text);
        return true;
    } catch (error) {
        return false;
    }
}

function isBase64Image(str) {
  try {
    return str.startsWith("data:image");
  } catch (error) {
    return false;
  }
}

module.exports = {
  getBaseOptions,
  isValidJSON,
  isBase64Image,
};