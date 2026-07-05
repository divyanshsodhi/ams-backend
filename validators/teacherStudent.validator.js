const { z } = require("zod");

const createStudentSchema = z.object({
  email: z.string().email("Invalid email format"),
  fullName: z.string().trim().optional(),
  password: z.string().min(6).optional(),
  username: z.string().min(3).max(30).optional(),
  country: z.string().trim().optional(),
  countryCode: z.string().optional(),
  phoneNumber: z.string().trim().optional(),
  subjects: z.array(z.string()).optional(),
  monthlyClasses: z.coerce.number().int().positive().default(8),
});

const updateStudentSchema = z.object({
  subjects: z.array(z.string()).optional(),
  monthlyClasses: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const assignStudentSchema = z.object({
  teacherId: z.string().min(1, "Teacher ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  subjects: z.array(z.string()).optional(),
  monthlyClasses: z.coerce.number().int().positive().default(8),
});

module.exports = { createStudentSchema, updateStudentSchema, assignStudentSchema };
