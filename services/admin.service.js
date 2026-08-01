const User = require("../models/user");
const { NotFoundError, ConflictError } = require("../core/errors");
const { getPaginationParams, getPaginationMeta } = require("../core/utils/pagination");
const { hashPassword } = require("../core/utils/hashPassword");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { deriveUsernameFromEmail } = require("../core/utils/username");
const config = require("../config");
const { ROLES } = require("../constants/roles");
const { USER_DEFAULTS } = require("../constants/userDefaults");
const { STATUS } = require("../constants/status");

const getTeachers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { role: ROLES.TEACHER };

  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [
      { fullName: regex },
      { email: regex },
      { username: regex },
    ];
  }

  if (query.status === STATUS.ACTIVE || query.status === STATUS.INACTIVE) {
    filter.isActive = query.status === STATUS.ACTIVE;
  }

  const [teachers, total] = await Promise.all([
    User.find(filter)
      .select(USER_SAFE_PROJECTION)
      .populate("subjects")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { data: teachers, pagination: getPaginationMeta(total, page, limit) };
};

const getTeacher = async (id) => {
  const teacher = await User.findOne({ _id: id, role: ROLES.TEACHER })
    .select(USER_SAFE_PROJECTION)
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

  const teacher = await User.create({
    username: data.username || deriveUsernameFromEmail(data.email),
    fullName: data.fullName,
    email: data.email.toLowerCase(),
    password: await hashPassword(data.password || config.DEFAULT_TEACHER_PASSWORD),
    country: data.country || USER_DEFAULTS.COUNTRY,
    countryCode: data.countryCode || USER_DEFAULTS.COUNTRY_CODE,
    phoneNumber: data.phoneNumber || USER_DEFAULTS.PHONE_NUMBER,
    role: ROLES.TEACHER,
    subjects: data.subjects || [],
    mustChangePassword: true,
  });

  return User.findById(teacher._id)
    .select(USER_SAFE_PROJECTION)
    .populate("subjects");
};

const updateTeacher = async (id, data) => {
  const teacher = await User.findOneAndUpdate(
    { _id: id, role: ROLES.TEACHER },
    data,
    { new: true, runValidators: true }
  ).select(USER_SAFE_PROJECTION).populate("subjects");

  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }

  return teacher;
};

const deleteTeacher = async (id) => {
  const teacher = await User.findOneAndDelete({ _id: id, role: ROLES.TEACHER });
  if (!teacher) {
    throw new NotFoundError("Teacher not found");
  }
};

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
