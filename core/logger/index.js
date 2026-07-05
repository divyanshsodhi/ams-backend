const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = logLevels[process.env.LOG_LEVEL] ?? logLevels.info;

const timestamp = () => new Date().toISOString();

const logger = {
  error: (message, meta) => {
    if (currentLevel >= 0) {
      console.error(JSON.stringify({ level: "error", timestamp: timestamp(), message, meta }));
    }
  },
  warn: (message, meta) => {
    if (currentLevel >= 1) {
      console.warn(JSON.stringify({ level: "warn", timestamp: timestamp(), message, meta }));
    }
  },
  info: (message, meta) => {
    if (currentLevel >= 2) {
      console.info(JSON.stringify({ level: "info", timestamp: timestamp(), message, meta }));
    }
  },
  debug: (message, meta) => {
    if (currentLevel >= 3) {
      console.debug(JSON.stringify({ level: "debug", timestamp: timestamp(), message, meta }));
    }
  },
};

module.exports = logger;
