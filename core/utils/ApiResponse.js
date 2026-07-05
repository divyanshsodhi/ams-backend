class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static success(message, data = null, statusCode = 200) {
    return new ApiResponse(statusCode, message, data);
  }

  static created(message, data = null) {
    return new ApiResponse(201, message, data);
  }
}

module.exports = ApiResponse;
