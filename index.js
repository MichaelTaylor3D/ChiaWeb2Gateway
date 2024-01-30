const express = require("express");
const app = express();
const cors = require("cors");
const datalayerCache = require("chia-datalayer-kv-cache");
const wallet = require("./rpcs/wallet");
const hexUtils = require("./utils/hex-utils");
const defaultConfig = require("./utils/defaultConfig");
const {
  isValidJSON,
  isBase64Image,
  getFileExtension,
  mimeTypes,
} = require("./utils/api-utils");

app.use(cors());

const multipartCache = {};

let config = defaultConfig;

datalayerCache.configure({
  full_node_host: config.FULL_NODE_HOST,
  datalayer_host: config.DATALAYER_HOST,
  wallet_host: config.WALLET_HOST,
  certificate_folder_path: config.CERTIFICATE_FOLDER_PATH,
  default_wallet_id: config.DEFAULT_WALLET_ID,
});

function configure(newConfig) {
  config = { ...config, ...newConfig };
  datalayerCache.configure({
    full_node_host: config.FULL_NODE_HOST,
    datalayer_host: config.DATALAYER_HOST,
    wallet_host: config.WALLET_HOST,
    certificate_folder_path: config.CERTIFICATE_FOLDER_PATH,
    default_wallet_id: config.DEFAULT_WALLET_ID,
  });
}

app.get("/", async (req, res) => {
  return res.json({
    message: "Welcome to the Chia DataLayer Web2 Gateway",
    endpoints: {
      "/.well-known": "Returns the public deposit address of the node",
      "/:storeId": "Returns all keys in the store",
      "/:storeId/:key": "Returns the value of the key in the store",
    },
  });
});

app.get("/.well-known", async (req, res) => {
  // Ideally we want to check the balance of the the current address and
  // only return it if its zero, if its not zero we want to get the next unused address and
  // return that. But I need to research how to check the balance of a single address.
  const publicAddress = await wallet.getPublicAddress(config);
  res.json({
    xch_address: publicAddress,
    donation_address:
      "xch17edp36nd9m5jfcq2sa5qp25ekrrfguvpx05zce35pf65mlvfn4gqyl0434",
  });
});

app.get("/:storeId/*", async (req, res) => {
  const storeId = req.params.storeId;
  let key = req.params[0];

  // Remove everything after '#'
  if (key.includes("#")) {
    key = key.split("#")[0];
  }

  // Remove trailing slash
  if (key.endsWith("/")) {
    key = key.slice(0, -1);
  }

  try {
    // A referrer indicates that the user is trying to access the store from a website
    // we want to redirect them so that the URL includes the storeId in the path
    const refererUrl = req.headers.referer;
    if (refererUrl && !refererUrl.includes(storeId)) {
      if (key.startsWith("/")) {
        key = key.slice(1);
      }
      res.location(`${refererUrl}/${storeId}/${key}`);
      res.status(301).end();
      return;
    }

    const hexKey = hexUtils.encodeHex(key);
    const dataLayerResponse = await datalayerCache.getValue({
      id: storeId,
      key: hexKey,
    });

    if (!dataLayerResponse) {
      throw new Error(`Key not found ${key}`);
    }

    const value = hexUtils.decodeHex(dataLayerResponse.value);
    const fileExtension = getFileExtension(key);

    if (isValidJSON(value) && JSON.parse(value)?.type === "multipart") {
      const mimeType = mimeTypes[fileExtension] || "application/octet-stream";
      let multipartFileNames = JSON.parse(value).parts;
      const cacheKey = multipartFileNames.sort().join(",");

      multipartFileNames = multipartFileNames.sort((a, b) => {
        const numberA = parseInt(a.split(".part")[1]);
        const numberB = parseInt(b.split(".part")[1]);
        return numberA - numberB;
      });

      if (multipartCache[cacheKey]) {
        console.log("Serving from cache");
        res.setHeader("Content-Type", mimeType);
        return res.end(multipartCache[cacheKey]);
      }

      const hexPartsPromises = multipartFileNames.map((fileName) => {
        console.log(`Stitching ${fileName}`);
        const hexKey = hexUtils.encodeHex(fileName);
        return datalayerCache.getValue({
          id: storeId,
          key: hexKey,
        });
      });

      const dataLayerResponses = await Promise.all(hexPartsPromises);
      const hexParts = dataLayerResponses.map((response) => response.value);

      const resultHex = hexParts.join("");
      const resultBuffer = Buffer.from(resultHex, "hex");
      multipartCache[cacheKey] = resultBuffer;

      res.setHeader("Content-Type", mimeType);
      return res.end(resultBuffer);
    } else if (fileExtension) {
      const mimeType = mimeTypes[fileExtension] || "application/octet-stream";
      res.setHeader("Content-Type", mimeType);
      return res.send(value);
    } else if (isValidJSON(value)) {
      return res.json(JSON.parse(value));
    } else if (isBase64Image(value)) {
      const base64Image = value.split(";base64,").pop();
      const imageBuffer = Buffer.from(base64Image, "base64");

      const mimeType = value.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
      res.type(mimeType);

      return res.send(imageBuffer);
    } else {
      return res.send(value);
    }
  } catch (error) {
    console.log(error);
    // If the key is not found and the store is empty we want to redirect the user to the store
    // This adds support for SPA's hosted on datalayer
    res.location(`/${storeId}`);
    res.status(301).end();
  }
});

app.get("/:storeId", async (req, res) => {
  try {
    let { storeId } = req.params;
    const { showkeys } = req.query;

    if (storeId.endsWith("/")) {
      storeId = storeId.slice(0, -1);
    }

    // A referrer indicates that the user is trying to access the store from a website
    // we want to redirect them so that the URL includes the storeId in the path
    const refererUrl = req.headers.referer;
    if (refererUrl && !refererUrl.includes(storeId)) {
      if (storeId.startsWith("/")) {
        storeId = storeId.slice(1);
      }
      res.location(`${refererUrl}/${storeId}`);
      res.status(301).end();
      return;
    }

    const dataLayerResponse = await datalayerCache.getKeys({
      id: storeId,
    });

    if (dataLayerResponse.error) {
      res.status(200).json({
        error: dataLayerResponse.error,
      });
    }

    const apiResponse = dataLayerResponse.keys.map((key) =>
      hexUtils.decodeHex(key)
    );

    // If index.html is in the store treat this endpoint like a website
    if (apiResponse.length && apiResponse.includes("index.html") && !showkeys) {
      const hexKey = hexUtils.encodeHex("index.html");
      const dataLayerResponse = await datalayerCache.getValue({
        id: storeId,
        key: hexKey,
      });

      let value = hexUtils.decodeHex(dataLayerResponse.value);
      // Add the base tag
      const baseTag = `<base href="/${storeId}/">`;
      value = value.replace("<head>", `<head>\n    ${baseTag}`);

      // Set Content-Type to HTML and send the decoded value
      res.setHeader("Content-Type", "text/html");
      return res.send(value);
    }

    return res.json(apiResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Can not retrieve data or it doesnt exist on this node",
    });
  }
});

function start() {
  console.log(
    `Starting web2 gateway server on port ${config.WEB2_GATEWAY_PORT}`
  );
  app.listen(config.WEB2_GATEWAY_PORT, config.WEB2_BIND_ADDRESS, () => {
    console.log(
      `DataLayer Web2 Gateway Server running, go to http://localhost:${config.WEB2_GATEWAY_PORT} to view your datalayer`
    );
  });
}

module.exports = {
  start,
  configure,
};
