const encodeHex = (str) => {
  return Buffer.from(str).toString("hex");
};

const decodeHex = (str = "") => {
  return Buffer.from(str.replace("0x", ""), "hex").toString("utf8");
};

const decodeDataLayerResponse = (data) => {
  return data.keys_values.map((item) => ({
    key: decodeHex(item.key),
    value: decodeHex(item.value),
  }));
};

module.exports = {
  encodeHex,
  decodeHex,
  decodeDataLayerResponse,
};
