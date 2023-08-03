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

const keyValueToChangeList = (key, value, options) => {
  const changeList = [];

  if (options?.includeDelete) {
    changeList.push({
      action: "delete",
      key: encodeHex(key),
    });
  }

  changeList.push({
    action: "insert",
    key: encodeHex(key),
    value: options.encode ? encodeHex(value) : value,
  });

  return changeList;
};

module.exports = {
  encodeHex,
  decodeHex,
  decodeDataLayerResponse,
  keyValueToChangeList,
};
