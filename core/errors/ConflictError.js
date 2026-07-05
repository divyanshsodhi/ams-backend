const BaseError = require("./BaseError");

class ConflictError extends BaseError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

module.exports = ConflictError;
