const express = require("express");
const app = express();
const cors = require("cors");

const wallet = require("./rpcs/wallet");
const datalayer = require("./rpcs/datalayer");
const hexUtils = require("./utils/hex-utils");
const {
  isValidJSON,
  isBase64Image,
  getFileExtension,
  mimeTypes,
} = require("./utils/api-utils");
const { getConfig } = require("./utils/config-loader");
const CONFIG = getConfig();

app.use(cors());

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
  const publicAddress = await wallet.getPublicAddress();
  res.json({
    xch_address: publicAddress,
    donation_address:
      "xch17edp36nd9m5jfcq2sa5qp25ekrrfguvpx05zce35pf65mlvfn4gqyl0434",
  });
});

app.get("/:storeId/*", async (req, res) => {
  try {
    const storeId = req.params.storeId;
    const key = req.params[0];

    // A referrer indicates that the user is trying to access the store from a website
    // we want to redirect them so that the URL includes the storeId in the path
    const refererUrl = req.headers.referer;
    if (refererUrl && !refererUrl.includes(storeId)) {
      res.location(`${refererUrl}/${storeId}/${key}`);
      res.status(301).end();
      return;
    }

    const hexKey = hexUtils.encodeHex(key);
    const dataLayerResponse = await datalayer.getValue({
      storeId,
      key: hexKey,
    });

    const value = hexUtils.decodeHex(dataLayerResponse.value);

    const fileExtension = getFileExtension(key);

    if (isValidJSON(value)) {
      return res.json(JSON.parse(value));
    } else if (isBase64Image(value)) {
      const base64Image = value.split(";base64,").pop();
      const imageBuffer = Buffer.from(base64Image, "base64");

      const mimeType = value.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
      res.type(mimeType);

      return res.send(imageBuffer);
    } else if (fileExtension) {
      const mimeType = mimeTypes[fileExtension] || "application/octet-stream";
      res.setHeader("Content-Type", mimeType);
      return res.send(value);
    } else {
      return res.send(value);
    }
  } catch (error) {
    res.status(500).json({
      error: "Can not retrieve data or it doesn't exist on this node",
    });
  }
});

app.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { showKeys } = req.query;

    // A referrer indicates that the user is trying to access the store from a website
    // we want to redirect them so that the URL includes the storeId in the path
    const refererUrl = req.headers.referer;
    if (refererUrl && !refererUrl.includes(storeId)) {
      res.location(`${refererUrl}/${storeId}`);
      res.status(301).end();
      return;
    }

    const dataLayerResponse = await datalayer.getkeys({
      storeId,
    });

    const apiResponse = dataLayerResponse.keys.map((key) =>
      hexUtils.decodeHex(key)
    );

    // If index.html is in the store treat this endpoint like a website
    if (apiResponse.length && apiResponse.includes("index.html") && !showKeys) {
      const hexKey = hexUtils.encodeHex("index.html");
      const dataLayerResponse = await datalayer.getValue({
        storeId,
        key: hexKey,
      });

      const value = hexUtils.decodeHex(dataLayerResponse.value);
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

app.listen(CONFIG.HTTP_PORT, CONFIG.BIND_ADDRESS, () => {
  console.log(`Server running at http://localhost:${CONFIG.HTTP_PORT}`);
});
