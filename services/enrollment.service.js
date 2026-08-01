const User = require("../models/user");
const Enrollment = require("../models/enrollment");
const { NotFoundError, ConflictError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const { hashPassword } = require("../core/utils/hashPassword");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { deriveUsernameFromEmail } = require("../core/utils/username");
const config = require("../config");
const { ROLES } = require("../constants/roles");
const {
  ENROLLMENT_STATUS,
  DEFAULT_MONTHLY_CLASSES,
  DEFAULT_EXTRA_MONTHLY_CLASSES,
} = require("../constants/enrollment");

const ENROLLMENT_POPULATION = [
  { path: "studentId", select: USER_SAFE_PROJECTION },
  { path: "teacherId", select: USER_SAFE_PROJECTION },
  "subjectId",
];

const getEnrollmentIds = async ({ teacherId, studentId, subjectId, status } = {}) => {
  const filter = {};
  if (teacherId) filter.teacherId = teacherId;
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  if (status) filter.status = status;

  const enrollments = await Enrollment.find(filter).select("_id");
  return enrollments.map((enrollment) => enrollment._id);
};

const getEnrollmentIdsForUser = async (user) => {
  if (user.role === ROLES.TEACHER) {
    return getEnrollmentIds({ teacherId: user.userId });
  }

  if (user.role === ROLES.STUDENT) {
    return getEnrollmentIds({ studentId: user.userId });
  }

  return null;
};

const createEnrollment = async (data) => {
  const existing = await Enrollment.findOne({
    teacherId: data.teacherId,
    studentId: data.studentId,
    subjectId: data.subjectId,
  });

  if (existing) {
    throw new ConflictError(
      "This student is already enrolled in this subject with the given teacher"
    );
  }

  const enrollment = await Enrollment.create({
    ...data,
    status: ENROLLMENT_STATUS.ACTIVE,
    joinedAt: new Date(),
  });

  return enrollment.populate(ENROLLMENT_POPULATION);
};

const createStudent = async (teacherId, data) => {
  let student = await User.findOne({ email: data.email.toLowerCase() });

  if (!student) {
    student = await User.create({
      username: data.username || deriveUsernameFromEmail(data.email),
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      password: await hashPassword(data.password || config.DEFAULT_STUDENT_PASSWORD),
      country: data.country || undefined,
      countryCode: data.countryCode || undefined,
      phoneNumber: data.phoneNumber || undefined,
      role: ROLES.STUDENT,
    });
  }

  return createEnrollment({
    teacherId,
    studentId: student._id,
    subjectId: data.subjectId,
    monthlyClasses: data.monthlyClasses ?? DEFAULT_MONTHLY_CLASSES,
    extraMonthlyClasses: data.extraMonthlyClasses ?? DEFAULT_EXTRA_MONTHLY_CLASSES,
    createdBy: teacherId,
  });
};

const getStudents = async (teacherId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { teacherId };

  if (query.status) {
    filter.status = query.status;
  }

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate(ENROLLMENT_POPULATION)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Enrollment.countDocuments(filter),
  ]);

  return { data: enrollments, pagination: getPaginationMeta(total, page, limit) };
};

const getStudent = async (teacherId, id) => {
  const enrollment = await Enrollment.findOne({ _id: id, teacherId }).populate(
    ENROLLMENT_POPULATION
  );

  if (!enrollment) {
    throw new NotFoundError("Student enrollment not found");
  }

  return enrollment;
};

const updateStudent = async (teacherId, id, data) => {
  const enrollment = await Enrollment.findOneAndUpdate(
    { _id: id, teacherId },
    data,
    { new: true, runValidators: true }
  ).populate(ENROLLMENT_POPULATION);

  if (!enrollment) {
    throw new NotFoundError("Student enrollment not found");
  }

  return enrollment;
};

const deleteStudent = async (teacherId, id) => {
  const enrollment = await Enrollment.findOneAndDelete({ _id: id, teacherId });
  if (!enrollment) {
    throw new NotFoundError("Student enrollment not found");
  }
};

const assignStudent = async (adminId, data) => {
  return createEnrollment({
    ...data,
    createdBy: adminId,
  });
};

const getEnrollments = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.teacherId) filter.teacherId = query.teacherId;
  if (query.studentId) filter.studentId = query.studentId;
  if (query.subjectId) filter.subjectId = query.subjectId;
  if (query.status) filter.status = query.status;

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate(ENROLLMENT_POPULATION)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Enrollment.countDocuments(filter),
  ]);

  return { data: enrollments, pagination: getPaginationMeta(total, page, limit) };
};

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  assignStudent,
  getEnrollments,
  getEnrollmentIds,
  getEnrollmentIdsForUser,
};
