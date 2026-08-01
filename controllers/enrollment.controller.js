const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const enrollmentService = require("../services/enrollment.service");

const createStudent = asyncHandler(async (req, res) => {
  const result = await enrollmentService.createStudent(req.user.userId, req.body);
  res.status(201).json(ApiResponse.created("Student enrolled successfully", result));
});

const getStudents = asyncHandler(async (req, res) => {
  const result = await enrollmentService.getStudents(req.user.userId, req.query);
  res.status(200).json(ApiResponse.success("Students fetched successfully", result));
});

const getStudent = asyncHandler(async (req, res) => {
  const student = await enrollmentService.getStudent(req.user.userId, req.params.id);
  res.status(200).json(ApiResponse.success("Student fetched successfully", student));
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await enrollmentService.updateStudent(req.user.userId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Student updated successfully", student));
});

const deleteStudent = asyncHandler(async (req, res) => {
  await enrollmentService.deleteStudent(req.user.userId, req.params.id);
  res.status(200).json(ApiResponse.success("Student removed successfully"));
});

const assignStudent = asyncHandler(async (req, res) => {
  const result = await enrollmentService.assignStudent(req.user.userId, req.body);
  res.status(201).json(ApiResponse.created("Student assigned successfully", result));
});

const getEnrollments = asyncHandler(async (req, res) => {
  const result = await enrollmentService.getEnrollments(req.query);
  res.status(200).json(ApiResponse.success("Enrollments fetched successfully", result));
});

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  assignStudent,
  getEnrollments,
};
