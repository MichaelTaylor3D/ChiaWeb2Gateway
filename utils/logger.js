const winston = require("winston");
const { format, transports, createLogger } = winston;
const DailyRotateFile = require("winston-daily-rotate-file");
const fs = require("fs");
const packageJson = require("../package.json");
const { getApplicationDataDirectory } = require("./chia-root");

const logDir = createLogDirectory();

const logFormat = getLogFormat();

const logger = createLogger(getLoggerConfiguration(logDir, logFormat));

if (!isProduction()) {
  logger.add(getConsoleTransport(logFormat));
}

module.exports = { logger };

function createLogDirectory() {
  const dir = `${getApplicationDataDirectory()}/logs`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

function getLogFormat() {
  return format.printf(
    (info) =>
      `${info.timestamp} [${packageJson.version}] [${info.level}]: ${
        info.message
      } ${
        Object.keys(info.metadata || {}).length > 0
          ? JSON.stringify(info.metadata)
          : ""
      }`
  );
}

function getLoggerConfiguration(logDir, logFormat) {
  return {
    level: "info",
    format: format.combine(
      logFormat,
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.metadata({ fillExcept: ["message", "level", "timestamp"] })
    ),
    transports: getTransports(logDir),
    exceptionHandlers: getExceptionHandlers(logDir),
    rejectionHandlers: getRejectionHandlers(logDir),
    exitOnError: false,
  };
}

function getTransports(logDir) {
  return [
    getErrorTransport(logDir),
    getCombinedTransport(logDir),
    getDailyRotateFileTransport(logDir, "application-%DATE%.log"),
  ];
}

function getErrorTransport(logDir) {
  return new transports.File({
    filename: `${logDir}/error.log`,
    level: "error",
    format: format.combine(format.json()),
  });
}

function getCombinedTransport(logDir) {
  return new transports.File({
    filename: `${logDir}/combined.log`,
    format: format.combine(format.json()),
  });
}

function getDailyRotateFileTransport(logDir, fileName) {
  return new DailyRotateFile({
    filename: `${logDir}/${fileName}`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    utc: true,
    format: format.combine(format.json()),
  });
}

function getExceptionHandlers(logDir) {
  return [
    new transports.File({ filename: `${logDir}/exceptions.log` }),
    getDailyRotateFileTransport(logDir, "exceptions-%DATE%.log"),
  ];
}

function getRejectionHandlers(logDir) {
  return [
    new transports.File({ filename: `${logDir}/rejections.log` }),
    getDailyRotateFileTransport(logDir, "rejections-%DATE%.log"),
  ];
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getConsoleTransport(logFormat) {
  return new transports.Console({
    format: format.combine(format.colorize(), format.prettyPrint(), logFormat),
  });
}
