# FleetSphere

FleetSphere is a MERN fleet, driver, trip, maintenance and expense management application with organization and branch-aware role-based access control.

## Features

- HTTP-only JWT authentication, bcrypt password hashing, and five roles: `SUPER_ADMIN`, `FLEET_MANAGER`, `BRANCH_MANAGER`, `DRIVER`, and `FINANCE_OFFICER`.
- Tenant-scoped REST APIs for organizations, branches, users, vehicles, driver profiles, assignments, routes, trips, fuel, maintenance, incidents, documents, expenses, notifications and audit logs.
- Strict branch isolation for branch managers and personal record isolation for drivers.
- Vehicle/driver assignment history, trip overlap prevention, validated trip status transitions, maintenance/vehicle status integration, calculated fuel and maintenance totals, upload validation, and dashboard analytics.
- Responsive React dashboard with protected routes, role-specific navigation, forms, tables, pagination, search and notifications.

## Quick start

1. Ensure MongoDB is running locally.
2. Copy environment templates:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Install and start:

   ```bash
   npm run install:all
   npm run seed
   npm run dev
   ```

The API runs at `http://localhost:5001`, the frontend at `http://localhost:5173`, and the health check is at `GET /api/health`.

## Seed credentials

All seeded accounts use `FleetSphere@123` by default. Override this for a local seed with `SEED_PASSWORD='your-password' npm run seed`.

| Role | Email |
| --- | --- |
| Super Admin | aarav.admin@fleetsphere.test |
| Fleet Manager | meera.fleet@fleetsphere.test |
| Hyderabad Branch Manager | ishaan.hyderabad@fleetsphere.test |
| Bengaluru Branch Manager | kavya.bengaluru@fleetsphere.test |
| Finance Officer | farah.finance@fleetsphere.test |
| Driver | ravi.kumar@fleetsphere.test |

## API summary

`/api/auth`, `/api/organizations`, `/api/branches`, `/api/users`, `/api/vehicles`, `/api/drivers`, `/api/assignments`, `/api/routes`, `/api/trips`, `/api/fuel`, `/api/maintenance`, `/api/incidents`, `/api/documents`, `/api/expenses`, `/api/notifications`, `/api/audit-logs`, `/api/dashboard`.

Collection endpoints accept `page`, `limit`, `search`, relevant entity filters, and `startDate`/`endDate`. Responses consistently contain `success`, `data`, and pagination metadata where applicable.

## Key business rules

- Tenant and branch values are derived from the authenticated account, never trusted from request input for non-super-admins.
- A vehicle/driver may have only one active assignment, and vehicles in maintenance or inactive state cannot be assigned.
- Trip scheduling rejects overlapping active trips for both the driver and vehicle; lifecycle transitions are enforced server-side.
- Drivers are restricted to their own trips and financial/incident records. Finance users cannot manage fleet configuration.
- File uploads are stored locally in `backend/uploads`, limited to 5 MB, and accept JPG, PNG, PDF, DOC and DOCX files.

## Structure

```text
backend/    Express API, Mongoose models, middleware, services and seed data
frontend/   Vite + React application with Zustand state and React Router
```

For production, set a strong `JWT_SECRET`, secure MongoDB credentials, `NODE_ENV=production`, and an HTTPS deployment before enabling secure cookies.
