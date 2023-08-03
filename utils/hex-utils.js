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

const keyValueToChangeList = (key, value, includeDelete) => {
  const changeList = [];

  if (includeDelete) {
    changeList.push({
      action: "delete",
      key: encodeHex(key),
    });
  }

  changeList.push({
    action: "insert",
    key: encodeHex(key),
    value: encodeHex(value),
  });

  return changeList;
};

module.exports = {
  encodeHex,
  decodeHex,
  decodeDataLayerResponse,
  keyValueToChangeList,
};
