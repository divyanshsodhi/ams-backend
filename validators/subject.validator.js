const { z } = require("zod");

const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").trim(),
  code: z.string().trim().toUpperCase().optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

const updateSubjectSchema = z.object({
  name: z.string().min(1).trim().optional(),
  code: z.string().trim().toUpperCase().optional(),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createSubjectSchema, updateSubjectSchema };
