const { z } = require("zod");
const { PASSWORD_MIN_LENGTH } = require("../constants/password");
const {
  DEFAULT_MONTHLY_CLASSES,
  DEFAULT_EXTRA_MONTHLY_CLASSES,
  ALL_ENROLLMENT_STATUS,
} = require("../constants/enrollment");

const createStudentSchema = z.object({
  email: z.string().email("Invalid email format"),
  fullName: z.string().trim().optional(),
  password: z.string().min(PASSWORD_MIN_LENGTH).optional(),
  username: z.string().min(3).max(30).optional(),
  country: z.string().trim().optional(),
  countryCode: z.string().optional(),
  phoneNumber: z.string().trim().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  monthlyClasses: z.coerce.number().int().min(1).default(DEFAULT_MONTHLY_CLASSES),
  extraMonthlyClasses: z.coerce
    .number()
    .int()
    .min(0)
    .default(DEFAULT_EXTRA_MONTHLY_CLASSES),
});

const updateStudentSchema = z.object({
  subjectId: z.string().optional(),
  monthlyClasses: z.coerce.number().int().min(1).optional(),
  extraMonthlyClasses: z.coerce.number().int().min(0).optional(),
  status: z.enum(ALL_ENROLLMENT_STATUS).optional(),
});

const assignStudentSchema = z.object({
  teacherId: z.string().min(1, "Teacher ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  subjectId: z.string().min(1, "Subject is required"),
  monthlyClasses: z.coerce.number().int().min(1).default(DEFAULT_MONTHLY_CLASSES),
  extraMonthlyClasses: z.coerce
    .number()
    .int()
    .min(0)
    .default(DEFAULT_EXTRA_MONTHLY_CLASSES),
});

module.exports = { createStudentSchema, updateStudentSchema, assignStudentSchema };
