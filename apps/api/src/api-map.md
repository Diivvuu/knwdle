# 🧭 Knwdle Platform – Unified API Map  
**Version:** 1.0.0  
**Base URL:** `http://localhost:4000/api`  
**Auth:** Bearer JWT  
**Format:** JSON (unless noted otherwise)

---

## 🔐 Authentication & Session

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | POST | `/auth/signup` | Create new user account |
| ✅ | GET | `/auth/verify` | Verify email via token and create session |
| ✅ | POST | `/auth/login` | Login with email + password |
| ✅ | POST | `/auth/request-otp` | Request OTP via email |
| ✅ | POST | `/auth/verify-otp` | Verify OTP and login |
| ✅ | POST | `/auth/refresh` | Rotate refresh token |
| ✅ | POST | `/auth/logout` | Logout and clear refresh cookie |
| ✅ | GET | `/auth/me` | Current user + memberships |
| ✅ | PATCH | `/auth/me/preferences` | Update theme, preferred org |
| ✅ | GET | `/auth/invites/{token}/preview` | Preview invite before accepting |

---

## ✉️ Invites

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | POST | `/orgs/{id}/invites` | Create invite |
| ✅ | GET | `/orgs/{id}/invites` | List invites |
| ✅ | DELETE | `/orgs/{orgId}/invites/{inviteId}` | Delete invite |
| ✅ | POST | `/invites/{token}/accept` | Accept via token |
| ✅ | POST | `/invites/join-code` | Accept via join code |
| ✅ | POST | `/orgs/{id}/invites/bulk` | Bulk create invites |
| ✅ | GET | `/orgs/{id}/invites/bulk/{batchId}/stream` | SSE stream for bulk progress |
| ✅ | GET | `/orgs/{id}/invites/bulk/{batchId}/status` | Bulk status poll |

---

## 🏢 Organisations

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | POST | `/dashboard/orgs` | Create organisation |
| ✅ | GET | `/dashboard/orgs` | List orgs for current user |
| ✅ | GET | `/dashboard/orgs/{id}` | Org + extended info |
| ✅ | PATCH | `/dashboard/orgs/{id}` | Update settings |
| ✅ | DELETE | `/dashboard/orgs/{id}` | Delete organisation |
| ✅ | GET | `/orgs/{id}` | Org dashboard hero |
| ✅ | GET | `/orgs/{id}/summary` | Lightweight org summary |
| ✅ | GET | `/orgs/{id}/activity` | Audit log |
| ✅ | GET | `/orgs/{id}/dashboard-config` | Dashboard widget config |
| ⏳ | PATCH | `/orgs/{id}/settings` | Org-wide policy updates |

---

## 🧩 Org & Unit Types

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/org-types` | List organisation types |
| ✅ | GET | `/org-types/{type}/schema` | Type schema |
| ✅ | GET | `/org-types/{type}/structure` | Default structure |
| ✅ | GET | `/orgs/{orgId}/org-unit-types` | Allowed unit types |
| ✅ | GET | `/orgs/{orgId}/org-unit-types/{type}/schema` | Unit-type schema |
| ✅ | GET | `/orgs/{orgId}/org-unit-types/{type}/features` | Enabled feature set |
| ✅ | GET | `/orgs/{orgId}/org-unit-types/allowed` | Allowed children types |

---

## 🧾 Roles & Permissions

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/orgs/{id}/permissions` | Permission catalog |
| ✅ | GET | `/orgs/{id}/roles` | List roles |
| ✅ | POST | `/orgs/{id}/roles` | Create new role |
| ✅ | PATCH | `/orgs/{id}/roles/{roleId}` | Update permissions |
| ✅ | DELETE | `/orgs/{id}/roles/{roleId}` | Delete role |
| ✅ | PATCH | `/orgs/{id}/members/role` | Assign/unassign member role |

---

## 🗂 Uploads & Files

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | POST | `/uploads/presign` | Presign upload (PUT/POST) |
| ✅ | POST | `/uploads/presign-get` | Presign short-lived GET |
| ⏳ | GET | `/orgs/{orgId}/files` | List uploaded files |
| ⏳ | DELETE | `/orgs/{orgId}/files/{fileId}` | Delete file |

---

## 👥 Members

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/orgs/{orgId}/members` | List members |
| ✅ | POST | `/orgs/{orgId}/members` | Add member |
| ✅ | GET | `/orgs/{orgId}/members/{memberId}` | Get member details |
| ✅ | PATCH | `/orgs/{orgId}/members/{memberId}` | Update member |
| ✅ | DELETE | `/orgs/{orgId}/members/{memberId}` | Remove |
| ✅ | GET | `/orgs/{id}/members/peek` | Recent members peek |
| ⏳ | POST | `/orgs/{orgId}/members/bulk` | Bulk upsert via CSV |

---

## 🏗 Org Units

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/orgs/{orgId}/units` | List units |
| ✅ | POST | `/orgs/{orgId}/units` | Create unit |
| ✅ | GET | `/orgs/{orgId}/units/tree` | Full hierarchy |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}` | Unit details |
| ✅ | PATCH | `/orgs/{orgId}/units/{unitId}` | Update unit |
| ✅ | DELETE | `/orgs/{orgId}/units/{unitId}` | Delete |
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/members` | Members in unit |
| ⏳ | PATCH | `/orgs/{orgId}/units/{unitId}/members` | Add/remove members |

---

## 📊 Org Dashboard (Admin)

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/orgs/{id}/units/glance` | Units glance summary |
| ✅ | GET | `/orgs/{id}/announcements/peek` | Pinned announcements |
| ✅ | GET | `/orgs/{id}/attendance/snapshot` | Attendance snapshot |
| ✅ | GET | `/orgs/{id}/fees/snapshot` | Fee snapshot |
| ⏳ | GET | `/orgs/{id}/results/snapshot` | Result summary |

---

## 🧠 Org Unit Dashboard (Teacher / Unit Admin)

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/config` | Config |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/hero` | Hero stats |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/summary` | Summary |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/timetable-today` | Today’s timetable |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/announcements-peek` | Announcements feed |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/assignments-due` | Upcoming assignments |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/tests-due` | Upcoming tests |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/attendance-summary` | Attendance stats |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/results-summary` | Results summary |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/dashboard/fees-snapshot` | Fee overview |

---

## 👨‍👩‍👧 Connect Dashboard (Student / Parent)

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/orgs/{id}/connect-dashboard/hero` | Student/parent hero |
| ✅ | GET | `/orgs/{id}/connect-dashboard/summary` | Student summary (attendance, fees, progress) |
| ✅ | GET | `/orgs/{id}/connect-dashboard/timetable-today` | Timetable |
| ✅ | GET | `/orgs/{id}/connect-dashboard/announcements-peek` | Announcements |
| ✅ | GET | `/orgs/{id}/connect-dashboard/config` | Widget config |

---

## 🕒 Attendance

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/attendance/sessions` | List sessions |
| ✅ | POST | `/orgs/{orgId}/units/{unitId}/attendance/sessions` | Create session |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/attendance/sessions/{sessionId}` | Session details |
| ✅ | POST | `/orgs/{orgId}/units/{unitId}/attendance/sessions/{sessionId}/records` | Upsert records |
| ✅ | GET | `/orgs/{orgId}/units/{unitId}/attendance/self` | Student self attendance |
| ✅ | GET | `/orgs/{orgId}/attendance/summary` | Attendance analytics |

---

## 🧮 Assignments

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/assignments` | List assignments |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/assignments` | Create |
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/assignments/{id}` | Details |
| ⏳ | PATCH | `/orgs/{orgId}/units/{unitId}/assignments/{id}` | Update |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/assignments/{id}/submissions` | Submit work |
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/assignments/{id}/submissions` | List submissions |
| ⏳ | PATCH | `/orgs/{orgId}/units/{unitId}/assignments/{id}/grade` | Grade |

---

## 🧠 Tests & Results

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/tests` | List tests |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/tests` | Create test |
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/tests/{id}` | Test details |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/tests/{id}/results` | Record results |
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/results/self` | Student results |

---

## 🧾 Fees & Payments

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/fees` | List invoices |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/fees` | Create invoice |
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/fees/{id}` | Invoice details |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/fees/{id}/payments` | Record payment |

---

## 📅 Timetable & Calendar

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/timetable` | Unit timetable |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/timetable` | Add timetable entry |
| ⏳ | GET | `/orgs/{orgId}/calendar` | Org calendar view |
| ⏳ | POST | `/orgs/{orgId}/calendar/events` | Add calendar event |

---

## 📢 Announcements

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/announcements` | List |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/announcements` | Create |
| ⏳ | PATCH | `/orgs/{orgId}/units/{unitId}/announcements/{id}` | Update |
| ⏳ | DELETE | `/orgs/{orgId}/units/{unitId}/announcements/{id}` | Delete |

---

## 📝 Notes / Content

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | GET | `/orgs/{orgId}/notes` | List notes |
| ⏳ | POST | `/orgs/{orgId}/notes` | Create note |
| ⏳ | PATCH | `/orgs/{orgId}/notes/{noteId}` | Update |
| ⏳ | DELETE | `/orgs/{orgId}/notes/{noteId}` | Delete |

---

## 🏆 Achievements

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/achievements` | List achievements |
| ⏳ | POST | `/orgs/{orgId}/units/{unitId}/achievements` | Add new |
| ⏳ | GET | `/orgs/{orgId}/units/{unitId}/achievements/{id}` | Details |

---

## 💬 Messaging (lightweight)

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | POST | `/orgs/{orgId}/messages` | Send message |
| ⏳ | GET | `/orgs/{orgId}/messages` | Inbox/sent messages |
| ⏳ | PATCH | `/orgs/{orgId}/messages/{id}/read` | Mark read |

---

## 📈 Analytics & Audit

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ⏳ | POST | `/orgs/{orgId}/analytics/rebuild` | Trigger analytics rebuild |
| ⏳ | GET | `/orgs/{orgId}/analytics/attendance` | Attendance trends |
| ⏳ | GET | `/orgs/{orgId}/audit` | List audit logs |
| ⏳ | GET | `/orgs/{orgId}/audit/{id}` | Log details |

---

## 🔔 Notifications

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/notifications` | List notifications |
| ✅ | POST | `/notifications/{id}/read` | Mark one read |
| ⏳ | POST | `/notifications/read-all` | Mark all read |

---

## ⚙️ Meta & Health

| Status | Method | Path | Description |
|:------:|:------:|------|-------------|
| ✅ | GET | `/health` | Service health |
| ✅ | GET | `/version` | Build info |

---

### ✅ Legend
- ✅ = Implemented  
- ⏳ = Planned / Schema-ready  

---

### 📘 Coverage Summary

| Domain | Coverage |
|--------|-----------|
| Auth / Session | ✅ Complete |
| Invites | ✅ Complete |
| Orgs / Units | ✅ Core done |
| Roles / Permissions | ✅ Done |
| Attendance | ✅ Core done |
| Dashboards (Org / Unit / Connect) | ✅ Done |
| Notifications | ✅ Core done |
| Uploads | ✅ Done |
| Assignments / Tests / Fees / Timetable / Notes | ⏳ Next phase |
| Analytics / Messaging / Audit / Achievements | ⏳ Later phase |

---

**Maintained by:** Knwdle Backend Core  
**Last updated:** `2025-11-10`  
**File:** `/apps/api/docs/api-map.md`