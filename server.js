/* ==========================================================================
   Orbit Backend Server — Node.js + Express + sql.js (SQLite) + JWT Auth
   ==========================================================================
   
   sql.js is a pure JavaScript SQLite implementation — no native compilation,
   works on any system. The database is loaded into memory on startup and
   persisted to orbit.db on every write.
   
   Auth Endpoints (public):
     POST /api/auth/register  → Create account, returns JWT
     POST /api/auth/login     → Verify credentials, returns JWT
     GET  /api/auth/me        → Get current user profile
   
   Protected Endpoints (require Authorization: Bearer <token>):
     GET  /api/state          → Load user's workspace state
     POST /api/state          → Save user's workspace state
   
   Public:
     GET  /api/health         → Server heartbeat
     GET  /*                  → Static files
   ========================================================================== */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'orbit.db');
const SECRET_FILE = path.join(__dirname, 'jwt_secret.key');

/* --------------------------------------------------------------------------
   JWT Secret — auto-generated on first run, persisted to jwt_secret.key
-------------------------------------------------------------------------- */
let JWT_SECRET;
if (fs.existsSync(SECRET_FILE)) {
    JWT_SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();
} else {
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(SECRET_FILE, JWT_SECRET, 'utf8');
    console.log('  🔑 Generated new JWT secret key → jwt_secret.key');
}
const JWT_EXPIRES_IN = '7d';

/* --------------------------------------------------------------------------
   sql.js Database — pure JS SQLite, no native dependencies
-------------------------------------------------------------------------- */
let SQL; // sql.js instance
let sqlDb; // in-memory database

// Persist database to disk after every write
function persistDB() {
    const data = sqlDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Initialize the database (async because sql.js loads a WASM module)
async function initDB() {
    const initSqlJs = require('sql.js');
    SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        // Load existing database from disk
        const fileBuffer = fs.readFileSync(DB_PATH);
        sqlDb = new SQL.Database(fileBuffer);
        console.log('  ✅ Loaded existing database from orbit.db');
    } else {
        // Create fresh database
        sqlDb = new SQL.Database();
        console.log('  🗄️  Created new SQLite database → orbit.db');
    }

    // Create tables
    sqlDb.run(`
        CREATE TABLE IF NOT EXISTS users (
            id           TEXT PRIMARY KEY,
            name         TEXT NOT NULL,
            email        TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at   TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );

        CREATE TABLE IF NOT EXISTS workspaces (
            user_id      TEXT PRIMARY KEY,
            state_json   TEXT NOT NULL,
            updated_at   TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );
    `);
    persistDB();
}

// Helper: run a SELECT and return all rows as array of objects
function dbAll(sql, params = []) {
    try {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    } catch (e) {
        console.error('DB query error:', e.message, '| SQL:', sql);
        return [];
    }
}

// Helper: run a SELECT and return first row or null
function dbGet(sql, params = []) {
    const rows = dbAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

// Helper: run an INSERT/UPDATE/DELETE
function dbRun(sql, params = []) {
    try {
        sqlDb.run(sql, params);
        persistDB();
        return true;
    } catch (e) {
        console.error('DB run error:', e.message, '| SQL:', sql);
        return false;
    }
}

/* --------------------------------------------------------------------------
   Default Workspace Factory
-------------------------------------------------------------------------- */
function createDefaultWorkspace(userId, userName, userEmail, workspaceType) {
    const today = new Date().toISOString().split('T')[0];
    const wsName = workspaceType === 'team'
        ? `${userName}'s Team`
        : `${userName}'s Workspace`;
    const memberRole = workspaceType === 'team' ? 'team_head' : 'solo_owner';
    return {
        user: { name: userName, email: userEmail, loggedIn: true },
        workspace: {
            name: wsName,
            type: workspaceType || 'solo',
            created: today
        },
        members: [
            { id: userId, name: userName, email: userEmail, role: memberRole }
        ],
        invitations: [],
        projects: [],
        tasks: [],
        subtasks: [],
        comments: [],
        activities: [
            {
                id: `a-${Date.now()}`,
                taskId: null,
                userId: userId,
                action: 'created',
                details: 'created the workspace.',
                time: new Date().toISOString()
            }
        ]
    };
}

/* --------------------------------------------------------------------------
   Express Middleware
-------------------------------------------------------------------------- */
app.use(express.json({ limit: '5mb' }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use((req, res, next) => {
    const ts = new Date().toLocaleTimeString();
    console.log(`  [${ts}] ${req.method} ${req.path}`);
    next();
});

/* --------------------------------------------------------------------------
   Auth Middleware
-------------------------------------------------------------------------- */
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized', message: 'No token provided.' });
    }
    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'TokenExpired', message: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ error: 'InvalidToken', message: 'Invalid session token.' });
    }
}

/* --------------------------------------------------------------------------
   Auth Routes
-------------------------------------------------------------------------- */

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, workspaceType } = req.body;
    const cleanType = (workspaceType === 'team') ? 'team' : 'solo'; // default solo

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'ValidationError', message: 'Name, email, and password are required.' });
    }
    if (String(name).trim().length < 2) {
        return res.status(400).json({ error: 'ValidationError', message: 'Name must be at least 2 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'ValidationError', message: 'Please enter a valid email address.' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if email already taken
    const existing = dbGet('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
        return res.status(409).json({ error: 'EmailTaken', message: 'An account with this email already exists.' });
    }

    try {
        const passwordHash = await bcrypt.hash(String(password), 12);
        const userId = uuidv4();

        // Insert user
        const inserted = dbRun(
            'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [userId, cleanName, cleanEmail, passwordHash]
        );
        if (!inserted) throw new Error('Failed to insert user');

        // Create default workspace
        const defaultState = createDefaultWorkspace(userId, cleanName, cleanEmail, cleanType);
        dbRun(
            'INSERT INTO workspaces (user_id, state_json) VALUES (?, ?)',
            [userId, JSON.stringify(defaultState)]
        );

        const token = jwt.sign(
            { userId, email: cleanEmail, name: cleanName },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log(`  ✅ Registered: ${cleanEmail}`);
        res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: { id: userId, name: cleanName, email: cleanEmail }
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: 'ServerError', message: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'ValidationError', message: 'Email and password are required.' });
    }

    const user = dbGet('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
        return res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid email or password.' });
    }

    try {
        const match = await bcrypt.compare(String(password), user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'InvalidCredentials', message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log(`  ✅ Login: ${user.email}`);
        res.json({
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'ServerError', message: 'Login failed. Please try again.' });
    }
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = dbGet('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.userId]);
    if (!user) return res.status(404).json({ error: 'NotFound', message: 'User not found.' });
    res.json({ user });
});

/* --------------------------------------------------------------------------
   Health Check
-------------------------------------------------------------------------- */
app.get('/api/health', (req, res) => {
    const result = dbGet('SELECT COUNT(*) as count FROM users');
    const userCount = result ? result.count : 0;
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected', users: userCount });
});

/* --------------------------------------------------------------------------
   Workspace State Routes (protected)
-------------------------------------------------------------------------- */

// GET /api/state
app.get('/api/state', requireAuth, (req, res) => {
    const row = dbGet('SELECT state_json FROM workspaces WHERE user_id = ?', [req.user.userId]);

    if (!row) {
        // Edge case: create fresh workspace
        const fresh = createDefaultWorkspace(req.user.userId, req.user.name, req.user.email);
        dbRun('INSERT INTO workspaces (user_id, state_json) VALUES (?, ?)', [req.user.userId, JSON.stringify(fresh)]);
        return res.json(fresh);
    }

    try {
        res.json(JSON.parse(row.state_json));
    } catch (e) {
        res.status(500).json({ error: 'ParseError', message: 'Failed to read workspace state.' });
    }
});

// POST /api/state
app.post('/api/state', requireAuth, (req, res) => {
    const incoming = req.body;
    const required = ['user', 'workspace', 'members', 'projects', 'tasks', 'subtasks', 'comments', 'activities'];
    for (const key of required) {
        if (!(key in incoming)) {
            return res.status(400).json({ error: 'ValidationError', message: `Missing field: "${key}"` });
        }
    }

    incoming._lastSaved = new Date().toISOString();
    incoming._savedBy = req.user.userId;

    const saved = dbRun(
        `INSERT INTO workspaces (user_id, state_json, updated_at)
         VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))
         ON CONFLICT(user_id) DO UPDATE SET
             state_json = excluded.state_json,
             updated_at = excluded.updated_at`,
        [req.user.userId, JSON.stringify(incoming)]
    );

    if (!saved) {
        return res.status(500).json({ error: 'SaveError', message: 'Failed to save state.' });
    }

    res.json({
        status: 'success',
        saved_at: incoming._lastSaved,
        counts: {
            projects: incoming.projects.length,
            tasks: incoming.tasks.length,
            members: incoming.members.length
        }
    });
});

/* --------------------------------------------------------------------------
   Static File Serving
-------------------------------------------------------------------------- */
app.use(express.static(__dirname, {
    index: false,
    dotfiles: 'ignore',
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

/* --------------------------------------------------------------------------
   Error Handler
-------------------------------------------------------------------------- */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'InternalError', message: err.message });
});

/* --------------------------------------------------------------------------
   Startup — initialize DB first, then listen
-------------------------------------------------------------------------- */
initDB().then(() => {
    app.listen(PORT, () => {
        const result = dbGet('SELECT COUNT(*) as count FROM users');
        const userCount = result ? result.count : 0;
        console.log('');
        console.log('  ╔══════════════════════════════════════════╗');
        console.log('  ║      🚀 Orbit Server Running (Auth)      ║');
        console.log('  ╠══════════════════════════════════════════╣');
        console.log(`  ║  App:     http://localhost:${PORT}           ║`);
        console.log(`  ║  Login:   http://localhost:${PORT}/login      ║`);
        console.log(`  ║  DB:      orbit.db (${userCount} user${userCount !== 1 ? 's' : ' '})             ║`);
        console.log('  ║  Press Ctrl+C to stop                    ║');
        console.log('  ╚══════════════════════════════════════════╝');
        console.log('');
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
