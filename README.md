# Agni Pride

A web application for Agni College students to share hackathons, events, and updates.

## Current Version

**v1.0.0**

## Features

### Authentication
- User registration with college email validation (`@act.edu.in`)
- Login with email and password
- Password hashing with bcrypt

### Dashboard
- View hackathons and events feed
- Filter posts by category
- Search functionality
- Responsive design (mobile, tablet, desktop)

### Technical Stack
- **Backend:** Express.js, Node.js
- **Database:** MySQL with Sequelize ORM
- **Frontend:** HTML, CSS (vanilla)
- **Auth:** JWT (configured, to be implemented)

## Setup

```bash
npm install
```

Create a `.env` file based on your database configuration.

Run:
```bash
npm start
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Login page |
| `/login` | Login page |
| `/register` | Registration page |
| `/post` | Dashboard (hackathons/events) |
| `/api/register` | POST - Register new user |
| `/api/login` | POST - User login |

## TODO

- [ ] Implement JWT-based session management
- [ ] Add post creation functionality
- [ ] Add image upload support
- [ ] Like/bookmark posts
- [ ] User profile page
- [ ] Admin panel for event management

---

Built by **Raj G.** — Agni AI DS
