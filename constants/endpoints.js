const ENDPOINTS = {
  health: "/health",

  auth: {
    base: "/auth",
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    changePassword: "/auth/change-password",
    me: "/auth/me",
  },

  subjects: {
    base: "/subjects",
    detail: (id) => `/subjects/${id}`,
  },

  teacher: {
    base: "/teacher",
    students: "/teacher/students",
    studentDetail: (id) => `/teacher/students/${id}`,
    assignStudent: "/teacher/assign-student",
    relationships: "/teacher/relationships",
  },

  admin: {
    base: "/admin",
    teachers: "/admin/teachers",
    teacherDetail: (id) => `/admin/teachers/${id}`,
  },

  schedules: {
    base: "/schedules",
    detail: (id) => `/schedules/${id}`,
    upcoming: "/schedules/upcoming",
  },

  sessions: {
    base: "/sessions",
    teacherConfirm: (id) => `/sessions/${id}/teacher-confirm`,
    studentConfirm: (id) => `/sessions/${id}/student-confirm`,
    reject: (id) => `/sessions/${id}/reject`,
    cancel: (id) => `/sessions/${id}/cancel`,
    reschedule: (id) => `/sessions/${id}/reschedule`,
    extra: "/sessions/extra",
    generate: (scheduleId) => `/sessions/generate/${scheduleId}`,
  },

  analytics: {
    base: "/analytics",
    admin: "/analytics/admin",
    teacher: "/analytics/teacher",
    student: "/analytics/student",
  },
};

module.exports = { ENDPOINTS };
