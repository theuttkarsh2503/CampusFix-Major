# CampusFix Lite Architecture Report

This report describes the existing application before major-project enhancements. It is intentionally additive and does not change runtime behavior.

```yaml
Frontend:
  framework: React 19 with Vite 7
  routing: React Router DOM 7
  styling: Tailwind CSS with shared CSS in src/index.css
  state_management: React Context (Auth, Complaints, Notifications)
  data_visualization: Recharts
  motion: Framer Motion
  http: Axios
  realtime: socket.io-client

Backend:
  framework: Node.js with Express 5
  structure: routes -> controllers -> services/models
  middleware: authentication, roles, validation, uploads, errors, rate limiting
  realtime: Socket.IO
  documentation: Swagger/OpenAPI at /api/v1/docs

Database:
  engine: MongoDB
  odm: Mongoose 9
  default_database: campusfix_lite
  collections: users, complaints, comments, notifications
  migration_policy: schemas currently support legacy value normalization; no destructive migrations are used

Authentication:
  mechanism: JWT bearer tokens
  password_storage: bcryptjs hashes
  bootstrap: profile lookup restores the authenticated user
  registration: configurable student/staff/admin self-registration rules

Roles:
  student: create and track own complaints, comment on own complaints
  staff: view assigned complaints, update assigned complaint workflow, add notes/proof
  admin: view all complaints, assign staff, close resolved complaints, manage users and staff

Complaint workflow:
  states: OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED
  enforcement: server transition middleware and workflow service, mirrored by client actions
  attachments: up to 3 image/PDF files, 5 MB per file
  identifiers: human-readable CFX ticket IDs
  realtime_events: complaint updates, comments, and notifications through Socket.IO

Important routes:
  health: /api/health, /api/v1/health
  auth: /api/auth/*, /api/v1/auth/*
  complaints: /api/complaints/*, /api/v1/complaints/*
  comments: /api/comments/*, /api/v1/comments/*
  notifications: /api/notifications/*, /api/v1/notifications/*
  dashboards: /api/dashboard/*, /api/v1/dashboard/*
  administration: /api/admin/*, /api/v1/admin/*
  documentation: /api/v1/docs

Important components:
  shells: DashboardShell, TopNavbar, Sidebar
  reusable_ui: Button, Card, Input, Loader, ProtectedRoute, StatusBadge
  forms: LoginForm, SignupForm, ComplaintForm
  dashboards: StatsCard, complaint tables, monthly/category charts
  providers: AuthProvider, ComplaintProvider, NotificationProvider

Important models:
  User: identity, role, password hash, safe serialization
  Complaint: ticket, creator, assignment, category, priority, status, attachments, lifecycle dates
  Comment: complaint discussion and author reference
  Notification: user-targeted notification with read state

Current limitations:
  - Dependencies are not installed in the current checkout, so baseline checks cannot run until npm install is completed.
  - Automated coverage is currently concentrated on complaint workflow rules and model normalization.
  - server/utils/overdue.js appears to be legacy/inactive code and uses status names outside the current workflow.
  - Client App.css and client/README.md still contain Vite starter material; the active UI uses index.css and Tailwind.
  - client/index.html still uses the generic Vite title.
  - Some backend role queries retain mixed-case compatibility logic while the canonical role constants are lowercase.
```

## Safety checkpoint

The working tree was clean before this report was added. A Git branch checkpoint could not be created because this environment denies writes to `.git`; the existing `main` commit remains unchanged and is the recovery point.

