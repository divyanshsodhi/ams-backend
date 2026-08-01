const { z } = require("zod");
const { PASSWORD_MIN_LENGTH } = require("../constants/password");

const createTeacherSchema = z.object({
  fullName: z.string().min(1, "Full name is required").trim(),
  email: z.string().email("Invalid email format").transform((val) => val.toLowerCase()),
  username: z.string().min(3).max(30).optional(),
  password: z.string().min(PASSWORD_MIN_LENGTH).optional(),
  country: z.string().trim().optional(),
  countryCode: z.string().optional(),
  phoneNumber: z.string().trim().optional(),
});

const updateTeacherSchema = z.object({
  fullName: z.string().trim().optional(),
  username: z.string().min(3).max(30).optional(),
  country: z.string().trim().optional(),
  countryCode: z.string().optional(),
  phoneNumber: z.string().trim().optional(),
});

module.exports = { createTeacherSchema, updateTeacherSchema };
