# Agni Pride — Hackathon Registration Portal

A web application for **Agni College** students to discover, register for, and track hackathons and events. Features role-based dashboards for students, coordinators, and admins.

## Version

**v1.0.0** — Production

## Features

### Authentication & Roles
- Registration with college email (`@act.edu.in`)
- Session-based auth (express-session + MySQL store)
- Three roles: **student**, **coordinator**, **admin**
- Login auto-redirects based on role

### Student
- Browse hackathon cards with poster images, dates, team size
- Register for hackathons (with optional mentor name)
- Upload certificates and update registration status
- View all registrations in "My Registrations" page
- Fullscreen poster image modal

### Admin
- Post / Edit / Delete hackathons (with poster upload)
- Analytics dashboard (charts: registrations by dept, year, role)
- Manage coordinators (one per department enforced)
- View recent users and hackathons tables

### Coordinator
- Department-filtered registration dashboard
- View all student registrations for their department's hackathons

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express.js, Node.js |
| Database | MySQL with Sequelize ORM |
| Auth | express-session + connect-session-sequelize |
| Frontend | HTML, CSS (vanilla), Chart.js |
| Uploads | Multer (posters + certificates) |

## Setup

```bash
git clone <repo-url>
cd Agni-Pride-
npm install
```

Create a `.env` file:

```
DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
SESSION_SECRET=your_secret
NODE_ENV=development
```

Run:

```bash
# Development
node src/server.js

# Seed admin user
node src/seed.js
```

Default admin: `agnipadmin@act.edu.in` / `123456789`

## Project Structure

```
├── src/
│   ├── server.js          # All routes, session config, middleware
│   ├── config/db.js       # Sequelize + MySQL connection
│   ├── models/            # Sequelize models (User, Hackathon, Registration)
│   ├── middleware/auth.js  # Auth & role middleware
│   ├── seed.js            # Admin seeder
│   └── public/uploads/    # Poster & certificate uploads
├── templates/
│   ├── login.html
│   ├── register.html
│   ├── student/           # post.html, registrations.html
│   ├── admin/             # index.html, dashboard.html, coordinators.html
│   └── coordinator/       # dashboard.html
└── README.md
```

## Routes

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/login` | Public | Login page |
| GET | `/register` | Public | Registration page |
| GET | `/dashboard` | Student | Hackathon listing |
| GET | `/registrations` | Student | My registrations |
| GET | `/admin` | Admin | Post/edit/delete hackathons |
| GET | `/admin/dashboard` | Admin | Analytics dashboard |
| GET | `/admin/coordinators` | Admin | Manage coordinators |
| GET | `/coordinator/dashboard` | Coordinator | Dept registrations |
| POST | `/api/register` | Public | Register user |
| POST | `/api/login` | Public | Login |
| POST | `/api/logout` | Auth | Logout |
| POST | `/api/hackathons` | Admin | Create hackathon |
| PUT | `/api/hackathons/:id` | Admin | Update hackathon |
| DELETE | `/api/hackathons/:id` | Admin | Delete hackathon |
| POST | `/api/registrations` | Student | Register for hackathon |
| PUT | `/api/registrations/:id` | Student | Update status + cert |
| POST | `/api/coordinators` | Admin | Add coordinator |
| DELETE | `/api/coordinators/:id` | Admin | Remove coordinator |
| GET | `/api/me` | Auth | Current user session |

## Deployed

- **Backend:** Render
- **Database:** Aiven MySQL
- **Uploads:** Local filesystem (public/uploads/)

---

Built by **Raj G.** — Agni AI & DS
