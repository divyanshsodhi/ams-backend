const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const subjectService = require("../services/subject.service");

const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body);
  res.status(201).json(ApiResponse.created("Subject created successfully", subject));
});

const getSubjects = asyncHandler(async (req, res) => {
  const result = await subjectService.getSubjects(req.query);
  res.status(200).json(ApiResponse.success("Subjects fetched successfully", result));
});

const getSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubject(req.params.id);
  res.status(200).json(ApiResponse.success("Subject fetched successfully", subject));
});

const updateSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.updateSubject(req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Subject updated successfully", subject));
});

const deleteSubject = asyncHandler(async (req, res) => {
  await subjectService.deleteSubject(req.params.id);
  res.status(200).json(ApiResponse.success("Subject deleted successfully"));
});

module.exports = { createSubject, getSubjects, getSubject, updateSubject, deleteSubject };
