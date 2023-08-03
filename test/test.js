const fs = require("fs");
const path = require("path");
const { keyValueToChangeList } = require("../utils/hex-utils");
const {
  pushChangeListToDataLayer,
  createDataLayerStore,
} = require("../rpcs/datalayer");

const walkDir = function (dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      fileList = walkDir(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  });
  return fileList;
};

const run = async () => {
  const testStoreId = await createDataLayerStore();
  console.log(`Created test store with id: ${testStoreId}`);

  const files = walkDir(path.join(__dirname, "public"));

  const changeList = [];

  for (const filePath of files) {
    let content;
    if (path.extname(filePath) === ".png") {
      const imageBuffer = fs.readFileSync(filePath);
      const imageBase64 = imageBuffer.toString("base64");
      content = `data:image/png;base64,${imageBase64}`;
    } else {
      content = fs.readFileSync(filePath, "utf8");
    }
    changeList.push(
      ...keyValueToChangeList(
        path.relative(path.join(__dirname, "public"), filePath),
        content
      )
    );
  }

  console.log("Pushing change list to datalayer...", changeList);
  await pushChangeListToDataLayer(testStoreId, changeList);
};

run();
