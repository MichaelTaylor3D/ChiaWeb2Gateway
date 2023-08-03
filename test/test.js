const fs = require("fs");
const path = require("path");
const { keyValueToChangeList } = require("../utils/hex-utils");
const {
  pushChangeListToDataLayer,
  createDataLayerStore,
} = require("../rpcs/datalayer");

const run = async () => {
  const testStoreId = await createDataLayerStore();
  console.log(`Created test store with id: ${testStoreId}`);
  const htmlContent = fs.readFileSync(
    path.join(__dirname, "public", "index.html"),
    "utf8"
  );

  const cssContent = fs.readFileSync(
    path.join(__dirname, "public", "style.css"),
    "utf8"
  );

  // Load the image file into a Buffer
  const imageBuffer = fs.readFileSync(
    path.join(__dirname, "public", "assets", "logo.png")
  );

  // Convert the image Buffer to a base64 string
  const imageBase64 = imageBuffer.toString("base64");

  // Add the MIME type and base64 indicator to the start of the base64 string
  const imageDataUrl = `data:image/png;base64,${imageBase64}`;

  const changeList = [
    ...keyValueToChangeList("index.html", htmlContent),
    ...keyValueToChangeList("style.css", cssContent),
    ...keyValueToChangeList("assets/logo.png", imageDataUrl),
  ];

  console.log("Pushing change list to datalayer...", changeList);
  await pushChangeListToDataLayer(testStoreId, changeList);
};

run();
