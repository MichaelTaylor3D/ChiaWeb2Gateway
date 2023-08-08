# ChiaWeb2Gateway

ChiaWeb2Gateway is a gateway for hosting and accessing web content on the Chia network via the DataLayer protocol. The gateway allows you to create a datastore, publish content to it, and access the content using a web browser.

## Features

- Serve static websites from the Chia network using DataLayer.
- Support for Single Page Applications (SPAs) by redirecting all not-found routes to the base path.
- Serve multipart files by stitching together file parts, with caching for repeated access.
- Automatically embed the correct base URL in `index.html` files to ensure correct relative path resolution.

## Getting Started

### Prerequisites

You will need Node.js installed on your system to run and test this application. Also, it's crucial that **Chia Wallet and Chia Datalayer must be running** while using this software.

### Installation

1. Clone the repository to your local machine:
    ```bash
    git clone https://github.com/MichaelTaylor3D/ChiaWeb2Gateway.git
    ```

2. Navigate into the cloned directory:
    ```bash
    cd ChiaWeb2Gateway
    ```

3. Install the required dependencies:
    ```bash
    npm install
    ```

### Configuration

The gateway can be configured by changing the values in `defaultConfig` located in `./utils/defaultConfig.js`. The configuration parameters are as follows:

- `FULL_NODE_HOST`: The hostname of the full node.
- `DATALAYER_HOST`: The hostname of the data layer.
- `WALLET_HOST`: The hostname of the wallet.
- `CERTIFICATE_FOLDER_PATH`: The path to the certificate folder.
- `DEFAULT_WALLET_ID`: The default wallet ID.
- `WEB2_GATEWAY_PORT`: The port for the gateway server.
- `WEB2_BIND_ADDRESS`: The bind address for the gateway server.

### Usage

To start the gateway server:

```bash
node server.js start
```
If you install this module as a local or global npm module, you can run 

```bash
chiaweb2 start
```

The server will start and display a console message with the server's URL.

## Integration in Your Own Projects

You can easily integrate ChiaWeb2Gateway into your own projects:

```javascript
const gateway = require("chia-web2-gateway");
gateway.start();
```

This will start the gateway server within your application.

## Support

If you find this project useful, please consider supporting our work. You can send contributions to the following Chia address:

```
xch17edp36nd9m5jfcq2sa5qp25ekrrfguvpx05zce35pf65mlvfn4gqyl0434
```

Your support is greatly appreciated!

