const ClassSession = require("../models/classSession");
const Schedule = require("../models/schedule");
const TeacherStudent = require("../models/teacherStudent");
const { NotFoundError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const { assertOwnership } = require("../core/utils/ownership");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { SESSION_TYPES } = require("../constants/sessionTypes");
const { SESSION_STATUS } = require("../constants/sessionStatus");
const { ROLES } = require("../constants/roles");

const toDateKey = (date) => date.toISOString().slice(0, 10);

const generateSessionsForSchedule = async (scheduleId) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate
    ? new Date(schedule.endDate)
    : new Date(new Date().setMonth(new Date().getMonth() + 1));

  const existingSessions = await ClassSession.find({
    scheduleId,
    classDate: { $gte: startDate, $lte: endDate },
  }).select("classDate");

  const existingDates = new Set(existingSessions.map((session) => toDateKey(session.classDate)));

  const sessions = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    if (
      schedule.daysOfWeek.includes(dayName) &&
      !existingDates.has(toDateKey(currentDate))
    ) {
      sessions.push({
        scheduleId: schedule._id,
        teacherId: schedule.teacherId,
        studentId: schedule.studentId,
        subjectId: schedule.subjectId,
        classDate: new Date(currentDate),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        sessionType: SESSION_TYPES.REGULAR,
        status: SESSION_STATUS.SCHEDULED,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (sessions.length > 0) {
    await ClassSession.insertMany(sessions);
  }

  return { generated: sessions.length };
};

const getSessions = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (user.role === ROLES.TEACHER) filter.teacherId = user.userId;
  if (user.role === ROLES.STUDENT) filter.studentId = user.userId;
  if (query.status) {
    const statuses = query.status
      .split(",")
      .map((status) => status.trim())
      .filter(Boolean);

    if (statuses.length > 0) {
      filter.status = { $in: statuses };
    }
  }
  if (query.sessionType) filter.sessionType = query.sessionType;
  if (query.scheduleId) filter.scheduleId = query.scheduleId;
  if (query.startDate) filter.classDate = { $gte: new Date(query.startDate) };
  if (query.endDate) filter.classDate = { ...filter.classDate, $lte: new Date(query.endDate) };

  const [sessions, total] = await Promise.all([
    ClassSession.find(filter)
      .populate("scheduleId")
      .populate("teacherId", USER_SAFE_PROJECTION)
      .populate("studentId", USER_SAFE_PROJECTION)
      .populate("subjectId")
      .skip(skip)
      .limit(limit)
      .sort({ classDate: -1 }),
    ClassSession.countDocuments(filter),
  ]);

  return { data: sessions, pagination: getPaginationMeta(total, page, limit) };
};

const teacherConfirm = async (userId, sessionId) => {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  assertOwnership(session.teacherId, userId, "Not authorized to confirm this session");

  session.teacherConfirmed = true;
  session.status = SESSION_STATUS.PENDING_CONFIRMATION;
  await session.save();

  return session;
};

const studentConfirm = async (userId, sessionId) => {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  assertOwnership(session.studentId, userId, "Not authorized to confirm this session");

  session.studentConfirmed = true;
  session.status = SESSION_STATUS.COMPLETED;
  await session.save();

  const teacherStudent = await TeacherStudent.findOne({
    teacherId: session.teacherId,
    studentId: session.studentId,
  });

  if (teacherStudent) {
    teacherStudent.completedClassesCurrentCycle += 1;
    await teacherStudent.save();
  }

  return session;
};

const rejectSession = async (userId, sessionId) => {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  assertOwnership(session.studentId, userId, "Not authorized to reject this session");

  session.status = SESSION_STATUS.DISPUTED;
  await session.save();

  return session;
};

const createExtraSession = async (user, data) => {
  const session = await ClassSession.create({
    teacherId: user.userId,
    studentId: data.studentId,
    subjectId: data.subjectId,
    classDate: data.classDate,
    startTime: data.startTime,
    endTime: data.endTime,
    sessionType: SESSION_TYPES.EXTRA,
    status: SESSION_STATUS.SCHEDULED,
    reason: data.reason,
  });

  return session.populate(["studentId", "subjectId"]);
};

const cancelSession = async (user, sessionId, data) => {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  assertOwnership(session.teacherId, user.userId, "Not authorized to cancel this session");

  session.status = SESSION_STATUS.CANCELLED;
  session.cancellationReason = data.reason;
  await session.save();

  return session;
};

const rescheduleSession = async (user, sessionId, data) => {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  assertOwnership(session.teacherId, user.userId, "Not authorized to reschedule this session");

  session.status = SESSION_STATUS.RESCHEDULED;
  session.rescheduledTo = {
    date: data.newDate,
    startTime: data.newStartTime,
    endTime: data.newEndTime,
  };
  await session.save();

  return session;
};

module.exports = { generateSessionsForSchedule, getSessions, teacherConfirm, studentConfirm, rejectSession, createExtraSession, cancelSession, rescheduleSession };
