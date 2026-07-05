const { z } = require("zod");
const { ALL_RECURRENCE_TYPES, ALL_DAYS_OF_WEEK } = require("../constants/recurrenceTypes");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createScheduleSchema = z.object({
  teacherStudentId: z.string().min(1, "Teacher-student relationship is required"),
  subjectId: z.string().min(1, "Subject is required"),
  recurrenceType: z.enum(ALL_RECURRENCE_TYPES),
  daysOfWeek: z.array(z.enum(ALL_DAYS_OF_WEEK)).min(1, "At least one day must be selected"),
  startTime: z.string().regex(timeRegex, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Invalid end time format (HH:mm)"),
  meetingMode: z.enum(["online", "offline"]).default("online"),
  meetingLink: z.string().url().optional(),
  location: z.string().trim().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateScheduleSchema = z.object({
  subjectId: z.string().optional(),
  recurrenceType: z.enum(ALL_RECURRENCE_TYPES).optional(),
  daysOfWeek: z.array(z.enum(ALL_DAYS_OF_WEEK)).min(1).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  meetingMode: z.enum(["online", "offline"]).optional(),
  meetingLink: z.string().url().optional(),
  location: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createScheduleSchema, updateScheduleSchema };
