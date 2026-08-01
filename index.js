require("dotenv").config({ path: `.env.${process.env.NODE_ENV || "local"}` });

const express = require("express");
const cors = require("cors");
const config = require("./config");
const connectDB = require("./config/connection");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./core/logger");
const { ENDPOINTS } = require("./constants/endpoints");
const ApiResponse = require("./core/utils/ApiResponse");

connectDB();

const app = express();

// TODO(security): Planned hardening, deferred until after a decision on the
// CORS/rate-limit defaults. When implementing:
//   1. Install helmet and express-rate-limit.
//   2. Restrict CORS to a single origin read from CORS_ORIGIN (default to
//      permissive only in local/development so the Expo web app keeps working).
//   3. Add a global rate limiter (e.g. 12 requests/sec) before the routers.
// See https://github.com/anomalyco/ams for context.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(ENDPOINTS.health, (req, res) => {
  const response = new ApiResponse(200, "AMS API is running", {
    timestamp: new Date().toISOString(),
  });
  res.status(response.statusCode).json(response);
});

const authRouter = require("./routes/auth.routes");
const subjectRouter = require("./routes/subject.routes");
const teacherStudentRouter = require("./routes/teacherStudent.routes");
const scheduleRouter = require("./routes/schedule.routes");
const classSessionRouter = require("./routes/classSession.routes");
const analyticsRouter = require("./routes/analytics.routes");
const adminRouter = require("./routes/admin.routes");

app.use(ENDPOINTS.auth.base, authRouter);
app.use(ENDPOINTS.subjects.base, subjectRouter);
app.use(ENDPOINTS.teacher.base, teacherStudentRouter);
app.use(ENDPOINTS.admin.base, adminRouter);
app.use(ENDPOINTS.schedules.base, scheduleRouter);
app.use(ENDPOINTS.sessions.base, classSessionRouter);
app.use(ENDPOINTS.analytics.base, analyticsRouter);

app.use((req, res) => {
  const response = new ApiResponse(404, "Route not found");
  res.status(response.statusCode).json(response);
});

app.use(errorHandler);

const { startMonthlyResetJob } = require("./jobs/monthlyReset.job");
const { startReminderJob } = require("./jobs/reminder.job");

startMonthlyResetJob();
startReminderJob();

app.listen(config.PORT, () => {
  logger.info(`Server is running on port ${config.PORT}`);
});
