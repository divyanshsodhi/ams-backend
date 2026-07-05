const { AuthorizationError } = require("../core/errors");

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError("Insufficient permissions"));
    }

    next();
  };
};

module.exports = { authorize };
