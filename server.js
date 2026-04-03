const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors'); // ✅ ADD THIS
const { initDb } = require('./src/models/database');

// Initialize Database
initDb();

const app = express();
const server = http.createServer(app);

// ✅ FIX SOCKET CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ✅ FIX CORS FOR FRONTEND
const allowedOrigins = [
    'https://medi-monitor-frontend.vercel.app', // Update with actual frontend URL
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST"],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'medimonitor-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Pass io to routes
app.set('io', io);

// Routes
const authRoutes = require('./src/routes/auth');
const patientRoutes = require('./src/routes/patients');
const doctorRoutes = require('./src/routes/doctors');
const bedRoutes = require('./src/routes/beds');
const alertRoutes = require('./src/routes/alerts');
const checkupRoutes = require('./src/routes/checkups');
const appointmentRoutes = require('./src/routes/appointments');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/checkups', checkupRoutes);
app.use('/api/appointments', appointmentRoutes);

// Home route
app.get('/', (req, res) => {
    res.send("MediMonitor Backend Running ✅");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MediMonitor server running on port ${PORT}`);
});