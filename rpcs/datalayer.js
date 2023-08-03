const _ = require("lodash");
const superagent = require("superagent");
const wallet = require('./wallet');
const { getConfig } = require("../utils/config-loader");
const { logger } = require("../utils/logger");
const { getBaseOptions } = require("../utils/api-utils");
const CONFIG = getConfig();

const getMirrors = async (storeId) => {
  const url = `${CONFIG.DATALAYER_HOST}/get_mirrors`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({ id: storeId });

    const data = response.body;

    if (data.success) {
      return data.mirrors;
    }

    logger.error(`FAILED GETTING MIRRORS FOR ${storeId}`);
    return [];
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const addMirror = async (storeId, url, forceAddMirror = false) => {
  await wallet.waitForAllTransactionsToConfirm();

  const mirrors = await getMirrors(storeId);

  // Dont add the mirror if it already exists.
  const mirror = mirrors.find(
    (mirror) => mirror.launcher_id === storeId && mirror.urls.includes(url)
  );

  if (mirror) {
    logger.info(`Mirror already available for ${storeId}`);
    return true;
  }

  try {
    const options = {
      id: storeId,
      urls: [url],
      amount: _.get(CONFIG, "DEFAULT_COIN_AMOUNT", 300000000),
      fee: _.get(CONFIG, "DEFAULT_FEE", 300000000),
    };

    const { cert, key, timeout } = getBaseOptions();

    const response = await superagent
      .post(`${CONFIG.DATALAYER_HOST}/add_mirror`)
      .key(key)
      .cert(cert)
      .send(options)
      .timeout(timeout);

    const data = response.body;

    if (data.success) {
      logger.info(`Adding mirror ${storeId} at ${url}`);
      return true;
    }

    logger.error(`FAILED ADDING MIRROR FOR ${storeId}`);
    return false;
  } catch (error) {
    logger.error("ADD_MIRROR", error);
    console.trace(error);
    return false;
  }
};

const removeMirror = async (storeId, coinId) => {
  const mirrors = await getMirrors(storeId);

  const mirrorExists = mirrors.find(
    (mirror) => mirror.coin_id === coinId && mirror.launcher_id === storeId
  );

  if (!mirrorExists) {
    logger.error(
      `Mirror doesn't exist for: storeId: ${storeId}, coinId: ${coinId}`
    );
    return false;
  }

  const url = `${CONFIG.DATALAYER_HOST}/delete_mirror`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({
        id: coinId,
        fee: _.get(CONFIG, "DEFAULT_FEE", 300000000),
      });

    const data = response.body;

    if (data.success) {
      logger.info(`Removed mirror for ${storeId}`);
      return true;
    }

    logger.error(`Failed removing mirror for ${storeId}`);
    return false;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const getRootDiff = async (storeId, root1, root2) => {
  const url = `${CONFIG.DATALAYER_HOST}/get_kv_diff`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({
        id: storeId,
        hash_1: root1,
        hash_2: root2,
      });

    const data = response.body;

    if (data.success) {
      return _.get(data, "diff", []);
    }

    return [];
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const getRootHistory = async (storeId) => {
  const url = `${CONFIG.DATALAYER_HOST}/get_root_history`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({
        id: storeId,
      });

    const data = response.body;

    if (data.success) {
      return _.get(data, "root_history", []);
    }

    return [];
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const unsubscribeFromDataLayerStore = async (storeId) => {
  const url = `${CONFIG.DATALAYER_HOST}/unsubscribe`;
  const { cert, key, timeout } = getBaseOptions();

  logger.info(`RPC Call: ${url} ${storeId}`);

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({
        id: storeId,
        fee: _.get(CONFIG, "DEFAULT_FEE", 300000000),
      });

    const data = response.body;

    if (Object.keys(data).includes("success") && data.success) {
      logger.info(`Successfully UnSubscribed: ${storeId}`);
      return data;
    }

    return false;
  } catch (error) {
    logger.info(`Error UnSubscribing: ${error}`);
    return false;
  }
};

const dataLayerAvailable = async () => {
  const url = `${CONFIG.DATALAYER_HOST}/get_routes`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({});

    const data = response.body;

    // We just care that we got some response, not what the response is
    if (Object.keys(data).includes("success")) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const getStoreData = async (storeId, rootHash) => {
  if (storeId) {
    const payload = {
      id: storeId,
    };

    if (rootHash) {
      payload.root_hash = rootHash;
    }

    const url = `${CONFIG.DATALAYER_HOST}/get_keys_values`;
    const { cert, key, timeout } = getBaseOptions();

    try {
      const response = await superagent
        .post(url)
        .key(key)
        .cert(cert)
        .timeout(timeout)
        .send(payload);

      const data = response.body;

      if (data.success) {
        if (!_.isEmpty(data.keys_values)) {
          logger.info(`Downloaded Data, root hash: ${rootHash || "latest"}`);
        }
        return data;
      }
    } catch (error) {
      logger.info(
        `Unable to find store data for ${storeId} at root ${
          rootHash || "latest"
        }`
      );
      return false;
    }
  }

  logger.info(
    `Unable to find store data for ${storeId} at root ${rootHash || "latest"}`
  );
  return false;
};

const getRoot = async (storeId, ignoreEmptyStore = false) => {
  const url = `${CONFIG.DATALAYER_HOST}/get_root`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({ id: storeId });

    const data = response.body;

    if (
      (data.confirmed && !ignoreEmptyStore) ||
      (data.confirmed &&
        ignoreEmptyStore &&
        !data.hash.includes("0x00000000000"))
    ) {
      return data;
    }

    return false;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

const getRoots = async (storeIds) => {
  const url = `${CONFIG.DATALAYER_HOST}/get_roots`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({ ids: storeIds });

    const data = response.body;

    if (data.success) {
      return data;
    }

    return [];
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const pushChangeListToDataLayer = async (storeId, changelist) => {
  try {
    await wallet.waitForAllTransactionsToConfirm();

    const url = `${CONFIG.DATALAYER_HOST}/batch_update`;
    const { cert, key, timeout } = getBaseOptions();

    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({
        changelist,
        id: storeId,
        fee: _.get(CONFIG, "DEFAULT_FEE", 300000000),
      });

    const data = response.body;

    console.log(data);

    if (data.success) {
      logger.info(
        `Success!, Changes were submitted to the datalayer for storeId: ${storeId}`
      );
      return true;
    }

    if (data.error.includes("Key already present")) {
      logger.info(
        `The datalayer key was already present, its possible your data was pushed to the datalayer but never broadcasted to the blockchain. This can create a mismatched state in your node.`
      );
      return true;
    }

    logger.error(
      `There was an error pushing your changes to the datalayer, ${JSON.stringify(
        data
      )}`
    );
    return false;
  } catch (error) {
    logger.error(error.message);
    logger.info("There was an error pushing your changes to the datalayer");
  }
};

const createDataLayerStore = async () => {
  const url = `${CONFIG.DATALAYER_HOST}/create_data_store`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({
        fee: _.get(CONFIG, "DEFAULT_FEE", 300000000),
      });

    const data = response.body;

    if (data.success) {
      return data.id;
    }

    throw new Error(data.error);
  } catch (error) {
    logger.error(error);
    throw new Error(error.message);
  }
};

const subscribeToStoreOnDataLayer = async (storeId) => {
  if (!storeId) {
    logger.info(`No storeId found to subscribe to: ${storeId}`);
    return false;
  }

  const homeOrg = await Organization.getHomeOrg();

  if (homeOrg && [(homeOrg.orgUid, homeOrg.registryId)].includes(storeId)) {
    logger.info(`Cant subscribe to self: ${storeId}`);
    return { success: true };
  }

  const subscriptions = await getSubscriptions();

  if (subscriptions.includes(storeId)) {
    logger.info(`Already subscribed to: ${storeId}`);
    return { success: true };
  }

  const url = `${CONFIG.DATALAYER_HOST}/subscribe`;
  const { cert, key, timeout } = getBaseOptions();

  logger.info(`Subscribing to: ${storeId}`);

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({
        id: storeId,
        fee: _.get(CONFIG, "DEFAULT_FEE", 300000000),
      });

    const data = response.body;

    if (Object.keys(data).includes("success") && data.success) {
      logger.info(`Successfully Subscribed: ${storeId}`);

      const chiaConfig = fullNode.getChiaConfig();

      await addMirror(
        storeId,
        `http://${await publicIpv4()}:${chiaConfig.data_layer.host_port}`
      );

      return data;
    }

    return false;
  } catch (error) {
    logger.info(`Error Subscribing: ${error}`);
    return false;
  }
};

const getSubscriptions = async () => {
  if (CONFIG.USE_SIMULATOR) {
    return [];
  }

  const url = `${CONFIG.DATALAYER_HOST}/subscriptions`;
  const { cert, key, timeout } = getBaseOptions();

  try {
    const response = await superagent
      .post(url)
      .key(key)
      .cert(cert)
      .timeout(timeout)
      .send({});

    const data = response.body;

    if (data.success) {
      return data.store_ids;
    }

    logger.error(`FAILED GETTING SUBSCRIPTIONS ON DATALAYER`);
    return [];
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const getValue = async ({ storeId, key, rootHash }) => {
  if (storeId) {
    const payload = {
      id: storeId,
      key,
    };

    if (rootHash) {
      payload.root_hash = rootHash;
    }

    const url = `${CONFIG.DATALAYER_HOST}/get_value`;
    const { cert, key: sslKey, timeout } = getBaseOptions();

    try {
      const response = await superagent
        .post(url)
        .key(sslKey)
        .cert(cert)
        .timeout(timeout)
        .send(payload);

      const data = response.body;

      if (data.success) {
        return data;
      }
    } catch (error) {
      logger.info(
        `Unable to find store key ${key} for ${storeId} at root ${
          rootHash || "latest"
        }`
      );
      return false;
    }
  }

  logger.info(
    `Unable to find store data for ${storeId} at root ${rootHash || "latest"}`
  );
  return false;
};

const getkeys = async ({ storeId }) => {
  if (storeId) {
    const payload = {
      id: storeId
    };

    const url = `${CONFIG.DATALAYER_HOST}/get_keys`;
    const { cert, key: sslKey, timeout } = getBaseOptions();

    try {
      const response = await superagent
        .post(url)
        .key(sslKey)
        .cert(cert)
        .timeout(timeout)
        .send(payload);

      const data = response.body;

      if (data.success) {
        console.log(data)
        return data;
      }
    } catch (error) {
      logger.info(
        `Unable to find store keys for ${storeId} at root ${
          rootHash || "latest"
        }`
      );
      return false;
    }
  }

  logger.info(
    `Unable to find store data for ${storeId}`
  );
  return false;
};

module.exports = {
  getMirrors,
  addMirror,
  removeMirror,
  getRootDiff,
  getRootHistory,
  unsubscribeFromDataLayerStore,
  dataLayerAvailable,
  getStoreData,
  getRoot,
  getRoots,
  pushChangeListToDataLayer,
  createDataLayerStore,
  subscribeToStoreOnDataLayer,
  getSubscriptions,
  getValue,
  getkeys,
};
