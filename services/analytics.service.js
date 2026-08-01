const ClassSession = require("../models/classSession");
const Attendance = require("../models/attendance");
const Enrollment = require("../models/enrollment");
const { SESSION_STATUS } = require("../constants/sessionStatus");
const { ENROLLMENT_STATUS } = require("../constants/enrollment");
const { startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth } = require("../core/utils/dates");
const { getEnrollmentIds } = require("./enrollment.service");

const toStatusMap = (breakdown) =>
  Object.fromEntries(breakdown.map((item) => [item._id, item.count]));

const sessionStatusBreakdown = async ({ enrollmentIds, dateStart, dateEnd }) => {
  const match = {};

  // undefined/null means "no enrollment scoping" (admin). An empty array must
  // still match nothing, so it is applied as $in: [].
  if (enrollmentIds !== undefined && enrollmentIds !== null) {
    match["session.enrollmentId"] = { $in: enrollmentIds };
  }

  if (dateStart || dateEnd) {
    match["session.date"] = {
      ...(dateStart ? { $gte: dateStart } : {}),
      ...(dateEnd ? { $lte: dateEnd } : {}),
    };
  }

  const breakdown = await Attendance.aggregate([
    {
      $lookup: {
        from: ClassSession.collection.name,
        localField: "classSessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $unwind: "$session" },
    { $match: match },
    { $group: { _id: "$overallStatus", count: { $sum: 1 } } },
  ]);

  return toStatusMap(breakdown);
};

const getAdminAnalytics = async () => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const dayEnd = endOfDay(now);

  const [todayClasses, weeklyClasses, monthlyClasses, statusMap] = await Promise.all([
    ClassSession.countDocuments({ date: { $gte: dayStart, $lte: dayEnd } }),
    ClassSession.countDocuments({ date: { $gte: weekStart, $lte: dayEnd } }),
    ClassSession.countDocuments({ date: { $gte: monthStart, $lte: dayEnd } }),
    sessionStatusBreakdown({ dateStart: monthStart, dateEnd: dayEnd }),
  ]);

  return {
    todayClasses,
    weeklyClasses,
    monthlyClasses,
    completed: statusMap[SESSION_STATUS.COMPLETED] || 0,
    cancelled: statusMap[SESSION_STATUS.CANCELLED] || 0,
    rescheduled: statusMap[SESSION_STATUS.RESCHEDULED] || 0,
    pendingConfirmations: statusMap[SESSION_STATUS.PENDING_CONFIRMATION] || 0,
    scheduled: statusMap[SESSION_STATUS.SCHEDULED] || 0,
    disputed: statusMap[SESSION_STATUS.DISPUTED] || 0,
  };
};

const getTeacherAnalytics = async (teacherId) => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const enrollmentIds = await getEnrollmentIds({ teacherId });
  const enrollmentFilter = { enrollmentId: { $in: enrollmentIds } };

  const [activeEnrollments, todayClasses, monthlyTotal, statusMap] = await Promise.all([
    Enrollment.find({ teacherId, status: ENROLLMENT_STATUS.ACTIVE }).select(
      "monthlyClasses extraMonthlyClasses"
    ),
    ClassSession.countDocuments({
      ...enrollmentFilter,
      date: { $gte: dayStart, $lte: dayEnd },
    }),
    ClassSession.countDocuments({
      ...enrollmentFilter,
      date: { $gte: monthStart, $lte: monthEnd },
    }),
    sessionStatusBreakdown({ enrollmentIds, dateStart: monthStart, dateEnd: monthEnd }),
  ]);

  const completedMonthly = statusMap[SESSION_STATUS.COMPLETED] || 0;
  const totalMonthlyCapacity = activeEnrollments.reduce(
    (sum, enrollment) =>
      sum + enrollment.monthlyClasses + (enrollment.extraMonthlyClasses || 0),
    0
  );
  const completionPercentage =
    totalMonthlyCapacity > 0 ? Math.round((completedMonthly / totalMonthlyCapacity) * 100) : 0;

  return {
    todayClasses,
    monthlyTotal,
    completedMonthly,
    totalMonthlyCapacity,
    completionPercentage,
    pendingConfirmations: statusMap[SESSION_STATUS.PENDING_CONFIRMATION] || 0,
    studentCount: activeEnrollments.length,
  };
};

const getStudentAnalytics = async (studentId) => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const enrollmentIds = await getEnrollmentIds({ studentId });
  const enrollmentFilter = { enrollmentId: { $in: enrollmentIds } };

  const [activeEnrollments, upcomingClasses, completedClasses, pendingConfirmations, todayClasses] =
    await Promise.all([
      Enrollment.find({ studentId, status: ENROLLMENT_STATUS.ACTIVE }).select(
        "monthlyClasses extraMonthlyClasses quotaEffectiveFrom"
      ),
      ClassSession.countDocuments({
        ...enrollmentFilter,
        date: { $gte: dayEnd },
        status: SESSION_STATUS.SCHEDULED,
      }),
      sessionStatusBreakdown({ enrollmentIds, dateStart: monthStart, dateEnd: monthEnd }),
      sessionStatusBreakdown({ enrollmentIds }),
      ClassSession.countDocuments({
        ...enrollmentFilter,
        date: { $gte: dayStart, $lte: dayEnd },
      }),
    ]);

  const monthlyQuota = activeEnrollments.reduce(
    (sum, enrollment) =>
      sum + enrollment.monthlyClasses + (enrollment.extraMonthlyClasses || 0),
    0
  );

  const quotaEffectiveFrom = activeEnrollments.length
    ? new Date(Math.min(...activeEnrollments.map((enrollment) => enrollment.quotaEffectiveFrom)))
    : null;

  const cycleCompleted = quotaEffectiveFrom
    ? (await sessionStatusBreakdown({ enrollmentIds, dateStart: quotaEffectiveFrom }))[
        SESSION_STATUS.COMPLETED
      ] || 0
    : 0;

  return {
    upcomingClasses,
    completedClasses: completedClasses[SESSION_STATUS.COMPLETED] || 0,
    pendingConfirmations: pendingConfirmations[SESSION_STATUS.PENDING_CONFIRMATION] || 0,
    todayClasses,
    monthlyQuota,
    completedClassesCurrentCycle: cycleCompleted,
    remainingClasses: Math.max(0, monthlyQuota - cycleCompleted),
  };
};

module.exports = { getAdminAnalytics, getTeacherAnalytics, getStudentAnalytics };
