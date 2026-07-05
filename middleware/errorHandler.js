const logger = require("../core/logger");
const BaseError = require("../core/errors/BaseError");

const errorHandler = (err, req, res, next) => {
  if (err instanceof BaseError) {
    const response = {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    };

    if (err.errors) {
      response.errors = err.errors;
    }

    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack });
    } else {
      logger.warn(err.message, { errors: err.errors });
    }

    return res.status(err.statusCode).json(response);
  }

  logger.error("Unhandled error", { message: err.message, stack: err.stack });

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal server error",
  });
};

module.exports = errorHandler;
