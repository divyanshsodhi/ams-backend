const ROLES = Object.freeze({
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
});

const ROLE_HIERARCHY = Object.freeze({
  [ROLES.ADMIN]: 3,
  [ROLES.TEACHER]: 2,
  [ROLES.STUDENT]: 1,
});

const ALL_ROLES = Object.values(ROLES);

module.exports = { ROLES, ROLE_HIERARCHY, ALL_ROLES };
