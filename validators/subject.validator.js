const { z } = require("zod");

const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").trim(),
  code: z.string().trim().toUpperCase().optional(),
  description: z.string().trim().optional(),
});

const updateSubjectSchema = z.object({
  name: z.string().min(1).trim().optional(),
  code: z.string().trim().toUpperCase().optional(),
  description: z.string().trim().optional(),
});

module.exports = { createSubjectSchema, updateSubjectSchema };
