const BaseError = require("./BaseError");

class AuthorizationError extends BaseError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
  }
}

module.exports = AuthorizationError;
