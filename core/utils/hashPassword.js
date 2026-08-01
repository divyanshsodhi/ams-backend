const bcrypt = require("bcrypt");
const { PASSWORD_HASH_ROUNDS } = require("../../constants/password");

const hashPassword = (password) => bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

module.exports = { hashPassword };
