# AMS Database Redesign — Migration Notes

This document describes the database redesign from the legacy `TeacherStudent` /
`ClassSession`-centric schema to a normalized, enrollment-centric schema.

**Status:** Schema (Mongoose models) + services/controllers refactored. No data
migration script is shipped with this change; run the backfill steps below
against a snapshot before deploying.

---

## 1. Why

The legacy schema duplicated academic context across collections and stored
calculated counters:

- `ClassSession` duplicated `teacherId`, `studentId`, `subjectId` already known
  from its `Schedule`/`TeacherStudent`.
- `TeacherStudent` could not model "one teacher teaches two subjects to the
  same student" (subject list was an array and the unique key was only
  `{teacherId, studentId}`).
- `completedClassesCurrentCycle` / `previousCompletedClasses` were mutable
  counters that could drift from reality and required a nightly reset job.

The new model treats an **Enrollment** (`teacher` + `subject` + `student`) as
the atomic academic unit. Every other document resolves context through it.

---

## 2. Collection mapping

| Legacy collection | New collection | Notes |
|---|---|---|
| `users` | `users` | `subjects` array removed. |
| `subjects` | `subjects` | `isActive` removed. |
| `teacherstudents` | `enrollments` | Renamed + restructured (see below). |
| `schedules` | `schedules` | No `teacherId`/`studentId`/`subjectId`; added `enrollmentId`, `repeatType`, `timezone`, `createdBy`. |
| `classsessions` | `classsessions` | No `teacherId`/`studentId`/`subjectId`; added `enrollmentId`, `date` (was `classDate`), `meeting`, `createdBy`; removed `sessionType`, `teacherConfirmed`, `studentConfirmed`, `reason`, `cancellationReason`, `rescheduledTo`. |
| — | `attendances` | **New** 1:1 confirmation record per session. |
| `notifications` | `notifications` | Unchanged. |

---

## 3. Field-level mapping

### `users`
| Legacy | New | Notes |
|---|---|---|
| `subjects` | — | Removed. Academic context now lives on `enrollments`. |

### `subjects`
| Legacy | New | Notes |
|---|---|---|
| `isActive` | — | Removed; subject lifecycle is implied by enrollment activity. |

### `teacherstudents` → `enrollments`
| Legacy | New | Notes |
|---|---|---|
| `teacherId` | `teacherId` | Same. |
| `studentId` | `studentId` | Same. |
| `subjects[]` | `subjectId` | Single subject per enrollment; create one enrollment per subject. |
| `monthlyClasses` | `monthlyClasses` | Same (default 8). |
| — | `extraMonthlyClasses` | New (default 0). Total monthly quota = `monthlyClasses + extraMonthlyClasses`. |
| — | `quotaEffectiveFrom` | New (default 1st of current month). Marks the start of the current quota cycle; there is no stored cycle end. |
| — | `joinedAt` | New (default now). |
| — | `createdBy` | New. Actor who created the enrollment (teacher or admin). |
| `cycleStartDate` / `cycleEndDate` | — | Removed (derivable from `quotaEffectiveFrom`). |
| `previousCompletedClasses` | — | Removed (reported value, no longer stored). |
| `completedClassesCurrentCycle` | — | Removed; computed from `attendances.overallStatus = completed`. |
| `status` | `status` | Same (`active`/`inactive`). |
| unique `{teacherId, studentId}` | unique `{teacherId, studentId, subjectId}` | One row per teacher-subject-student. |

### `schedules`
| Legacy | New | Notes |
|---|---|---|
| `teacherStudentId` | `enrollmentId` | Renamed. |
| `recurrenceType` | `repeatType` | Renamed (values unchanged: daily/weekly/biweekly/monthly). |
| `teacherId`, `studentId`, `subjectId` | — | Removed; resolved via `enrollmentId`. |
| `meetingMode`, `meetingLink`, `location` | — | Removed from schedules; meeting details moved to the concrete session (`classsessions.meeting`). |
| — | `timezone` | New (IANA, default `UTC`). Used for weekday resolution during session generation. |
| — | `createdBy` | New. |
| `isActive` | `isActive` | Same. |

### `classsessions`
| Legacy | New | Notes |
|---|---|---|
| `classDate` | `date` | Renamed. |
| `teacherId`, `studentId`, `subjectId` | — | Removed; resolved via `enrollmentId`. |
| `sessionType` (`regular`/`extra`) | — | Removed; derived: a session with `scheduleId` is regular, without it is extra. |
| `teacherConfirmed`, `studentConfirmed` | — | Replaced by `attendances.teacherStatus` / `studentStatus`. |
| `status` | `status` | Kept as the authoritative lifecycle (scheduled/pending_confirmation/completed/cancelled/rescheduled/disputed). |
| `reason` | — | Removed. |
| `cancellationReason` | — | Removed; cancellation intent is recorded as `teacherStatus = cancel_requested`. |
| `rescheduledTo` | — | Removed; rescheduling updates `date`/`startTime`/`endTime` in place. |
| — | `meeting` | New subdocument `{provider, meetingId, meetingLink, password}`. `provider` enum: `none`/`zoom`/`google_meet` (extensible). |
| — | `createdBy` | New (null for job-generated sessions). |
| unique `{scheduleId, classDate}` | unique sparse `{scheduleId, date}` | Sparse so extra sessions (no `scheduleId`) never collide. |

### `attendances` (new)
| Field | Type | Notes |
|---|---|---|
| `classSessionId` | ObjectId → `classsessions` | Unique (1:1). |
| `teacherStatus` | enum `pending/present/absent/cancel_requested/reschedule_requested` | Source of truth for the teacher's confirmation. |
| `studentStatus` | enum (same values) | Source of truth for the student's confirmation. |
| `overallStatus` | enum scheduled/pending_confirmation/completed/cancelled/rescheduled/disputed | **Derived** — computed by `core/domain/attendance.js`, never set independently. |
| `teacherConfirmedAt` / `studentConfirmedAt` | Date | Set when a party reports present/absent. |
| `timestamps` | — | — |

---

## 4. Status derivation rules

Single source: `core/domain/attendance.js` → `deriveOverallStatus`.

1. Terminal lifecycle states win: `cancelled`, `rescheduled`, `disputed`, `completed`.
2. Otherwise, when both parties have reported (`present` or `absent`) the
   session settles as `completed`; per-party statuses carry who attended.
3. When exactly one party has reported, status is `pending_confirmation`.
4. Otherwise `scheduled`.

`ClassSession.status` and `Attendance.overallStatus` are kept in sync by
`services/attendance.service.js` (`applyOverallStatus`).

---

## 5. Indexes

### `enrollments`
- unique `{teacherId, studentId, subjectId}`
- `{teacherId, status}`
- `{studentId, status}`
- `{subjectId}`

### `schedules`
- `{enrollmentId, isActive}`
- `{enrollmentId, startDate}`

### `classsessions`
- `{enrollmentId, date: -1}`
- unique sparse `{scheduleId, date}`
- `{date, status}`

### `attendances`
- unique `{classSessionId}`
- `{overallStatus, updatedAt: -1}`

---

## 6. Jobs

- **Removed** `monthlyReset.job.js` — no counters to reset anymore; quota usage
  is computed from attendance records on demand.
- **Reminder** job now resolves names through `enrollmentId` instead of direct
  `teacherId`/`studentId` on the session.

---

## 7. API contract changes (consumers must adapt)

Frontend/API consumers must update to the new shapes:

- **Teacher students / admin relationships**
  - Create student now requires `subjectId` (one enrollment per subject).
  - List/detail responses are `enrollment` documents: teacher/student/subject
    are nested under populated `teacherId`, `studentId`, `subjectId`.
- **Schedules**
  - Request/response field `enrollmentId` (was `teacherStudentId`).
  - Field `repeatType` (was `recurrenceType`).
  - `meetingMode`/`meetingLink`/`location` no longer accepted on schedules.
- **Sessions**
  - `classDate` → `date`.
  - Teacher/student/subject are nested under populated `enrollmentId` and are
    no longer top-level fields.
  - Confirmation/attendance state is in a nested `attendance` object
    (`teacherStatus`, `studentStatus`, `overallStatus`).
  - `teacher-confirm`/`student-confirm` accept an optional
    `{ status: "present" | "absent" }` body (default `present`).
  - Extra session creation requires `enrollmentId` (was `studentId` + `subjectId`).
- **Analytics**
  - Student analytics: `monthlyClasses`/`completedClassesCurrentCycle` renamed
    to `monthlyQuota`/`completedClassesCurrentCycle`; `remainingClasses` now
    derives from `monthlyQuota - completed`.

---

## 8. Backfill checklist (run against a backup before deploy)

1. `users`: drop the `subjects` array.
2. `subjects`: drop `isActive` (or keep the field — it is simply ignored).
3. Build `enrollments` from `teacherstudents`:
   - For every `subjects[]` entry create one enrollment
     (`teacherId`, `studentId`, `subjectId`).
   - Carry `monthlyClasses`, `status`, timestamps.
   - Set `extraMonthlyClasses = 0`, `joinedAt = createdAt`,
     `quotaEffectiveFrom = 1st of createdAt month`, `createdBy = teacherId`
     (approximation; correct via audit if available).
4. `schedules`: map `teacherStudentId → enrollmentId`; drop teacher/student/
   subject; set `timezone = "UTC"`, `createdBy` from audit or null; drop
   meeting fields. If a schedule belonged to a multi-subject relationship,
   duplicate it per subject enrollment.
5. `classsessions`: map teacher/student/subject to the enrollment via the
   schedule's enrollment; for extra sessions (no schedule) map using the legacy
   relationship + subject. Rename `classDate → date`; drop confirmation booleans,
   `sessionType`, reasons, `rescheduledTo`; build `meeting.provider = "none"`.
6. Build `attendances` 1:1 from each `classsession`:
   - `teacherStatus`/`studentStatus` from legacy `teacherConfirmed`/
     `studentConfirmed` booleans (`true → present`, `false → pending`).
   - `overallStatus` = legacy `status` (or derive via `deriveOverallStatus`).
7. Validate: unique `{teacherId, studentId, subjectId}` on enrollments and
   unique `{classSessionId}` on attendances must not violate before enabling
   the indexes.

---

## 9. Extensibility (not implemented yet)

- **Payments:** `enrollments.monthlyClasses`/`extraMonthlyClasses` +
  `quotaEffectiveFrom` give the quota anchor a billing cycle can reference.
- **Notifications:** `Notification` model + `NOTIFICATION_TYPES` already exist;
  `teacher_confirmed`/`student_confirmed`/`class_cancelled`/etc. are ready to
  be emitted by the attendance service.
- **Zoom integration:** `classsessions.meeting.provider` enum already includes
  `zoom`; add provider-specific sync jobs without schema changes.
- **Enrollment adjustments:** changing a quota mid-cycle is a single document
  update on `enrollments`; history can be tracked by a future adjustments
  collection keyed on `enrollmentId`.
