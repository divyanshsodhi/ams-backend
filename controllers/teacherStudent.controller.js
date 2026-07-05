const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const teacherStudentService = require("../services/teacherStudent.service");

const createStudent = asyncHandler(async (req, res) => {
  const result = await teacherStudentService.createStudent(req.user.userId, req.body);
  res.status(201).json(ApiResponse.created("Student created successfully", result));
});

const getStudents = asyncHandler(async (req, res) => {
  const result = await teacherStudentService.getStudents(req.user.userId, req.query);
  res.status(200).json(ApiResponse.success("Students fetched successfully", result));
});

const getStudent = asyncHandler(async (req, res) => {
  const student = await teacherStudentService.getStudent(req.user.userId, req.params.id);
  res.status(200).json(ApiResponse.success("Student fetched successfully", student));
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await teacherStudentService.updateStudent(req.user.userId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Student updated successfully", student));
});

const deleteStudent = asyncHandler(async (req, res) => {
  await teacherStudentService.deleteStudent(req.user.userId, req.params.id);
  res.status(200).json(ApiResponse.success("Student removed successfully"));
});

const assignStudent = asyncHandler(async (req, res) => {
  const result = await teacherStudentService.assignStudent(req.body);
  res.status(201).json(ApiResponse.created("Student assigned successfully", result));
});

const getRelationships = asyncHandler(async (req, res) => {
  const result = await teacherStudentService.getRelationships(req.query);
  res.status(200).json(ApiResponse.success("Relationships fetched successfully", result));
});

module.exports = { createStudent, getStudents, getStudent, updateStudent, deleteStudent, assignStudent, getRelationships };
