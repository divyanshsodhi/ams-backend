const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const adminService = require("../services/admin.service");

const getTeachers = asyncHandler(async (req, res) => {
  const result = await adminService.getTeachers(req.query);
  res.status(200).json(ApiResponse.success("Teachers fetched successfully", result));
});

const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await adminService.getTeacher(req.params.id);
  res.status(200).json(ApiResponse.success("Teacher fetched successfully", teacher));
});

const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await adminService.createTeacher(req.body);
  res.status(201).json(ApiResponse.created("Teacher created successfully", teacher));
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await adminService.updateTeacher(req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Teacher updated successfully", teacher));
});

const deleteTeacher = asyncHandler(async (req, res) => {
  await adminService.deleteTeacher(req.params.id);
  res.status(200).json(ApiResponse.success("Teacher deleted successfully"));
});

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
