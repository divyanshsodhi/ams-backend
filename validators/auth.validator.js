const { z } = require("zod");
const { ALL_ROLES } = require("../constants/roles");

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .transform((val) => val.toLowerCase()),
  fullName: z.string().min(1, "Full name is required").trim(),
  email: z.string().email("Invalid email format").transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  country: z.string().min(1, "Country is required").trim(),
  countryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(1, "Phone number is required").trim(),
  age: z.coerce.number().int().min(3).max(100).optional(),
  role: z.enum(ALL_ROLES, { message: "Invalid role selected" }),
  subjects: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password is too long"),
});

module.exports = { registerSchema, loginSchema, refreshTokenSchema, logoutSchema, changePasswordSchema };
