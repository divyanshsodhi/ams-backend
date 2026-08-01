const { AuthorizationError } = require("../errors");

const assertOwnership = (ownerId, requesterId, message = "Not authorized") => {
  if (String(ownerId) !== String(requesterId)) {
    throw new AuthorizationError(message);
  }
};

module.exports = { assertOwnership };
