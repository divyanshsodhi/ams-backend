const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/connection");
const { validateEnv } = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./core/logger");

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "local"}`,
});

validateEnv();
connectDB();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "AMS API is running", timestamp: new Date().toISOString() });
});

const authRouter = require("./routes/auth.routes");
const subjectRouter = require("./routes/subject.routes");
const teacherStudentRouter = require("./routes/teacherStudent.routes");
const scheduleRouter = require("./routes/schedule.routes");
const classSessionRouter = require("./routes/classSession.routes");
const analyticsRouter = require("./routes/analytics.routes");
const adminRouter = require("./routes/admin.routes");

app.use("/auth", authRouter);
app.use("/subjects", subjectRouter);
app.use("/teacher", teacherStudentRouter);
app.use("/admin", adminRouter);
app.use("/schedules", scheduleRouter);
app.use("/sessions", classSessionRouter);
app.use("/analytics", analyticsRouter);

app.use(errorHandler);

const { startMonthlyResetJob } = require("./jobs/monthlyReset.job");
const { startReminderJob } = require("./jobs/reminder.job");

startMonthlyResetJob();
startReminderJob();

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
