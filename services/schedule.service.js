const Schedule = require("../models/schedule");
const TeacherStudent = require("../models/teacherStudent");
const { NotFoundError, ValidationError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const { assertOwnership } = require("../core/utils/ownership");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { ROLES } = require("../constants/roles");
const { RECURRENCE_TYPES } = require("../constants/recurrenceTypes");
const { PAGINATION } = require("../constants/pagination");

const MONTHLY_SESSION_LIMIT_MARGIN = 2;

const RECURRENCE_MONTHLY_ESTIMATES = Object.freeze({
  [RECURRENCE_TYPES.DAILY]: 30,
  [RECURRENCE_TYPES.WEEKLY]: (dayCount) => dayCount * 4,
  [RECURRENCE_TYPES.BIWEEKLY]: (dayCount) => dayCount * 2,
  [RECURRENCE_TYPES.MONTHLY]: (dayCount) => dayCount,
});

const estimateMonthlySessions = (data) => {
  if (!data.daysOfWeek || data.daysOfWeek.length === 0) return 0;

  const estimator = RECURRENCE_MONTHLY_ESTIMATES[data.recurrenceType];
  return typeof estimator === "function"
    ? estimator(data.daysOfWeek.length)
    : estimator ?? data.daysOfWeek.length * 4;
};

const assertWithinMonthlyLimit = (scheduleData, relationship) => {
  const estimated = estimateMonthlySessions(scheduleData);
  const maxAllowed = relationship.monthlyClasses + MONTHLY_SESSION_LIMIT_MARGIN;

  if (estimated > maxAllowed) {
    throw new ValidationError(
      `Schedule would generate ${estimated} sessions per month, exceeding the limit of ${maxAllowed}`
    );
  }
};

const assertTeacherOwnsRelationship = (user, relationship) => {
  if (user.role === ROLES.TEACHER) {
    assertOwnership(
      relationship.teacherId,
      user.userId,
      "Not authorized to create schedule for this student"
    );
  }
};

const createSchedule = async (user, data) => {
  const relationship = await TeacherStudent.findById(data.teacherStudentId);
  if (!relationship) {
    throw new NotFoundError("Student relationship not found");
  }

  assertTeacherOwnsRelationship(user, relationship);
  assertWithinMonthlyLimit(data, relationship);

  const schedule = await Schedule.create({
    ...data,
    teacherId: relationship.teacherId,
    studentId: relationship.studentId,
  });

  return schedule.populate(["teacherStudentId", "teacherId", "studentId", "subjectId"]);
};

const getSchedules = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (user.role === ROLES.TEACHER) filter.teacherId = user.userId;
  if (user.role === ROLES.STUDENT) filter.studentId = user.userId;
  if (query.teacherStudentId) filter.teacherStudentId = query.teacherStudentId;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

  const [schedules, total] = await Promise.all([
    Schedule.find(filter)
      .populate("teacherStudentId")
      .populate("teacherId", USER_SAFE_PROJECTION)
      .populate("studentId", USER_SAFE_PROJECTION)
      .populate("subjectId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Schedule.countDocuments(filter),
  ]);

  return { data: schedules, pagination: getPaginationMeta(total, page, limit) };
};

const getScheduleById = async (user, id) => {
  const schedule = await Schedule.findById(id)
    .populate("teacherStudentId")
    .populate("teacherId", USER_SAFE_PROJECTION)
    .populate("studentId", USER_SAFE_PROJECTION)
    .populate("subjectId");

  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  if (user.role === ROLES.TEACHER) {
    assertOwnership(schedule.teacherId._id, user.userId, "Not authorized to view this schedule");
  }

  if (user.role === ROLES.STUDENT) {
    assertOwnership(schedule.studentId._id, user.userId, "Not authorized to view this schedule");
  }

  return schedule;
};

const updateSchedule = async (user, id, data) => {
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  if (user.role === ROLES.TEACHER) {
    assertOwnership(schedule.teacherId, user.userId, "Not authorized to update this schedule");
  }

  if (data.daysOfWeek || data.recurrenceType) {
    const relationship = await TeacherStudent.findById(schedule.teacherStudentId);
    if (relationship) {
      assertWithinMonthlyLimit({ ...schedule.toObject(), ...data }, relationship);
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

  if (user.role === ROLES.TEACHER) {
    assertOwnership(schedule.teacherId, user.userId, "Not authorized to delete this schedule");
  }

  await Schedule.findByIdAndDelete(id);
};

const getUpcomingSchedules = async (user, query) => {
  const filter = { isActive: true };

  if (user.role === ROLES.TEACHER) filter.teacherId = user.userId;
  if (user.role === ROLES.STUDENT) filter.studentId = user.userId;

  const schedules = await Schedule.find(filter)
    .populate("teacherStudentId")
    .populate("teacherId", USER_SAFE_PROJECTION)
    .populate("studentId", USER_SAFE_PROJECTION)
    .populate("subjectId")
    .sort({ startDate: 1 })
    .limit(parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT);

  return schedules;
};

module.exports = { createSchedule, getSchedules, getScheduleById, updateSchedule, deleteSchedule, getUpcomingSchedules };
