const mongoose = require("mongoose");
const logger = require("../core/logger");
const config = require("./index");

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(config.MONGODB_URI, {
      tls: true,
      tlsInsecure: config.MONGODB_TLS_INSECURE === "true",
    });

    logger.info(`MongoDB Connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    logger.error("MongoDB Connection Error", { message: error.message });

    process.exit(1);
  }
};

module.exports = connectDB;
