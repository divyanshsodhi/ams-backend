const Subject = require("../models/subject");
const { NotFoundError, ConflictError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");

const createSubject = async (data) => {
  const existing = await Subject.findOne({ name: data.name });
  if (existing) {
    throw new ConflictError("Subject with this name already exists");
  }

  const subject = await Subject.create(data);
  return subject;
};

const getSubjects = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true";
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { code: { $regex: query.search, $options: "i" } },
    ];
  }

  const [subjects, total] = await Promise.all([
    Subject.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Subject.countDocuments(filter),
  ]);

  return { data: subjects, pagination: getPaginationMeta(total, page, limit) };
};

const getSubject = async (id) => {
  const subject = await Subject.findById(id);
  if (!subject) {
    throw new NotFoundError("Subject not found");
  }
  return subject;
};

const updateSubject = async (id, data) => {
  const subject = await Subject.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!subject) {
    throw new NotFoundError("Subject not found");
  }
  return subject;
};

const deleteSubject = async (id) => {
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    throw new NotFoundError("Subject not found");
  }
};

module.exports = { createSubject, getSubjects, getSubject, updateSubject, deleteSubject };
