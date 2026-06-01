# AGNI PRIDE — Agent Memory

## Project Overview
Event/community dashboard for Agni College students. Express + Sequelize + MySQL. Passwords hashed with bcrypt (10 rounds). Sessions stored in MySQL via `express-session` + `connect-session-sequelize`.

## Key Files
| File | Purpose |
|---|---|
| `src/server.js` | All routes, session config, auth middleware |
| `src/models/User.js` | Sequelize `User` model |
| `src/models/Hackathon.js` | Sequelize `Hackathon` model |
| `src/models/index.js` | Model loader + associations |
| `src/config/db.js` | Sequelize + MySQL connection (telemetry removed) |
| `templates/login.html` | Login form with fetch-based JSON submission |
| `templates/register.html` | Registration form with fetch-based JSON submission |
| `templates/student/post.html` | Student dashboard showing hackathon listings |
| `templates/student/registrations.html` | Student my-registrations page with status updates + certificate upload |
| `templates/admin/index.html` | Admin panel (post hackathon + manage listings) |
| `templates/admin/dashboard.html` | Admin dashboard with charts and tables |
| `templates/admin/coordinators.html` | Admin coordinator management (add/list/delete) |
| `templates/coordinator/dashboard.html` | Coordinator dashboard page |
| `src/models/Registrations.js` | Sequelize `Registration` model |
| `src/middleware/auth.js` | `requireAuth`, `requireAdmin`, `requireCoordinator` middleware |
| `src/seed.js` | Seed script (creates admin user) |

## User Model (`src/models/User.js`)
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK, autoIncrement |
| `name` | STRING | NOT NULL, UNIQUE |
| `email` | STRING | NOT NULL, UNIQUE, isEmail validation |
| `department` | STRING | NOT NULL |
| `year` | INTEGER | NOT NULL, validate min:1 max:4 |
| `password` | STRING | NOT NULL, stored as bcrypt hash |
| `role` | ENUM('student','coordinator','admin') | defaults to 'student' |

## Hackathon Model (`src/models/Hackathon.js`)
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK, autoIncrement |
| `title` | STRING | NOT NULL |
| `institute` | STRING | NOT NULL |
| `description` | TEXT | nullable |
| `startDate` | DATEONLY | NOT NULL |
| `deadline` | DATEONLY | NOT NULL |
| `teamSize` | STRING | nullable |
| `posterImage` | STRING | nullable |
| `postedBy` | INTEGER | FK → User, NOT NULL |

## Registration Model (`src/models/Registrations.js`)
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK, autoIncrement |
| `hackathonId` | INTEGER | FK → Hackathon, NOT NULL |
| `userId` | INTEGER | FK → User, NOT NULL |
| `mentorName` | STRING | nullable |
| `status` | ENUM('registered','participated','shortlisted','winner') | default 'registered' |
| `certificate` | STRING | nullable, file path for winner/participated certs |

## Associations
- `Hackathon.belongsTo(User, { foreignKey: 'postedBy', as: 'admin' })`
- `User.hasMany(Hackathon, { foreignKey: 'postedBy', as: 'postedHackathons' })`
- `Registration.belongsTo(User, { foreignKey: 'userId', as: 'student' })`
- `Registration.belongsTo(Hackathon, { foreignKey: 'hackathonId', as: 'hackathon' })`
- `User.hasMany(Registration, { foreignKey: 'userId', as: 'registrations' })`
- `Hackathon.hasMany(Registration, { foreignKey: 'hackathonId', as: 'registrations' })`
- Models synced via `sequelize.sync({ alter: true })` (auto-adds missing columns)

## Auth Flow (Session-based)
- **Register** → `POST /api/register` → validates `@act.edu.in`, password >= 8, checks duplicate email, bcrypt hash, creates user → returns `{ redirect: '/login' }`
- **Login** → `POST /api/login` → finds user by email, bcrypt.compare, sets `req.session` with `{ userId, email, name, role, department }` → returns `{ redirect: ... }` (admins/coordinators → `/admin`, students → `/dashboard`)
- **Auth middleware** → `requireAuth()` in `src/middleware/auth.js` checks `req.session.userId`, redirects to `/login` if missing
- **Admin middleware** → `requireAdmin()` in `src/middleware/auth.js` checks `req.session.role === 'admin'`, returns 403 if not
- **Coordinator middleware** → `requireCoordinator()` in `src/middleware/auth.js` checks `req.session.role === 'coordinator' || 'admin'`, returns 403 if not
- **Logout** → `POST /api/logout` → `req.session.destroy()`, clears `connect.sid` cookie
- Session cookie: `httpOnly: true`, 8-hour maxAge, stored in `Sessions` MySQL table

## Routes
| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/` | No | Serves `login.html` |
| GET | `/login` | No | Serves `login.html` |
| GET | `/register` | No | Serves `register.html` |
| GET | `/dashboard` | `requireAuth` | Serves `student/post.html` |
| GET | `/registrations` | `requireAuth` | Serves `student/registrations.html` |
| GET | `/admin` | `requireAuth` + `requireAdmin` | Serves `admin/index.html` |
| GET | `/admin/dashboard` | `requireAuth` + `requireAdmin` | Serves `admin/dashboard.html` |
| GET | `/admin/coordinators` | `requireAuth` + `requireAdmin` | Serves `admin/coordinators.html` |
| GET | `/coordinator/dashboard` | `requireAuth` + `requireCoordinator` | Serves `coordinator/dashboard.html` |
| GET | `/assets/*` | No | Static files from `/templates/` |
| GET | `/uploads/*` | No | Static files from `public/uploads/` |
| POST | `/api/register` | No | Register handler |
| POST | `/api/login` | No | Login handler |
| POST | `/api/logout` | No | Logout handler |
| GET | `/api/hackathons` | `requireAuth` | List all hackathons |
| POST | `/api/hackathons` | `requireAuth` + `requireAdmin` | Create hackathon (multipart) |
| PUT | `/api/hackathons/:id` | `requireAuth` + `requireAdmin` | Update hackathon (multipart) |
| DELETE | `/api/hackathons/:id` | `requireAuth` + `requireAdmin` | Delete hackathon |
| GET | `/api/registrations` | `requireAuth` | List user's registrations (with hackathon data) |
| POST | `/api/registrations` | `requireAuth` | Register for a hackathon |
| PUT | `/api/registrations/:id` | `requireAuth` | Update registration status + upload certificate (multipart) |
| GET | `/api/admin/stats` | `requireAuth` + `requireAdmin` | Admin dashboard stats |
| POST | `/api/coordinators` | `requireAuth` + `requireAdmin` | Create coordinator (one per dept) |
| GET | `/api/coordinators` | `requireAuth` + `requireAdmin` | List all coordinators |
| DELETE | `/api/coordinators/:id` | `requireAuth` + `requireAdmin` | Remove a coordinator |
| GET | `/api/coordinator/registrations` | `requireAuth` + `requireCoordinator` | List dept registrations |

## Security
- Passwords hashed with bcrypt (10 rounds) — OK
- SQL injection protected by Sequelize ORM — OK
- `requireAuth` on `/dashboard` and `/admin` — OK
- `requireAdmin` on `/admin` and `POST /api/hackathons` — OK
- `httpOnly` session cookie — OK
- Telemetry lines removed from `db.js` — OK
- DB port configurable via `process.env.DB_PORT` (default 3306) — OK
- **Issues remaining:**
  - `.env` tracked in git (needs `git rm --cached .env`)
  - No rate limiting on login
  - CORS wide open (`cors()` with no options)
  - No HTTPS
  - `node_modules/` NOT in `.gitignore`

## What Was Fixed
- JWT → express-session with MySQL storage (was imported but never used)
- Added `requireAuth` middleware + protected `/post`
- Login now returns JSON + sets session (was plain redirect with no auth state)
- Registration form: added `action`, button text "Create Account", fixed client-side validation, year number input → select dropdown
- Login form: added fetch-based submission, error display
- Removed all `globalThis.fetch` telemetry lines (from `server.js` and `db.js`)
- `year` field: STRING → INTEGER with validation
- Added `role` field to User model
- Added `/api/logout` endpoint
- Added password length validation (min 8) server-side
- Fixed `User.js` import bug (`require('sequelize').DataTypes` → `require('sequelize')`)
- Created `Hackathon` model with associations
- Route `/post` → `/dashboard`, login redirect updated to match
- Added admin panel at `/admin` with hackathon post form + listing
- Created `requireAdmin` middleware
- Created `templates/student/` and `templates/admin/` directories
- Seeded admin user: `agnipadmin@act.edu.in` / `123456789`
- Fixed `requireAuth` function name typo and `res.status9` bug in auth middleware
- Added `/registrations` page route with navbar tabs on student pages
- Added `GET /api/registrations` and `POST /api/registrations` routes
- Added `PUT /api/registrations/:id` for student status updates + certificate upload
- Added `certificate` field to Registration model
- Created admin dashboard at `/admin/dashboard` with charts + stats tables
- Added `PUT` and `DELETE /api/hackathons/:id` for admin edit/delete
- Added admin navbar tabs (Post / Dashboard)
- Fixed date comparison bug (timezone-safe string compare instead of `new Date()`)
- Certificate upload mandatory for winner/participated status (frontend + backend validation)
- `sequelize.sync({ alter: true })` to auto-add new columns to existing tables
- Toast notifications on student pages for success feedback
- Better error messages on registration save failures
- Coordinator management system (middleware, CRUD routes, admin UI page)
- 3-tab admin navbar (Post / Dashboard / Coordinators) with dynamic active state
- Login redirect updated for coordinators (→ `/coordinator/dashboard`)
- `year` field validation changed to `min: 0` to allow coordinators via `year: 0`
- `DB_PORT` env var support added to `src/config/db.js` (defaults to 3306)

## What's Still Missing / TODO
- `?department=` filter on `GET /api/hackathons`
- Like/bookmark posts
- User profile page
- `.env` tracked in git
- Team registration (multi-member teams)
- Registration stats on admin dashboard
- Admin ability to update student registration statuses
- Coordinator dashboard UI (page exists but empty)
- Admin ability to update student registration statuses

## Planned Next Steps (Build Order)

### Phase 1 — Hackathon CRUD API ✅
- [x] `Hackathon` model + associations (DONE)
- [x] `POST /api/hackathons` — admin only (DONE)
- [x] `GET /api/hackathons` — public (logged-in) (DONE)
- [x] `PUT /api/hackathons/:id` — admin edit (DONE)
- [x] `DELETE /api/hackathons/:id` — admin delete (DONE)
- [ ] `?department=` filter

### Phase 2 — Role-based Middleware ✅
- [x] `requireAdmin` middleware (DONE)
- [ ] `requireRole('coordinator', 'admin')` — generalized role check

### Phase 3 — Student Dashboard ✅
- [x] Fetch + render hackathons in `student/post.html` (DONE)
- [x] Register button with modal + mentor name (DONE)
- [x] Image modal for poster (DONE)
- [x] Status dropdown + certificate upload in My Registrations (DONE)
- [x] Toast notification for success feedback (DONE)
- [ ] Department filter / search

### Phase 4 — Team Registration
- `Team` model: `name`, `hackathonId` (FK→Post), `leaderId` (FK→User)
- `TeamMember` model: `teamId`, `userId`, `role` (leader/member)
- `POST /api/teams` — create team
- `POST /api/teams/:id/join` — join team
- `POST /api/hackathons/:id/register` — register team for hackathon

### Phase 5 — Admin & Coordinator Management ✅
- [x] Coordinator CRUD routes (POST/GET/DELETE) (DONE)
- [x] requireCoordinator middleware (DONE)
- [x] Admin coordinator management UI (add/list/delete) (DONE)
- [x] Login redirect for coordinators (DONE)
- [ ] Coordinator dashboard UI (page stub exists)
- [ ] Registration stats on admin dashboard
- [ ] Admin ability to update student registration statuses

### Phase 6 — Route Splitting
- `src/routes/auth.routes.js`
- `src/routes/post.routes.js`
- `src/routes/team.routes.js`
- `src/routes/admin.routes.js`

## Conventions
- CommonJS modules (`require`/`module.exports`)
- Express 5
- Sequelize 6 with MySQL
- All logic in `src/server.js` (no route splitting yet)
- `templates/` directory serves HTML + static assets via `/assets`
- CSS uses `.-wrapper`, `.-card`, `.-form`, `.-footer`, `.btn-` naming
