const superagent = require("superagent");
const { getBaseOptions } = require("../utils/api-utils");
const https = require("https");

const getPublicAddress = async (config, options) => {
  const { cert, key, timeout } = getBaseOptions(config);

  const response = await superagent
    .post(`${config.WALLET_HOST}/get_next_address`)
    .send({
      wallet_id: options?.walletId || config.DEAULT_WALLET_ID,
      new_address: options?.newAddress,
    })
    .key(key)
    .cert(cert)
    .timeout(timeout)
    .agent(new https.Agent({ rejectUnauthorized: false }));

  const data = JSON.parse(response.text);

  if (data.success) {
    return data.address;
  }

  return false;
};

module.exports = {
  getPublicAddress,
};
