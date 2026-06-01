const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
require('dotenv').config();

// Auth Middleware 
const { requireAuth, requireAdmin, requireCoordinator } = require('./middleware/auth');

const { sequelize, connectDB } = require('./config/db');
const { User, Hackathon, Registration } = require('./models');


const app = express();

// Image file storage setup using multer
const multer = require('multer');

// For hackathon posters
const posterStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads/posters'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// For certificates
const certStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads/certificates'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploadPoster = multer({ storage: posterStorage });
const uploadCert = multer({ storage: certStorage });
//MIDDLEWARE SETUP 
// cors() should be restricted in production, but fine for now
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SESSION SETUP ---
// This creates a "Sessions" table in your MySQL DB automatically
// Every logged-in user gets a session row here
const sessionStore = new SequelizeStore({ db: sequelize });

app.use(session({
    secret: process.env.SESSION_SECRET,  // used to sign the cookie
    store: sessionStore,                 // store sessions in MySQL
    resave: false,                       // don't save session if nothing changed
    saveUninitialized: false,            // don't create session until something is stored
    cookie: {
        maxAge: 1000 * 60 * 60 * 8,     // 8 hours in milliseconds
        httpOnly: true                   // JS in browser cannot read this cookie (security)
    }
}));

// Create the Sessions table if it doesn't exist
sessionStore.sync();

//DATABASE CONNECTION 
connectDB();

// sync without alter:true — safer, won't modify existing columns on restart
// Use migrations when you need schema changes (we'll cover this later)
sequelize.sync()
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Error syncing database:', err));

// --- STATIC FILES ---
app.use('/assets', express.static(path.join(__dirname, '../templates')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- PAGE ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/register.html'));
});

// Note requireAuth here — /dashboard is now protected
app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/student/post.html'));
});

app.get('/registrations', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/student/registrations.html'));
});

app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/admin/index.html'));
});

// --- API: REGISTER ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, department, year, password } = req.body;

        if (!email || !email.toLowerCase().endsWith('@act.edu.in')) {
            return res.status(400).json({ error: 'Only Agni College students can register' });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name,
            email,
            department,
            year,
            password: hashedPassword
        });

        res.status(201).json({ message: 'Registration successful', redirect: '/login' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// API: LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // THIS is what was missing before
        // We store key user info in the session — the "visitor badge"
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.role = user.role || 'student';      // we'll add role to model next
        req.session.department = user.department;

        const redirectTo = user.role === 'admin' ? '/admin'
            : user.role === 'coordinator' ? '/coordinator/dashboard'
            : '/dashboard';
        res.status(200).json({ message: 'Login successful', redirect: redirectTo });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/hackathons - Admin posts a new hackathon
app.post('/api/hackathons', requireAuth, requireAdmin, uploadPoster.single('posterImage'), async (req, res) => {
    try {
        const { title, institute, description, startDate, deadline, teamSize } = req.body;

        // Validate required fields
        if (!title || !institute || !startDate || !deadline) {
            return res.status(400).json({ error: 'Title, institute, start date and deadline are required' });
        }

        // Validate deadline is after startDate
        if (new Date(deadline) < new Date(startDate)) {
            return res.status(400).json({ error: 'Deadline cannot be before start date' });
        }

        // Get uploaded file path if exists
        const posterImage = req.file ? '/uploads/posters/' + req.file.filename : null;

        // Save to database
        const hackathon = await Hackathon.create({
            title,
            institute,
            description,
            startDate,
            deadline,
            teamSize,
            posterImage,
            postedBy: req.session.userId
        });

        res.status(201).json({
            message: 'Hackathon posted successfully',
            hackathon
        });

    } catch (error) {
        console.error('Error posting hackathon:', error);
        res.status(500).json({ error: 'Failed to post hackathon' });
    }
});

// PUT /api/hackathons/:id - Admin updates a hackathon
app.put('/api/hackathons/:id', requireAuth, requireAdmin, uploadPoster.single('posterImage'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, institute, description, startDate, deadline, teamSize } = req.body;

        const hackathon = await Hackathon.findByPk(id);
        if (!hackathon) {
            return res.status(404).json({ error: 'Hackathon not found' });
        }

        if (!title || !institute || !startDate || !deadline) {
            return res.status(400).json({ error: 'Title, institute, start date and deadline are required' });
        }

        if (new Date(deadline) < new Date(startDate)) {
            return res.status(400).json({ error: 'Deadline cannot be before start date' });
        }

        const posterImage = req.file ? '/uploads/posters/' + req.file.filename : hackathon.posterImage;

        await hackathon.update({
            title, institute, description, startDate, deadline, teamSize, posterImage
        });

        res.json({ message: 'Hackathon updated successfully', hackathon });
    } catch (error) {
        console.error('Error updating hackathon:', error);
        res.status(500).json({ error: 'Failed to update hackathon' });
    }
});

// DELETE /api/hackathons/:id - Admin deletes a hackathon
app.delete('/api/hackathons/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const hackathon = await Hackathon.findByPk(id);
        if (!hackathon) {
            return res.status(404).json({ error: 'Hackathon not found' });
        }
        await hackathon.destroy();
        res.json({ message: 'Hackathon deleted successfully' });
    } catch (error) {
        console.error('Error deleting hackathon:', error);
        res.status(500).json({ error: 'Failed to delete hackathon' });
    }
});

// --- ADMIN DASHBOARD ---
app.get('/admin/dashboard', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/admin/dashboard.html'));
});

// GET /api/admin/stats - Dashboard analytics
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalHackathons = await Hackathon.count();

        const usersByDepartment = await User.findAll({
            attributes: ['department', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['department'],
            raw: true
        });

        const usersByYear = await User.findAll({
            attributes: ['year', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['year'],
            raw: true
        });

        const usersByRole = await User.findAll({
            attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['role'],
            raw: true
        });

        const recentUsers = await User.findAll({
            attributes: ['name', 'email', 'department', 'year', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 10,
            raw: true
        });

        const recentHackathons = await Hackathon.findAll({
            include: [{ model: User, as: 'admin', attributes: ['name', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.json({
            totalUsers,
            totalHackathons,
            usersByDepartment,
            usersByYear,
            usersByRole,
            recentUsers,
            recentHackathons
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// GET /api/hackathons - Get all hackathons
app.get('/api/hackathons', requireAuth, async (req, res) => {
    try {
        const hackathons = await Hackathon.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(hackathons);
    } catch (error) {
        console.error('Error fetching hackathons:', error);
        res.status(500).json({ error: 'Failed to fetch hackathons' });
    }
});

// Student Registration for Hackathon Logic

app.post('/api/registrations', requireAuth, async (req, res) => {
    try {
        const { hackathonId, mentorName } = req.body;

        if (!hackathonId) {
            return res.status(400).json({ error: 'Hackathon ID is required' });
        }

        const hackathon = await Hackathon.findByPk(hackathonId);
        if (!hackathon) {
            return res.status(404).json({ error: 'Hackathon not found' });
        }

        // check if deadline has passed
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        if (todayStr > hackathon.deadline) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }
        const existing = await Registration.findOne({
            where: {
                hackathonId,
                userId: req.session.userId
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already registered for this hackathon' });
        }

        const registration = await Registration.create({
            hackathonId,
            userId: req.session.userId,
            mentorName: mentorName || null,
            status: 'registered'
        });

        res.status(201).json({
            message: 'Successfully registered for hackathon',
            registration
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register' });
    }
});

app.get('/api/registrations', requireAuth, async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            where: { userId: req.session.userId },
            include: [{
                model: Hackathon,
                as: 'hackathon',
                attributes: ['title', 'institute', 'startDate', 'deadline', 'posterImage', 'id']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(registrations);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// PUT /api/registrations/:id — Student updates status and/or uploads certificate
app.put('/api/registrations/:id', requireAuth, uploadCert.single('certificate'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const registration = await Registration.findOne({
            where: { id, userId: req.session.userId }
        });

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        const validStatuses = ['registered', 'participated', 'shortlisted', 'winner'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        if (status) registration.status = status;

        if (status === 'winner' || status === 'participated') {
            if (req.file) {
                registration.certificate = '/uploads/certificates/' + req.file.filename;
            } else if (!registration.certificate) {
                return res.status(400).json({ error: 'A certificate file is required for ' + status + ' status.' });
            }
        }

        await registration.save();

        res.json({ message: 'Registration updated', registration });
    } catch (error) {
        console.error('Error updating registration:', error);
        res.status(500).json({ error: 'Failed to update registration' });
    }
});

//API: LOGOUT
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');  // clear the session cookie from browser
        res.status(200).json({ message: 'Logged out', redirect: '/login' });
    });
});

// GET /api/me - Returns current user session data
app.get('/api/me', requireAuth, (req, res) => {
    res.json({
        id: req.session.userId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role,
        department: req.session.department
    });
});

// --- COORDINATOR ROUTES ---

// Admin coordinator management page
app.get('/admin/coordinators', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/admin/coordinators.html'));
});

// Coordinator dashboard page
app.get('/coordinator/dashboard', requireAuth, requireCoordinator, (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/coordinator/dashboard.html'));
});

// POST /api/coordinators - Admin adds a coordinator
app.post('/api/coordinators', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, email, department, password } = req.body;

        if (!name || !email || !department || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!email.toLowerCase().endsWith('@act.edu.in')) {
            return res.status(400).json({ error: 'Only Agni College emails allowed' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const existingCoordinator = await User.findOne({
            where: { department, role: 'coordinator' }
        });
        if (existingCoordinator) {
            return res.status(400).json({ error: department + ' already has a coordinator' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const coordinator = await User.create({
            name, email, department,
            year: 0,
            password: hashedPassword,
            role: 'coordinator'
        });

        res.status(201).json({
            message: 'Coordinator added successfully',
            coordinator: {
                id: coordinator.id,
                name: coordinator.name,
                email: coordinator.email,
                department: coordinator.department
            }
        });

    } catch (error) {
        console.error('Error adding coordinator:', error);
        res.status(500).json({ error: 'Failed to add coordinator' });
    }
});

// GET /api/coordinators - Admin gets all coordinators
app.get('/api/coordinators', requireAuth, requireAdmin, async (req, res) => {
    try {
        const coordinators = await User.findAll({
            where: { role: 'coordinator' },
            attributes: ['id', 'name', 'email', 'department', 'createdAt'],
            order: [['department', 'ASC']]
        });
        res.json(coordinators);
    } catch (error) {
        console.error('Error fetching coordinators:', error);
        res.status(500).json({ error: 'Failed to fetch coordinators' });
    }
});

// DELETE /api/coordinators/:id - Admin removes a coordinator
app.delete('/api/coordinators/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const coordinator = await User.findOne({
            where: { id, role: 'coordinator' }
        });

        if (!coordinator) {
            return res.status(404).json({ error: 'Coordinator not found' });
        }

        await coordinator.destroy();
        res.json({ message: 'Coordinator removed successfully' });

    } catch (error) {
        console.error('Error deleting coordinator:', error);
        res.status(500).json({ error: 'Failed to delete coordinator' });
    }
});

// GET /api/coordinator/registrations
app.get('/api/coordinator/registrations', requireAuth, requireCoordinator, async (req, res) => {
    try {
        const department = req.session.department;

        const registrations = await Registration.findAll({
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['name', 'email', 'department', 'year'],
                    where: { department }
                },
                {
                    model: Hackathon,
                    as: 'hackathon',
                    attributes: ['title', 'institute', 'startDate']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(registrations);

    } catch (error) {
        console.error('Error fetching coordinator registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});