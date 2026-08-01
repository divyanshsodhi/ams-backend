const { z } = require("zod");
const { ATTENDANCE_STATUS } = require("../constants/attendance");

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const confirmAttendanceSchema = z.object({
  status: z.enum([ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT]).optional(),
});

const rescheduleSessionSchema = z
  .object({
    date: z.string().min(1).optional(),
    startTime: z.string().regex(timeRegex, "Invalid start time format (HH:mm)").optional(),
    endTime: z.string().regex(timeRegex, "Invalid end time format (HH:mm)").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one value to reschedule (date, startTime or endTime)",
  });

module.exports = { confirmAttendanceSchema, rescheduleSessionSchema };
