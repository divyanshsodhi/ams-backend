const User = require("../models/user");
const TeacherStudent = require("../models/teacherStudent");
const { NotFoundError, ConflictError, ValidationError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const bcrypt = require("bcrypt");

const createStudent = async (teacherId, data) => {
  let student = await User.findOne({ email: data.email.toLowerCase() });

  if (!student) {
    const hashedPassword = await bcrypt.hash(data.password || "student123", 10);
    student = await User.create({
      username: data.username || data.email.split("@")[0],
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      country: data.country,
      countryCode: data.countryCode,
      phoneNumber: data.phoneNumber,
      role: "student",
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
    monthlyClasses: data.monthlyClasses || 8,
    status: "active",
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
      .populate("studentId", "-password -refreshTokens")
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
    .populate("studentId", "-password -refreshTokens")
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
    .populate("studentId", "-password -refreshTokens")
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
      .populate("studentId", "-password -refreshTokens")
      .populate("teacherId", "-password -refreshTokens")
      .populate("subjects")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TeacherStudent.countDocuments(filter),
  ]);

  return { data: relationships, pagination: getPaginationMeta(total, page, limit) };
};

module.exports = { createStudent, getStudents, getStudent, updateStudent, deleteStudent, assignStudent, getRelationships };
