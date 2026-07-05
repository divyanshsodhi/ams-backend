const mongoose = require("mongoose");

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

    password:{
      type: String,
      required: true,
      minLength: 8,
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
      required: true,
      trim: true,
    },

    countryCode: {
      type: String,
      required: true,
      // Examples: +91, +1, +44
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      min: 3,
      max: 100,
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
      default: "admin"
    },

    // For teachers -> subjects taught
    // For students -> subjects enrolled
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

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