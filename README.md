# CampusFix Lite

Smart Complaint & Service Request Portal with Student, Staff, and Admin workflows.

## Stack

- Frontend: React (Vite), Tailwind CSS, React Router, Axios, Recharts, Framer Motion
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, multer, Socket.IO

## Roles

- `student`: submit complaints, track status, comment on own complaints
- `staff`: view assigned complaints, move `ASSIGNED -> IN_PROGRESS -> RESOLVED`, add notes/proof
- `admin`: manage users/staff, assign complaints, close resolved complaints

## Complaint Lifecycle

`OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`

## Setup

1. Install deps:
```bash
npm install
npm install --prefix client
npm install --prefix server
```

2. Env files:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Run:
```bash
npm run dev
```

4. Run checks:
```bash
npm run test --prefix server
npm run lint --prefix client
npm run build --prefix client
```

## API

Base URLs supported:
- `http://localhost:5000/api`
- `http://localhost:5000/api/v1`

Swagger:
- `http://localhost:5000/api/v1/docs`

Core routes:
- Auth: `POST /auth/register`, `POST /auth/login`
- Complaints: `POST /complaints`, `GET /complaints`, `GET /complaints/:id`, `PUT /complaints/:id/status`, `PUT /complaints/:id/assign`, `DELETE /complaints/:id`
- Comments: `POST /comments`, `GET /comments/:complaintId`
- Notifications: `GET /notifications`, `PUT /notifications/read`
- Admin: `GET /admin/dashboard`, `GET /admin/users`, `POST /admin/staff`, `PUT /admin/users/:id/role`

## Frontend Pages

- Student: Login, Dashboard, Submit Complaint, My Complaints, Complaint Detail, Notifications
- Staff: Dashboard, Assigned Complaints, Complaint Detail, Notifications
- Admin: Dashboard, Complaint Management, User Management, Analytics, Notifications
