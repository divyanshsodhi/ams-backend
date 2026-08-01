const mongoose = require("mongoose");

/**
 * Runs an operation inside a MongoDB multi-document transaction when the
 * deployment supports sessions (replica set / sharded cluster) and falls back
 * to running it without a transaction on standalone servers.
 *
 * The operation receives the active session (or null) and MUST pass it to every
 * model call that should participate in the transaction.
 */
const withTransaction = async (operation) => {
  let transactionSession;

  try {
    transactionSession = await mongoose.startSession();
  } catch {
    return operation(null);
  }

  try {
    let result;
    await transactionSession.withTransaction(async () => {
      result = await operation(transactionSession);
    });
    return result;
  } finally {
    await transactionSession.endSession();
  }
};

module.exports = { withTransaction };
