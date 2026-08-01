const ClassSession = require("../models/classSession");
const TeacherStudent = require("../models/teacherStudent");
const { SESSION_STATUS } = require("../constants/sessionStatus");
const { startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth } = require("../core/utils/dates");

const getAdminAnalytics = async () => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const dayEnd = endOfDay(now);

  const [todayClasses, weeklyClasses, monthlyClasses, statusBreakdown] = await Promise.all([
    ClassSession.countDocuments({ classDate: { $gte: dayStart, $lte: dayEnd } }),
    ClassSession.countDocuments({ classDate: { $gte: weekStart, $lte: dayEnd } }),
    ClassSession.countDocuments({ classDate: { $gte: monthStart, $lte: dayEnd } }),
    ClassSession.aggregate([
      { $match: { classDate: { $gte: monthStart, $lte: dayEnd } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const statusMap = Object.fromEntries(
    statusBreakdown.map((item) => [item._id, item.count])
  );

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

  const [todayClasses, monthlyTotal, pendingConfirmations, studentRelations] = await Promise.all([
    ClassSession.countDocuments({
      teacherId,
      classDate: { $gte: dayStart, $lte: dayEnd },
    }),
    ClassSession.countDocuments({
      teacherId,
      classDate: { $gte: monthStart, $lte: monthEnd },
    }),
    ClassSession.countDocuments({
      teacherId,
      status: SESSION_STATUS.PENDING_CONFIRMATION,
    }),
    TeacherStudent.find({ teacherId }).select("monthlyClasses completedClassesCurrentCycle"),
  ]);

  const completedMonthly = studentRelations.reduce(
    (sum, rel) => sum + (rel.completedClassesCurrentCycle || 0),
    0
  );

  const totalMonthlyCapacity = studentRelations.reduce(
    (sum, rel) => sum + (rel.monthlyClasses || 0),
    0
  );

  const completionPercentage =
    totalMonthlyCapacity > 0
      ? Math.round((completedMonthly / totalMonthlyCapacity) * 100)
      : 0;

  return {
    todayClasses,
    monthlyTotal,
    completedMonthly,
    totalMonthlyCapacity,
    completionPercentage,
    pendingConfirmations,
    studentCount: studentRelations.length,
  };
};

const getStudentAnalytics = async (studentId) => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [upcomingClasses, completedClasses, pendingConfirmations, todayClasses, teacherStudent] =
    await Promise.all([
      ClassSession.countDocuments({
        studentId,
        classDate: { $gte: dayEnd },
        status: SESSION_STATUS.SCHEDULED,
      }),
      ClassSession.countDocuments({
        studentId,
        status: SESSION_STATUS.COMPLETED,
        classDate: { $gte: monthStart, $lte: monthEnd },
      }),
      ClassSession.countDocuments({
        studentId,
        status: SESSION_STATUS.PENDING_CONFIRMATION,
      }),
      ClassSession.countDocuments({
        studentId,
        classDate: { $gte: dayStart, $lte: dayEnd },
      }),
      TeacherStudent.findOne({ studentId }),
    ]);

  const monthlyClasses = teacherStudent ? teacherStudent.monthlyClasses || 0 : 0;
  const completedClassesCurrentCycle = teacherStudent
    ? teacherStudent.completedClassesCurrentCycle || 0
    : 0;

  return {
    upcomingClasses,
    completedClasses,
    pendingConfirmations,
    todayClasses,
    monthlyClasses,
    completedClassesCurrentCycle,
    remainingClasses: monthlyClasses - completedClassesCurrentCycle,
  };
};

module.exports = { getAdminAnalytics, getTeacherAnalytics, getStudentAnalytics };
