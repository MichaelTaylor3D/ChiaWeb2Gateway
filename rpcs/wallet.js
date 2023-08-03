const superagent = require("superagent");
const { getConfig } = require("../utils/config-loader");
const { logger } = require("../utils/logger");
const { getBaseOptions } = require("../utils/api-utils");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const CONFIG = getConfig();

const walletIsSynced = async () => {
  try {
    const { cert, key, timeout } = getBaseOptions();

    const response = await superagent
      .post(`${CONFIG.WALLER_HOST}/get_sync_status`)
      .send({})
      .key(key)
      .cert(cert)
      .timeout(timeout);

    const data = JSON.parse(response.text);

    if (data.success) {
      return data.synced;
    }

    return false;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const walletIsAvailable = async () => {
  return await walletIsSynced();
};

const getWalletBalance = async ({ walletId = CONFIG.DEFAULT_WALLET_ID }) => {
  try {
    const { cert, key, timeout } = getBaseOptions();

    const response = await superagent
      .post(`${CONFIG.WALLER_HOST}/get_wallet_balance`)
      .send({
        wallet_id: walletId,
      })
      .key(key)
      .cert(cert)
      .timeout(timeout);

    if (response.text) {
      const data = JSON.parse(response.text);
      const balance = data?.wallet_balance?.spendable_balance;
      return balance / 1000000000000;
    }

    return false;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const waitForAllTransactionsToConfirm = async () => {
  const unconfirmedTransactions = await hasUnconfirmedTransactions();
  await new Promise((resolve) => setTimeout(() => resolve(), 15000));

  if (unconfirmedTransactions) {
    return waitForAllTransactionsToConfirm();
  }

  return true;
};

const hasUnconfirmedTransactions = async ({
  walletId = CONFIG.DEFAULT_WALLET_ID,
}) => {
  const { cert, key, timeout } = getBaseOptions();

  const response = await superagent
    .post(`${CONFIG.WALLER_HOST}/get_transactions`)
    .send({
      wallet_id: walletId,
      sort_key: "RELEVANCE",
    })
    .key(key)
    .cert(cert)
    .timeout(timeout);

  const data = JSON.parse(response.text);

  if (data.success) {
    console.log(
      `Pending confirmations: ${
        data.transactions.filter((transaction) => !transaction.confirmed).length
      }`
    );

    return data.transactions.some((transaction) => !transaction.confirmed);
  }

  return false;
};

const getPublicAddress = async (options = {
  newAddress: false,
  walletId: CONFIG.DEFAULT_WALLET_ID,
}) => {
  const { cert, key, timeout } = getBaseOptions();

  const response = await superagent
    .post(`${CONFIG.WALLER_HOST}/get_next_address`)
    .send({
      wallet_id: options.walletId,
      new_address: options.newAddress,
    })
    .key(key)
    .cert(cert)
    .timeout(timeout);

  const data = JSON.parse(response.text);

  if (data.success) {
    return data.address;
  }

  return false;
};

const getActiveNetwork = async () => {
  const url = `${CONFIG.WALLER_HOST}/get_network_info`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send(JSON.stringify({}));

    const data = response.body;

    if (data.success) {
      return data;
    }

    return false;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

module.exports = {
  hasUnconfirmedTransactions,
  walletIsSynced,
  walletIsAvailable,
  getPublicAddress,
  getWalletBalance,
  waitForAllTransactionsToConfirm,
  getActiveNetwork,
};
