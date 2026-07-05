const BaseError = require("./BaseError");

class ValidationError extends BaseError {
  constructor(message = "Validation failed", errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

module.exports = ValidationError;
