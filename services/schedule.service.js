const Schedule = require("../models/schedule");
const TeacherStudent = require("../models/teacherStudent");
const { NotFoundError, ValidationError, AuthorizationError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");

const MONTHLY_SESSION_LIMIT_MARGIN = 2;

const createSchedule = async (user, data) => {
  const relationship = await TeacherStudent.findById(data.teacherStudentId);
  if (!relationship) {
    throw new NotFoundError("Student relationship not found");
  }

  if (user.role === "teacher" && relationship.teacherId.toString() !== user.userId) {
    throw new AuthorizationError("Not authorized to create schedule for this student");
  }

  const estimatedMonthlySessions = estimateMonthlySessions(data);
  const maxAllowed = relationship.monthlyClasses + MONTHLY_SESSION_LIMIT_MARGIN;

  if (estimatedMonthlySessions > maxAllowed) {
    throw new ValidationError(
      `Schedule would generate ${estimatedMonthlySessions} sessions per month, exceeding the limit of ${maxAllowed}`
    );
  }

  const schedule = await Schedule.create({
    ...data,
    teacherId: relationship.teacherId,
    studentId: relationship.studentId,
  });

  return schedule.populate(["teacherStudentId", "teacherId", "studentId", "subjectId"]);
};

const estimateMonthlySessions = (data) => {
  if (!data.daysOfWeek || !data.daysOfWeek.length) return 0;

  switch (data.recurrenceType) {
    case "daily":
      return 30;
    case "weekly":
      return data.daysOfWeek.length * 4;
    case "biweekly":
      return data.daysOfWeek.length * 2;
    case "monthly":
      return data.daysOfWeek.length;
    default:
      return data.daysOfWeek.length * 4;
  }
};

const getSchedules = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (user.role === "teacher") filter.teacherId = user.userId;
  if (user.role === "student") filter.studentId = user.userId;
  if (query.teacherStudentId) filter.teacherStudentId = query.teacherStudentId;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

  const [schedules, total] = await Promise.all([
    Schedule.find(filter)
      .populate("teacherStudentId")
      .populate("teacherId", "-password -refreshTokens")
      .populate("studentId", "-password -refreshTokens")
      .populate("subjectId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Schedule.countDocuments(filter),
  ]);

  return { data: schedules, pagination: getPaginationMeta(total, page, limit) };
};

const updateSchedule = async (user, id, data) => {
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  if (user.role === "teacher" && schedule.teacherId.toString() !== user.userId) {
    throw new AuthorizationError("Not authorized to update this schedule");
  }

  if (data.daysOfWeek || data.recurrenceType) {
    const relationship = await TeacherStudent.findById(schedule.teacherStudentId);
    if (relationship) {
      const estimatedMonthlySessions = estimateMonthlySessions({ ...schedule.toObject(), ...data });
      const maxAllowed = relationship.monthlyClasses + MONTHLY_SESSION_LIMIT_MARGIN;
      if (estimatedMonthlySessions > maxAllowed) {
        throw new ValidationError(
          `Schedule would generate ${estimatedMonthlySessions} sessions per month, exceeding the limit`
        );
      }
    }
  }

  const updated = await Schedule.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate(["teacherStudentId", "teacherId", "studentId", "subjectId"]);

  return updated;
};

const deleteSchedule = async (user, id) => {
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  if (user.role === "teacher" && schedule.teacherId.toString() !== user.userId) {
    throw new AuthorizationError("Not authorized to delete this schedule");
  }

  await Schedule.findByIdAndDelete(id);
};

const getUpcomingSchedules = async (user, query) => {
  const filter = { isActive: true };

  if (user.role === "teacher") filter.teacherId = user.userId;
  if (user.role === "student") filter.studentId = user.userId;

  const schedules = await Schedule.find(filter)
    .populate("teacherStudentId")
    .populate("teacherId", "-password -refreshTokens")
    .populate("studentId", "-password -refreshTokens")
    .populate("subjectId")
    .sort({ startDate: 1 })
    .limit(parseInt(query.limit, 10) || 20);

  return schedules;
};

module.exports = { createSchedule, getSchedules, updateSchedule, deleteSchedule, getUpcomingSchedules };
