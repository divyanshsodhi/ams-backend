const { verifyAccessToken } = require("../core/utils/jwt");
const { AuthenticationError } = require("../core/errors");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AuthenticationError("Access token required."));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AuthenticationError("Invalid or expired access token."));
  }
};

module.exports = { authenticate };
