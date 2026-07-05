const { ValidationError } = require("../core/errors");

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    if (req[source] === undefined) {
      return next(
        new ValidationError("Validation failed", [
          {
            field: "",
            message: `Request ${source} is empty. Ensure Content-Type header is set correctly (e.g., application/json).`,
          },
        ])
      );
    }

    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return next(new ValidationError("Validation failed", errors));
    }

    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
