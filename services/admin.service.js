const User = require("../models/user");
const { NotFoundError, ConflictError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const authService = require("./auth.service");

const getTeachers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { role: "teacher" };

  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [
      { fullName: regex },
      { email: regex },
      { username: regex },
    ];
  }

  if (query.status === "active" || query.status === "inactive") {
    filter.isActive = query.status === "active";
  }

  const [teachers, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshTokens")
      .populate("subjects")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { data: teachers, pagination: getPaginationMeta(total, page, limit) };
};

const getTeacher = async (id) => {
  const teacher = await User.findOne({ _id: id, role: "teacher" })
    .select("-password -refreshTokens")
    .populate("subjects");

  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }

  return teacher;
};

const createTeacher = async (data) => {
  const existingUser = await User.findOne({
    $or: [
      { email: data.email },
      ...(data.username ? [{ username: data.username }] : []),
    ],
  });

  if (existingUser) {
    throw new ConflictError("User with this email or username already exists");
  }

  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash(data.password || "teacher123", 10);

  const teacher = await User.create({
    username: data.username || data.email.split("@")[0],
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    country: data.country || "Unknown",
    countryCode: data.countryCode || "unknown",
    phoneNumber: data.phoneNumber || "0000000000",
    role: "teacher",
    subjects: data.subjects || [],
    mustChangePassword: true,
  });

  const created = await User.findById(teacher._id)
    .select("-password -refreshTokens")
    .populate("subjects");

  return created;
};

const updateTeacher = async (id, data) => {
  const teacher = await User.findOneAndUpdate(
    { _id: id, role: "teacher" },
    data,
    { new: true, runValidators: true }
  ).select("-password -refreshTokens").populate("subjects");

  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }

  return teacher;
};

const deleteTeacher = async (id) => {
  const teacher = await User.findOneAndDelete({ _id: id, role: "teacher" });
  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }
};

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
