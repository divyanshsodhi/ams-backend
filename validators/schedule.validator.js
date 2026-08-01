const { z } = require("zod");
const { ALL_RECURRENCE_TYPES, ALL_DAYS_OF_WEEK } = require("../constants/recurrenceTypes");
const { MEETING_MODES, ALL_MEETING_MODES } = require("../constants/meetingModes");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createScheduleSchema = z.object({
  teacherStudentId: z.string().min(1, "Teacher-student relationship is required"),
  subjectId: z.string().min(1, "Subject is required"),
  recurrenceType: z.enum(ALL_RECURRENCE_TYPES),
  daysOfWeek: z.array(z.enum(ALL_DAYS_OF_WEEK)).min(1, "At least one day must be selected"),
  startTime: z.string().regex(timeRegex, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Invalid end time format (HH:mm)"),
  meetingMode: z.enum(ALL_MEETING_MODES).default(MEETING_MODES.ONLINE),
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
  meetingMode: z.enum(ALL_MEETING_MODES).optional(),
  meetingLink: z.string().url().optional(),
  location: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createScheduleSchema, updateScheduleSchema };
