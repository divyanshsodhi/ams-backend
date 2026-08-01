const mongoose = require("mongoose");
const { ROLES, ALL_ROLES } = require("../constants/roles");
const { USER_DEFAULTS } = require("../constants/userDefaults");
const { PASSWORD_MIN_LENGTH } = require("../constants/password");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    password: {
      type: String,
      required: true,
      minLength: PASSWORD_MIN_LENGTH,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    country: {
      type: String,
      default: USER_DEFAULTS.COUNTRY,
      trim: true,
    },

    countryCode: {
      type: String,
      default: USER_DEFAULTS.COUNTRY_CODE,
    },

    phoneNumber: {
      type: String,
      default: USER_DEFAULTS.PHONE_NUMBER,
      trim: true,
    },

    age: {
      type: Number,
      min: 3,
      max: 100,
    },

    role: {
      type: String,
      enum: ALL_ROLES,
      required: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    refreshTokens: [
      {
        token: String,
        device: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
