# ChiaWeb2Gateway

ChiaWeb2Gateway is a gateway for publishing web content on the Chia network. With this gateway, you can create a datastore and publish your website to it.

## Getting Started

### Prerequisites

You need Node.js installed on your system to run and test this application.

### Installation

Clone the repository and install dependencies:

```
git clone <repo-url>
cd <repo-dir>
npm install
```

### Usage

Start the gateway server:

```
node .
```

## Testing

To create a datastore and push a test website to it, use the provided test script:

```
node test/test.js
```

This will create a datastore, push a test website to it, and print a storeid to the console. You can append this storeid to your gateway URL to view the website. For example, if your gateway is running at `localhost:3000` and your storeid is `123`, you can view your website at `localhost:3000/123`.

## Support

If you find this project useful, please consider supporting my work. You can send contributions to the following Chia address:

```
xch17edp36nd9m5jfcq2sa5qp25ekrrfguvpx05zce35pf65mlvfn4gqyl0434
```

Your support is greatly appreciated!

---

Remember to replace `<repo-url>` and `<repo-dir>` with the actual URL of your repository and the directory name, respectively. This README provides a more comprehensive guide on how to install, use, and test the application, and makes a clear call for support.

