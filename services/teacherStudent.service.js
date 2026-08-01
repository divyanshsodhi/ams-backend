const User = require("../models/user");
const TeacherStudent = require("../models/teacherStudent");
const { NotFoundError, ConflictError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const { hashPassword } = require("../core/utils/hashPassword");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { deriveUsernameFromEmail } = require("../core/utils/username");
const config = require("../config");
const { ROLES } = require("../constants/roles");
const { RELATIONSHIP_STATUS, DEFAULT_MONTHLY_CLASSES } = require("../constants/relationshipStatus");

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

  const existingRelation = await TeacherStudent.findOne({
    teacherId,
    studentId: student._id,
  });

  if (existingRelation) {
    throw new ConflictError("Student is already linked to you");
  }

  const relationship = await TeacherStudent.create({
    teacherId,
    studentId: student._id,
    subjects: data.subjects || [],
    monthlyClasses: data.monthlyClasses || DEFAULT_MONTHLY_CLASSES,
    status: RELATIONSHIP_STATUS.ACTIVE,
  });

  return relationship.populate(["studentId", "subjects"]);
};

const getStudents = async (teacherId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { teacherId };

  if (query.status) {
    filter.status = query.status;
  }

  const [relationships, total] = await Promise.all([
    TeacherStudent.find(filter)
      .populate("studentId", USER_SAFE_PROJECTION)
      .populate("subjects")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TeacherStudent.countDocuments(filter),
  ]);

  return { data: relationships, pagination: getPaginationMeta(total, page, limit) };
};

const getStudent = async (teacherId, id) => {
  const relationship = await TeacherStudent.findOne({ _id: id, teacherId })
    .populate("studentId", USER_SAFE_PROJECTION)
    .populate("subjects");

  if (!relationship) {
    throw new NotFoundError("Student relationship not found");
  }

  return relationship;
};

const updateStudent = async (teacherId, id, data) => {
  const relationship = await TeacherStudent.findOneAndUpdate(
    { _id: id, teacherId },
    data,
    { new: true, runValidators: true }
  )
    .populate("studentId", USER_SAFE_PROJECTION)
    .populate("subjects");

  if (!relationship) {
    throw new NotFoundError("Student relationship not found");
  }

  return relationship;
};

const deleteStudent = async (teacherId, id) => {
  const relationship = await TeacherStudent.findOneAndDelete({ _id: id, teacherId });
  if (!relationship) {
    throw new NotFoundError("Student relationship not found");
  }
};

const assignStudent = async (data) => {
  const relationship = await TeacherStudent.create(data);
  return relationship.populate(["studentId", "teacherId", "subjects"]);
};

const getRelationships = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.teacherId) filter.teacherId = query.teacherId;
  if (query.studentId) filter.studentId = query.studentId;
  if (query.status) filter.status = query.status;

  const [relationships, total] = await Promise.all([
    TeacherStudent.find(filter)
      .populate("studentId", USER_SAFE_PROJECTION)
      .populate("teacherId", USER_SAFE_PROJECTION)
      .populate("subjects")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TeacherStudent.countDocuments(filter),
  ]);

  return { data: relationships, pagination: getPaginationMeta(total, page, limit) };
};

module.exports = { createStudent, getStudents, getStudent, updateStudent, deleteStudent, assignStudent, getRelationships };
