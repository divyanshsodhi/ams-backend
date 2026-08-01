const { z } = require("zod");
const { ALL_REPEAT_TYPES, ALL_DAYS_OF_WEEK } = require("../constants/repeatTypes");
const { DEFAULT_TIMEZONE } = require("../constants/timezone");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createScheduleSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment is required"),
  repeatType: z.enum(ALL_REPEAT_TYPES),
  daysOfWeek: z.array(z.enum(ALL_DAYS_OF_WEEK)).min(1, "At least one day must be selected"),
  startTime: z.string().regex(timeRegex, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Invalid end time format (HH:mm)"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  timezone: z.string().min(1).default(DEFAULT_TIMEZONE),
  isActive: z.boolean().default(true),
});

const updateScheduleSchema = z.object({
  enrollmentId: z.string().min(1).optional(),
  repeatType: z.enum(ALL_REPEAT_TYPES).optional(),
  daysOfWeek: z.array(z.enum(ALL_DAYS_OF_WEEK)).min(1).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timezone: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createScheduleSchema, updateScheduleSchema };
