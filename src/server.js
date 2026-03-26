const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { sequelize, connectDB } = require('./config/db');
const { User } = require('./models.js/index.js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Sync models
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced');
    })
    .catch(err => {
        // #region agent log
        globalThis.fetch && globalThis.fetch('http://127.0.0.1:7930/ingest/ab19ee87-eaf1-4e27-9823-4891135419d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00905c'},body:JSON.stringify({sessionId:'00905c',runId:'pre-fix',hypothesisId:'H3',location:'src/server.js:sequelize.sync:catch',message:'sequelize.sync failed',data:{alter:true,errorName:err?.name||null,errorCode:err?.original?.code||err?.code||null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        console.error('Error syncing database:', err);
    });

app.get('/', (req, res) => {
    // #region agent log
    globalThis.fetch && globalThis.fetch('http://127.0.0.1:7930/ingest/ab19ee87-eaf1-4e27-9823-4891135419d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00905c'},body:JSON.stringify({sessionId:'00905c',runId:'pre-fix',hypothesisId:'H4',location:'src/server.js:GET /',message:'Serving / with login.html',data:{queryKeys:Object.keys(req.query||{})},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    res.sendFile(path.join(__dirname, '../templates/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/register.html'));
});
app.get('/post', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/post.html'));
});

// Serve static assets from templates (e.g. agni.png for post.html logo)
app.use('/assets', express.static(path.join(__dirname, '../templates')));
// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, department, year, password } = req.body;
        
        // Backend Validation: Only @act.edu.in allowed
        if (!email || !email.toLowerCase().endsWith('@act.edu.in')) {
            return res.status(400).json({ error: 'Only Agni College students can register' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await User.create({
            name,
            email,
            department,
            year,
            password: hashedPassword
        });

        // Return success JSON so frontend can redirect
        res.status(201).json({ message: 'Registration successful', redirect: '/post' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // #region agent log
        globalThis.fetch && globalThis.fetch('http://127.0.0.1:7930/ingest/ab19ee87-eaf1-4e27-9823-4891135419d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00905c'},body:JSON.stringify({sessionId:'00905c',runId:'pre-fix',hypothesisId:'H2',location:'src/server.js:POST /api/login:body',message:'Login body received',data:{hasEmail:!!email,emailLen:(email||'').length,hasPassword:!!password,passwordLen:(password||'').length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.redirect('/login?error=Invalid email or password');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.redirect('/login?error=Invalid email or password');
        }

        // For now, just redirect to home or a success page
        // In a real app, you'd set a session or cookie with a JWT
        // #region agent log
        globalThis.fetch && globalThis.fetch('http://127.0.0.1:7930/ingest/ab19ee87-eaf1-4e27-9823-4891135419d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00905c'},body:JSON.stringify({sessionId:'00905c',runId:'pre-fix',hypothesisId:'H4',location:'src/server.js:POST /api/login:success-redirect',message:'Login ok; redirecting to / (may still show login page)',data:{redirectTo:'/?success=Logged in successfully'},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        //res.redirect('/?success=Logged in successfully');
        res.redirect('/post');
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/login?error=Login failed');
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
