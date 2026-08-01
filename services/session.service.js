const ClassSession = require("../models/classSession");
const Attendance = require("../models/attendance");
const Enrollment = require("../models/enrollment");
const Schedule = require("../models/schedule");
const { NotFoundError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const { assertOwnership } = require("../core/utils/ownership");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { getWeekdayName } = require("../core/utils/dates");
const { withTransaction } = require("../core/utils/transactions");
const { SESSION_STATUS } = require("../constants/sessionStatus");
const { getEnrollmentIdsForUser } = require("./enrollment.service");

const SESSION_HORIZON_MONTHS = 1;

const SESSION_POPULATION = [
  {
    path: "enrollmentId",
    populate: [
      { path: "teacherId", select: USER_SAFE_PROJECTION },
      { path: "studentId", select: USER_SAFE_PROJECTION },
      "subjectId",
    ],
  },
  "scheduleId",
];

const toDateKey = (date) => date.toISOString().slice(0, 10);

const generateSessionsForSchedule = async (scheduleId) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new NotFoundError("Schedule not found");
  }

  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate
    ? new Date(schedule.endDate)
    : new Date(new Date().setMonth(new Date().getMonth() + SESSION_HORIZON_MONTHS));

  const existingSessions = await ClassSession.find({
    scheduleId,
    date: { $gte: startDate, $lte: endDate },
  }).select("date");

  const existingDates = new Set(existingSessions.map((session) => toDateKey(session.date)));

  const sessions = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dayName = getWeekdayName(currentDate, schedule.timezone);

    if (schedule.daysOfWeek.includes(dayName) && !existingDates.has(toDateKey(currentDate))) {
      sessions.push({
        scheduleId: schedule._id,
        enrollmentId: schedule.enrollmentId,
        date: new Date(currentDate),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: SESSION_STATUS.SCHEDULED,
        createdBy: schedule.createdBy,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (sessions.length === 0) {
    return { generated: 0 };
  }

  await withTransaction(async (transactionSession) => {
    const options = transactionSession ? { session: transactionSession } : {};
    const inserted = await ClassSession.insertMany(sessions, options);

    await Attendance.insertMany(
      inserted.map(({ _id }) => ({
        classSessionId: _id,
        overallStatus: SESSION_STATUS.SCHEDULED,
      })),
      options
    );
  });

  return { generated: sessions.length };
};

const getSessions = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  const enrollmentIds = await getEnrollmentIdsForUser(user);
  if (enrollmentIds) filter.enrollmentId = { $in: enrollmentIds };

  if (query.status) {
    const statuses = query.status
      .split(",")
      .map((status) => status.trim())
      .filter(Boolean);

    if (statuses.length > 0) {
      filter.status = { $in: statuses };
    }
  }

  if (query.scheduleId) filter.scheduleId = query.scheduleId;
  if (query.startDate) filter.date = { $gte: new Date(query.startDate) };
  if (query.endDate) filter.date = { ...filter.date, $lte: new Date(query.endDate) };

  const [sessions, total] = await Promise.all([
    ClassSession.find(filter)
      .populate(SESSION_POPULATION)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 }),
    ClassSession.countDocuments(filter),
  ]);

  const attendances = await Attendance.find({
    classSessionId: { $in: sessions.map((session) => session._id) },
  });

  const attendanceBySessionId = new Map(
    attendances.map((attendance) => [String(attendance.classSessionId), attendance])
  );

  const data = sessions.map((session) => ({
    ...session.toObject(),
    attendance: attendanceBySessionId.get(String(session._id)) || null,
  }));

  return { data, pagination: getPaginationMeta(total, page, limit) };
};

const createExtraSession = async (user, data) => {
  const enrollment = await Enrollment.findById(data.enrollmentId);
  if (!enrollment) {
    throw new NotFoundError("Enrollment not found");
  }

  assertOwnership(
    enrollment.teacherId,
    user.userId,
    "Not authorized to create an extra session for this enrollment"
  );

  const session = await ClassSession.create({
    enrollmentId: enrollment._id,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    meeting: data.meeting,
    status: SESSION_STATUS.SCHEDULED,
    createdBy: user.userId,
  });

  const attendance = await Attendance.create({
    classSessionId: session._id,
    overallStatus: SESSION_STATUS.SCHEDULED,
  });

  const populated = await ClassSession.findById(session._id).populate(SESSION_POPULATION);
  return { ...populated.toObject(), attendance: attendance.toObject() };
};

const getSessionWithAttendance = async (sessionId) => {
  const session = await ClassSession.findById(sessionId).populate(SESSION_POPULATION);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  const attendance = await Attendance.findOne({ classSessionId: sessionId });
  return {
    ...session.toObject(),
    attendance: attendance ? attendance.toObject() : null,
  };
};

module.exports = {
  generateSessionsForSchedule,
  getSessions,
  createExtraSession,
  getSessionWithAttendance,
};
