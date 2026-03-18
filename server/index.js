require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', // Assuming client runs on this port
        methods: ['GET', 'POST'],
    },
});

let userSockets = {}; // Map userId to socketId

// Make io and userSockets available in controllers
app.use((req, res, next) => {
    req.io = io;
    req.userSockets = userSockets;
    next();
});

// Connect to database
connectDB();

app.use(express.json());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/questions', require('./routes/questions'));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', ({ role, userId }) => {
        if (role && ['Student', 'Teacher', 'Admin'].includes(role)) {
            socket.join(role);
            console.log(`User ${socket.id} joined room: ${role}`);
        }
        if (userId) {
            userSockets[userId] = socket.id;
            console.log(`Associated userId ${userId} with socketId ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Clean up userSockets mapping
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                console.log(`Removed association for userId ${userId}`);
                break;
            }
        }
    });
});

// Periodically broadcast active student count to teachers and admins
setInterval(async () => {
    const studentSockets = await io.in('Student').fetchSockets();
    const studentCount = studentSockets.length;
    io.to('Teacher').to('Admin').emit('activeStudentsCount', studentCount);
}, 5000); // Broadcast every 5 seconds

const port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
