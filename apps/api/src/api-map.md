Auth & Session (shared)

POST /api/auth/email/login — email/pass login.

POST /api/auth/email/register — create account.

POST /api/auth/refresh — refresh token.

POST /api/auth/logout

POST /api/auth/password/forgot

POST /api/auth/password/reset

GET /api/auth/providers — list SSO providers.

POST /api/auth/oauth/:provider/callback — SSO finish.

GET /api/auth/me — current user, memberships, permissions, profile.

PATCH /api/auth/me — update profile (name, avatar).

PATCH /api/auth/me/preferences — theme, preferred org, preferred start page.

Global Search

GET /api/search?q=&types=members,classes,assignments,units,...&orgId=&limit=&cursor=

Orgs (list/join/create/switch)

GET /api/orgs?limit=&cursor= — orgs I’m part of.

POST /api/orgs — create org.

GET /api/orgs/:orgId — org basic.

PATCH /api/orgs/:orgId — name, logo, locale, academic year, timezone.

DELETE /api/orgs/:orgId — (owner-only).

GET /api/orgs/:orgId/summary — KPIs (members, units, attendance %, etc.).

GET /api/orgs/:orgId/settings

PATCH /api/orgs/:orgId/settings

Members (people directory)

GET /api/orgs/:orgId/members?role=&unitId=&q=&status=active|invited&limit=&cursor=

GET /api/orgs/:orgId/members/:memberId

PATCH /api/orgs/:orgId/members/:memberId — update profile/meta, primary unit.

PATCH /api/orgs/:orgId/members/:memberId/status — activate/deactivate/suspend.

PATCH /api/orgs/:orgId/members/:memberId/roles — set parentRole or assign custom roles (array).

PATCH /api/orgs/:orgId/members/:memberId/units — add/remove unit memberships.

DELETE /api/orgs/:orgId/members/:memberId — remove from org.

Members: bulk & CSV

POST /api/orgs/:orgId/members/bulk — upsert, { members:[{email,name,role,unitIds[]...}], options:{sendEmail,dryRun} }

GET /api/orgs/:orgId/members/export.csv?unitId=&role=

POST /api/orgs/:orgId/members/import.csv — multipart CSV upload → returns parsed preview id.

POST /api/orgs/:orgId/members/import/:previewId/commit — commit import.

Roles & Permissions

GET /api/orgs/:orgId/permissions — catalog of permission codes.

GET /api/orgs/:orgId/roles?limit=&cursor=&q=

POST /api/orgs/:orgId/roles — {name,key,parentRole,scope,permissions[]}

GET /api/orgs/:orgId/roles/:roleId

PATCH /api/orgs/:orgId/roles/:roleId — update name/permissions.

DELETE /api/orgs/:orgId/roles/:roleId

GET /api/orgs/:orgId/roles/assignments?memberId=&roleId= — who has which role.

POST /api/orgs/:orgId/roles/:roleId/assign — { memberIds:[] }

POST /api/orgs/:orgId/roles/:roleId/unassign — { memberIds:[] }

Invites (single + bulk + SSE)

GET /api/orgs/:orgId/invites?status=&role=&unitId=&q=&sortKey=&sortDir=&limit=&cursor=

POST /api/orgs/:orgId/invites — single invite {email, role|roleId, unitId, meta, options:{expiresInDays,sendEmail}}

DELETE /api/orgs/:orgId/invites/:inviteId

POST /api/invites/join-code — { code } accept invite by code.

POST /api/invites/token — { token } accept invite by token.

POST /api/orgs/:orgId/invites/bulk — (You already have) { invites:[{email,role|roleId,unitId,meta}], options:{expiresInDays,sendEmail,dryRun} }

GET /api/orgs/:orgId/invites/bulk/:batchId/status — poll

GET /api/orgs/:orgId/invites/bulk/:batchId/stream — SSE progress (done/error/progress)

Units (org structure: departments/classes-groups-not classrooms)

GET /api/orgs/:orgId/units?parentId=&type=org|dept|grade|section&limit=&cursor=

POST /api/orgs/:orgId/units — {name, type, parentId?, code?, meta}

GET /api/orgs/:orgId/units/:unitId

PATCH /api/orgs/:orgId/units/:unitId — rename, reparent, code, meta.

DELETE /api/orgs/:orgId/units/:unitId

GET /api/orgs/:orgId/units/:unitId/members?role=&limit=&cursor=

PATCH /api/orgs/:orgId/units/:unitId/members — add/remove members.

GET /api/orgs/:orgId/units/tree — prebuilt hierarchy tree.

GET /api/orgs/:orgId/units/export.csv

POST /api/orgs/:orgId/units/import.csv + POST /commit (same pattern as members).

Classes (teaching entities)

(If your “Classes” are separate from Units; if not, swap “class” with “unit” where appropriate)

GET /api/orgs/:orgId/classes?unitId=&teacherId=&q=&limit=&cursor=

POST /api/orgs/:orgId/classes — { name, code, unitId, teacherIds[], schedule:{days,times,room}, meta }

GET /api/orgs/:orgId/classes/:classId

PATCH /api/orgs/:orgId/classes/:classId

DELETE /api/orgs/:orgId/classes/:classId

GET /api/orgs/:orgId/classes/:classId/roster?role=student|staff&limit=&cursor=

PATCH /api/orgs/:orgId/classes/:classId/roster — add/remove members.

GET /api/orgs/:orgId/classes/:classId/schedule — occurrences for date range.

PATCH /api/orgs/:orgId/classes/:classId/schedule — update schedule.

GET /api/orgs/:orgId/classes/export.csv?unitId=

POST /api/orgs/:orgId/classes/import.csv + commit.

Attendance

GET /api/orgs/:orgId/attendance/sessions?classId=&unitId=&date=&from=&to=&limit=&cursor=

POST /api/orgs/:orgId/attendance/sessions — { classId, date, period?, createdBy }

GET /api/orgs/:orgId/attendance/sessions/:sessionId

PATCH /api/orgs/:orgId/attendance/sessions/:sessionId — close/reopen, notes.

DELETE /api/orgs/:orgId/attendance/sessions/:sessionId

GET /api/orgs/:orgId/attendance/sessions/:sessionId/marks — list marks.

PATCH /api/orgs/:orgId/attendance/sessions/:sessionId/marks — bulk set { marks:[{memberId, status:present|absent|late|excused, note?}] }

POST /api/orgs/:orgId/attendance/quick-take — create session + marks in one call.

GET /api/orgs/:orgId/attendance/summary?scope=org|unit|class&from=&to=&unitId=&classId= — KPIs (% present, streaks).

GET /api/orgs/:orgId/attendance/export.csv?from=&to=&unitId=&classId=

Attendance: SSE jobs

POST /api/orgs/:orgId/attendance/rebuild-analytics — triggers re-aggregation.

GET /api/orgs/:orgId/attendance/rebuild-analytics/status — poll.

GET /api/orgs/:orgId/attendance/rebuild-analytics/stream — SSE progress.

Assignments

GET /api/orgs/:orgId/classes/:classId/assignments?status=draft|published&dueFrom=&dueTo=&q=&limit=&cursor=

POST /api/orgs/:orgId/classes/:classId/assignments — { title, description, dueAt, maxPoints, attachments[], visibility, rubric?, meta }

GET /api/orgs/:orgId/classes/:classId/assignments/:assignmentId

PATCH /api/orgs/:orgId/classes/:classId/assignments/:assignmentId

DELETE /api/orgs/:orgId/classes/:classId/assignments/:assignmentId

PATCH /api/orgs/:orgId/classes/:classId/assignments/:assignmentId/publish — publish/unpublish.

GET /api/orgs/:orgId/classes/:classId/assignments/:assignmentId/submissions?status=&studentId=&limit=&cursor=

Submissions & Grading

POST /api/orgs/:orgId/classes/:classId/assignments/:assignmentId/submissions — student submit (files[]/links), idempotent by student.

GET /api/orgs/:orgId/classes/:classId/assignments/:assignmentId/submissions/:submissionId

PATCH /api/orgs/:orgId/classes/:classId/assignments/:assignmentId/submissions/:submissionId — resubmit/add files (if allowed).

PATCH /api/orgs/:orgId/classes/:classId/assignments/:assignmentId/submissions/:submissionId/grade — { score, feedback, rubricScores? }

PATCH /api/orgs/:orgId/classes/:classId/assignments/:assignmentId/grades/bulk — grade multiple.

GET /api/orgs/:orgId/classes/:classId/grades/export.csv?assignmentId=&studentId=

Assignments: bulk & SSE

POST /api/orgs/:orgId/classes/:classId/assignments/bulk — create many (draft), returns batchId.

GET /api/orgs/:orgId/classes/:classId/assignments/bulk/:batchId/stream — SSE progress.

Notes (teacher notes, student notes, org notes)

GET /api/orgs/:orgId/notes?targetType=student|class|unit|org&targetId=&q=&limit=&cursor=

POST /api/orgs/:orgId/notes — { targetType, targetId, text, tags[], visibility:private|team }

GET /api/orgs/:orgId/notes/:noteId

PATCH /api/orgs/:orgId/notes/:noteId

DELETE /api/orgs/:orgId/notes/:noteId

Announcements

GET /api/orgs/:orgId/announcements?scope=org|unit|class&unitId=&classId=&limit=&cursor=

POST /api/orgs/:orgId/announcements — { title, body, scope, targets:[unitId|classId], attachments[], publishAt? }

GET /api/orgs/:orgId/announcements/:announcementId

PATCH /api/orgs/:orgId/announcements/:announcementId

DELETE /api/orgs/:orgId/announcements/:announcementId

PATCH /api/orgs/:orgId/announcements/:announcementId/publish — publish/unpublish.

GET /api/orgs/:orgId/announcements/feed?after= — compact feed for dashboard.

Messaging (optional lightweight, not a full chat)

POST /api/orgs/:orgId/messages — { to:memberIds[], subject, body, attachments[] } (email or in-app).

GET /api/orgs/:orgId/messages?inbox|sent&limit=&cursor=

GET /api/orgs/:orgId/messages/:messageId

PATCH /api/orgs/:orgId/messages/:messageId/read — mark read.

Files / Resources (common attachments)

POST /api/orgs/:orgId/files — multipart upload; returns fileId, url.

GET /api/orgs/:orgId/files?ownerId=&classId=&assignmentId=&limit=&cursor=

GET /api/orgs/:orgId/files/:fileId — metadata.

DELETE /api/orgs/:orgId/files/:fileId

Calendars & Schedule

GET /api/orgs/:orgId/calendar?from=&to=&unitId=&classId=&memberId= — merged events (classes, exams, org events).

POST /api/orgs/:orgId/calendar/events — org event.

GET /api/orgs/:orgId/calendar/events/:eventId

PATCH /api/orgs/:orgId/calendar/events/:eventId

DELETE /api/orgs/:orgId/calendar/events/:eventId

GET /api/orgs/:orgId/calendar/export.ics?unitId=&classId=&memberId=

Dashboard (cards-ready, cheap to render)

GET /api/orgs/:orgId/dashboard/teach — teacher “My Day”: upcoming classes, pending assignments to grade, attendance to take, recent announcements.

GET /api/orgs/:orgId/dashboard/admin — org health: members count, pending invites, attendance trend (7d), units snapshot, quick notices.

GET /api/orgs/:orgId/dashboard/alerts — exceptions: expiring invites, missing rosters, overdue grading.

Analytics (heavy; via async jobs + SSE)

POST /api/orgs/:orgId/analytics/rebuild?scope=org|unit|class&from=&to= — trigger (role-gated).

GET /api/orgs/:orgId/analytics/rebuild/status?jobId=

GET /api/orgs/:orgId/analytics/rebuild/stream?jobId= — SSE

GET /api/orgs/:orgId/analytics/attendance?from=&to=&groupBy=day|unit|class

GET /api/orgs/:orgId/analytics/assignment-completion?from=&to=&classId=

GET /api/orgs/:orgId/analytics/grade-distribution?classId=&assignmentId=

Settings (org-level)

GET /api/orgs/:orgId/settings/branding — name, logo, colors.

PATCH /api/orgs/:orgId/settings/branding

GET /api/orgs/:orgId/settings/policies — attendance grace time, late rules, grading scales.

PATCH /api/orgs/:orgId/settings/policies

GET /api/orgs/:orgId/settings/notifications

PATCH /api/orgs/:orgId/settings/notifications

GET /api/orgs/:orgId/settings/email — SMTP/provider status.

PATCH /api/orgs/:orgId/settings/email — update provider.

POST /api/orgs/:orgId/settings/email/test — send test (returns result or streams progress if bulk test).

Notifications (in-app)

GET /api/notifications?limit=&cursor=

PATCH /api/notifications/:id/read

PATCH /api/notifications/read-all

Audit Log

GET /api/orgs/:orgId/audit?actorId=&action=&from=&to=&limit=&cursor=

GET /api/orgs/:orgId/audit/:logId

Feature Flags (optional)

GET /api/orgs/:orgId/flags

PATCH /api/orgs/:orgId/flags — toggle features (e.g., enable grading rubrics).

Health & Meta

GET /api/health — service health.

GET /api/version — git sha, build time.
