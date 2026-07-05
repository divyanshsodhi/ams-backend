const ClassSession = require("../models/classSession");
const TeacherStudent = require("../models/teacherStudent");
const { SESSION_STATUS } = require("../constants/sessionStatus");

const getAdminAnalytics = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  now.setHours(23, 59, 59, 999);

  const todayClasses = await ClassSession.countDocuments({
    classDate: { $gte: startOfDay, $lte: now },
  });

  const weeklyClasses = await ClassSession.countDocuments({
    classDate: { $gte: startOfWeek, $lte: now },
  });

  const monthlyClasses = await ClassSession.countDocuments({
    classDate: { $gte: startOfMonth, $lte: now },
  });

  const statusBreakdown = await ClassSession.aggregate([
    { $match: { classDate: { $gte: startOfMonth, $lte: now } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const statusMap = {};
  statusBreakdown.forEach(function(item) {
    statusMap[item._id] = item.count;
  });

  return {
    todayClasses: todayClasses,
    weeklyClasses: weeklyClasses,
    monthlyClasses: monthlyClasses,
    completed: statusMap[SESSION_STATUS.COMPLETED] || 0,
    cancelled: statusMap[SESSION_STATUS.CANCELLED] || 0,
    rescheduled: statusMap[SESSION_STATUS.RESCHEDULED] || 0,
    pendingConfirmations: statusMap[SESSION_STATUS.PENDING_CONFIRMATION] || 0,
    scheduled: statusMap[SESSION_STATUS.SCHEDULED] || 0,
    disputed: statusMap[SESSION_STATUS.DISPUTED] || 0,
  };
};

const getTeacherAnalytics = async function(teacherId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  now.setHours(23, 59, 59, 999);

  const todayClasses = await ClassSession.countDocuments({
    teacherId: teacherId,
    classDate: { $gte: startOfDay, $lte: now },
  });

  const monthlyTotal = await ClassSession.countDocuments({
    teacherId: teacherId,
    classDate: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const pendingConfirmations = await ClassSession.countDocuments({
    teacherId: teacherId,
    status: SESSION_STATUS.PENDING_CONFIRMATION,
  });

  const studentRelations = await TeacherStudent.find({ teacherId: teacherId })
    .select("monthlyClasses completedClassesCurrentCycle");

  var completedMonthly = 0;
  var totalMonthlyCapacity = 0;

  studentRelations.forEach(function(rel) {
    completedMonthly = completedMonthly + (rel.completedClassesCurrentCycle || 0);
    totalMonthlyCapacity = totalMonthlyCapacity + (rel.monthlyClasses || 0);
  });

  var completionPercentage = 0;
  if (totalMonthlyCapacity > 0) {
    completionPercentage = Math.round((completedMonthly / totalMonthlyCapacity) * 100);
  }

  return {
    todayClasses: todayClasses,
    monthlyTotal: monthlyTotal,
    completedMonthly: completedMonthly,
    totalMonthlyCapacity: totalMonthlyCapacity,
    completionPercentage: completionPercentage,
    pendingConfirmations: pendingConfirmations,
    studentCount: studentRelations.length,
  };
};

const getStudentAnalytics = async function(studentId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  now.setHours(23, 59, 59, 999);

  const upcomingClasses = await ClassSession.countDocuments({
    studentId: studentId,
    classDate: { $gte: now },
    status: SESSION_STATUS.SCHEDULED,
  });

  const completedClasses = await ClassSession.countDocuments({
    studentId: studentId,
    status: SESSION_STATUS.COMPLETED,
    classDate: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const pendingConfirmations = await ClassSession.countDocuments({
    studentId: studentId,
    status: SESSION_STATUS.PENDING_CONFIRMATION,
  });

  const todayClasses = await ClassSession.countDocuments({
    studentId: studentId,
    classDate: { $gte: startOfDay, $lte: now },
  });

  const teacherStudent = await TeacherStudent.findOne({ studentId: studentId });

  return {
    upcomingClasses: upcomingClasses,
    completedClasses: completedClasses,
    pendingConfirmations: pendingConfirmations,
    todayClasses: todayClasses,
    monthlyClasses: teacherStudent ? teacherStudent.monthlyClasses || 0 : 0,
    completedClassesCurrentCycle: teacherStudent ? teacherStudent.completedClassesCurrentCycle || 0 : 0,
    remainingClasses: teacherStudent ? (teacherStudent.monthlyClasses || 0) - (teacherStudent.completedClassesCurrentCycle || 0) : 0,
  };
};

module.exports = { getAdminAnalytics: getAdminAnalytics, getTeacherAnalytics: getTeacherAnalytics, getStudentAnalytics: getStudentAnalytics };
