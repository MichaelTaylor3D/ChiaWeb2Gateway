const express = require("express");
const app = express();
const port = 3000;

const wallet = require("./rpcs/wallet");
const datalayer = require("./rpcs/datalayer");
const hexUtils = require("./utils/hex-utils");
const { isValidJSON, isBase64Image } = require("./utils/api-utils");

app.get("/", async (req, res) => {
  return res.json({
    message:
      "Welcome to the Chia DataLayer Web2 Gateway",
    endpoints: {
      "/.well-known": "Returns the public deposit address of the node",
      "/:storeId": "Returns all keys in the store",
      "/:storeId/:key": "Returns the value of the key in the store",
    } 
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

app.get("/:storeId/:key", async (req, res) => {
  try {
    const { storeId, key } = req.params;

    const hexKey = hexUtils.encodeHex(key);
    const dataLayerResponse = await datalayer.getValue({
      storeId,
      key: hexKey,
    });

    const value = hexUtils.decodeHex(dataLayerResponse.value);

    if (isValidJSON(value)) {
      return res.json(JSON.parse(value));
    } else if (isBase64Image(value)) {
      const base64Image = value.split(";base64,").pop();
      const imageBuffer = Buffer.from(base64Image, "base64");

      // get the mime type
      const mimeType = value.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];

      // set the correct content type
      res.type(mimeType);

      // send the image content as the response
      return res.send(imageBuffer);
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

    const dataLayerResponse = await datalayer.getkeys({
      storeId,
    });

    const apiResponse = dataLayerResponse.keys.map((key) =>
      hexUtils.decodeHex(key)
    );

    return res.json(apiResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Can not retrieve data or it doesnt exist on this node",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
