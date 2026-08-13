# Orbit — Internal Workspace Platform

> A lightweight internal work management platform for freelancers and small teams (2–5 people).

**Orbit** lets you organize projects, break work into tasks and subtasks, assign responsibilities, track progress, monitor deadlines, identify delayed or at-risk work, and consistently complete projects.

---

## ✨ Features

- **6-Phase workflow**: Onboarding → Team → Projects → Tasks → Health Rules → Dashboard
- **Workspace types**: Solo Freelancer or Team (2–5 members)
- **Task board**: Kanban-style board with Not Started / In Progress / In Review / Completed
- **Task health detection**: Automatic On Track / At Risk / Delayed classification
- **Progress tracking**: Auto-calculated from subtasks, or manual slider
- **Team management**: Invite members by email, enforce capacity limits, handle task reassignment on removal
- **Archive projects**: Archive and restore completed projects
- **Dashboard**: Task stats, attention list, workload distribution, project progress, activity feed
- **Offline mode**: Falls back to localStorage if server is unavailable (with toast notification)
- **Persistent storage**: State saved to `db.json` on every change (debounced for performance)

---

## 🚀 Quick Start

### Option A — Double-click (Windows)
```
Double-click start.bat
```
This installs dependencies and starts the server automatically.

### Option B — Command line
```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the server
npm start

# 3. Open in browser
http://localhost:3000
```

### Development mode (auto-restart on file changes)
```bash
npm run dev
```

---

## 📁 Project Structure

```
orbit-workspace/
├── index.html          # Main SPA — all 6 phase views
├── style.css           # Design system & component styles
├── app.js              # Client-side application logic
├── server.js           # Node.js + Express backend
├── db.json             # Flat-file database (auto-created)
├── package.json        # npm config & scripts
├── start.bat           # Windows one-click launcher
├── .gitignore          # Git exclusions
│
├── readme_refined.md   # Full product requirements
├── architectural_diagram(3).md  # System architecture diagrams
└── user_story(2).md    # User stories
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Server heartbeat & db status |
| `GET` | `/api/state` | Read full workspace state |
| `POST` | `/api/state` | Save full workspace state |
| `DELETE` | `/api/state` | Reset to default state |
| `GET` | `/*` | Serve static files (HTML/CSS/JS) |

---

## 🗄️ Database

Orbit uses a simple flat-file JSON database (`db.json`). The state is:

- **Read** on app startup (server state takes priority over localStorage)
- **Written** automatically on every change (600ms debounce)
- **Backed up** to `localStorage` as an offline fallback

The database schema follows the product architecture:
```json
{
  "user": {},
  "workspace": {},
  "members": [],
  "invitations": [],
  "projects": [],
  "tasks": [],
  "subtasks": [],
  "comments": [],
  "activities": []
}
```

---

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | — | Set to `production` to enable 1h static asset caching |

Example:
```bash
PORT=8080 node server.js
```

---

## 🏗️ Architecture

- **Frontend**: Vanilla HTML + CSS + JavaScript (no framework)
- **Backend**: Node.js + Express
- **Database**: JSON flat file (`db.json`)
- **Design**: Outfit font, CSS custom properties, glassmorphism header

### Business Rules Enforced
- Team size: 2–5 members (enforced at invite time)
- Subtasks: single-level only (no nested subtasks)
- Task health: automatic On Track / At Risk / Delayed using elapsed ratio vs progress ratio
- Progress: auto-calculated from subtasks when present; manual slider otherwise
- Member removal: must reassign or explicitly unassign all open tasks first

---

## 🖥️ Browser Support

All modern browsers: Chrome, Firefox, Edge, Safari.

---

## 📜 License

MIT — Internal use / educational project.
