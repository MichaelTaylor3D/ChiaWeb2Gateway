const superagent = require("superagent");
const wallet = require("./wallet");
const { getBaseOptions } = require("../utils/api-utils");
const https = require("https");

const dataLayerAvailable = async (config) => {
  const { cert, key, timeout } = getBaseOptions(config);
  const url = `${config.DATALAYER_HOST}/get_routes`;

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({})
      .agent(new https.Agent({ rejectUnauthorized: false }));

    const data = response.body;

    // We just care that we got some response, not what the response is
    if (Object.keys(data).includes("success")) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

const getValue = async (config, { storeId, key, rootHash }) => {
  const { cert, key: sslKey, timeout } = getBaseOptions(config);

  if (storeId) {
    const payload = {
      id: storeId,
      key,
    };

    if (rootHash) {
      payload.root_hash = rootHash;
    }

    const url = `${config.DATALAYER_HOST}/get_value`;

    try {
      const response = await superagent
        .post(url)
        .key(sslKey)
        .cert(cert)
        .timeout(timeout)
        .send(payload)
        .agent(new https.Agent({ rejectUnauthorized: false }));

      const data = response.body;

      if (data.success) {
        return data;
      }
    } catch (error) {
      return false;
    }
  }

  return false;
};

const getkeys = async (config, { storeId }) => {
  const { cert, key: sslKey, timeout } = getBaseOptions(config);

  if (storeId) {
    const payload = {
      id: storeId,
    };

    const url = `${config.DATALAYER_HOST}/get_keys`;

    try {
      const response = await superagent
        .post(url)
        .key(sslKey)
        .cert(cert)
        .timeout(timeout)
        .send(payload)
        .agent(new https.Agent({ rejectUnauthorized: false }));

      const data = response.body;

      if (data.success) {
        return data;
      }
    } catch (error) {
      return false;
    }
  }

  return false;
};

module.exports = {
  dataLayerAvailable,
  getValue,
  getkeys,
};
