const Schedule = require("../models/schedule");
const Enrollment = require("../models/enrollment");
const { NotFoundError, ValidationError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const { assertOwnership } = require("../core/utils/ownership");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { ROLES } = require("../constants/roles");
const { REPEAT_TYPES } = require("../constants/repeatTypes");
const { PAGINATION } = require("../constants/pagination");
const { getEnrollmentIdsForUser } = require("./enrollment.service");

const MONTHLY_SESSION_LIMIT_MARGIN = 2;

const REPEAT_MONTHLY_ESTIMATES = Object.freeze({
  [REPEAT_TYPES.DAILY]: 30,
  [REPEAT_TYPES.WEEKLY]: (dayCount) => dayCount * 4,
  [REPEAT_TYPES.BIWEEKLY]: (dayCount) => dayCount * 2,
  [REPEAT_TYPES.MONTHLY]: (dayCount) => dayCount,
});

const SCHEDULE_POPULATION = [
  {
    path: "enrollmentId",
    populate: [
      { path: "teacherId", select: USER_SAFE_PROJECTION },
      { path: "studentId", select: USER_SAFE_PROJECTION },
      "subjectId",
    ],
  },
];

const estimateMonthlySessions = (data) => {
  if (!data.daysOfWeek || data.daysOfWeek.length === 0) {
    return 0;
  }

  const estimator = REPEAT_MONTHLY_ESTIMATES[data.repeatType];
  return typeof estimator === "function"
    ? estimator(data.daysOfWeek.length)
    : estimator ?? data.daysOfWeek.length * 4;
};

const assertWithinMonthlyLimit = (scheduleData, enrollment) => {
  const estimated = estimateMonthlySessions(scheduleData);
  const maxAllowed =
    enrollment.monthlyClasses + enrollment.extraMonthlyClasses + MONTHLY_SESSION_LIMIT_MARGIN;

  if (estimated > maxAllowed) {
    throw new ValidationError(
      `Schedule would generate ${estimated} sessions per month, exceeding the quota of ${maxAllowed}`
    );
  }
};

const assertTeacherOwnsEnrollment = (user, enrollment) => {
  if (user.role === ROLES.TEACHER) {
    assertOwnership(
      enrollment.teacherId,
      user.userId,
      "Not authorized to manage schedules for this enrollment"
    );
  }
};

const assertEnrollmentAccess = (user, enrollment) => {
  if (user.role === ROLES.TEACHER) {
    assertOwnership(
      enrollment.teacherId,
      user.userId,
      "Not authorized to manage this schedule"
    );
  }

  if (user.role === ROLES.STUDENT) {
    assertOwnership(
      enrollment.studentId,
      user.userId,
      "Not authorized to view this schedule"
    );
  }
};

const createSchedule = async (user, data) => {
  const enrollment = await Enrollment.findById(data.enrollmentId);
  if (!enrollment) {
    throw new NotFoundError("Enrollment not found");
  }

  assertTeacherOwnsEnrollment(user, enrollment);
  assertWithinMonthlyLimit(data, enrollment);

  const schedule = await Schedule.create({ ...data, createdBy: user.userId });
  return schedule.populate(SCHEDULE_POPULATION);
};

const getSchedules = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  const enrollmentIds = await getEnrollmentIdsForUser(user);
  if (enrollmentIds) filter.enrollmentId = { $in: enrollmentIds };
  if (query.enrollmentId) filter.enrollmentId = query.enrollmentId;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

  const [schedules, total] = await Promise.all([
    Schedule.find(filter)
      .populate(SCHEDULE_POPULATION)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Schedule.countDocuments(filter),
  ]);

  return { data: schedules, pagination: getPaginationMeta(total, page, limit) };
};

const getScheduleById = async (user, id) => {
  const schedule = await Schedule.findById(id).populate(SCHEDULE_POPULATION);

  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  const enrollment = schedule.enrollmentId;
  if (!enrollment) {
    throw new NotFoundError("Linked enrollment not found");
  }

  assertEnrollmentAccess(user, enrollment);
  return schedule;
};

const updateSchedule = async (user, id, data) => {
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  const currentEnrollment = await Enrollment.findById(schedule.enrollmentId);
  if (!currentEnrollment) {
    throw new NotFoundError("Linked enrollment not found");
  }

  const merged = { ...schedule.toObject(), ...data };
  let effectiveEnrollment = currentEnrollment;

  if (data.enrollmentId && String(data.enrollmentId) !== String(schedule.enrollmentId)) {
    effectiveEnrollment = await Enrollment.findById(data.enrollmentId);
    if (!effectiveEnrollment) {
      throw new NotFoundError("Enrollment not found");
    }
    assertTeacherOwnsEnrollment(user, effectiveEnrollment);
  } else {
    assertTeacherOwnsEnrollment(user, currentEnrollment);
  }

  if (merged.daysOfWeek || merged.repeatType) {
    assertWithinMonthlyLimit(merged, effectiveEnrollment);
  }

  const updated = await Schedule.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate(SCHEDULE_POPULATION);

  return updated;
};

const deleteSchedule = async (user, id) => {
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  const enrollment = await Enrollment.findById(schedule.enrollmentId);
  if (!enrollment) {
    throw new NotFoundError("Linked enrollment not found");
  }

  assertTeacherOwnsEnrollment(user, enrollment);
  await Schedule.findByIdAndDelete(id);
};

const getUpcomingSchedules = async (user, query) => {
  const filter = { isActive: true };

  const enrollmentIds = await getEnrollmentIdsForUser(user);
  if (enrollmentIds) filter.enrollmentId = { $in: enrollmentIds };

  const schedules = await Schedule.find(filter)
    .populate(SCHEDULE_POPULATION)
    .sort({ startDate: 1 })
    .limit(parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT);

  return schedules;
};

module.exports = {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getUpcomingSchedules,
};
