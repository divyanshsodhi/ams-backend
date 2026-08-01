const { z } = require("zod");
const { ALL_MEETING_PROVIDERS } = require("../constants/meetingProviders");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const meetingSchema = z.object({
  provider: z.enum(ALL_MEETING_PROVIDERS).optional(),
  meetingId: z.string().trim().optional(),
  meetingLink: z.string().url().optional(),
  password: z.string().trim().optional(),
});

const createExtraSessionSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(timeRegex, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Invalid end time format (HH:mm)"),
  meeting: meetingSchema.optional(),
});

module.exports = { createExtraSessionSchema };
