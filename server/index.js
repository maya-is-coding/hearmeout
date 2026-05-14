const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// 1. Create express app
const app = express();
app.use(cors());

// 2. Wrap it in an http server
const server = http.createServer(app);

// 3. Attach socket.io to the http server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// 4. Store active rooms
const rooms = {};

// 5. Listen for connections
io.on('connection', (socket) => {
    console.log('someone connected:', socket.id);

    // CREATE ROOM
    socket.on('create-room', (name) => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms[code] = [{ id: socket.id, name: name || 'You' }];
        socket.join(code);
        socket.emit('room-created', code);
        console.log(`room created: ${code}`);
    });

    // JOIN ROOM
    socket.on('join-room', ({ code, name }) => {
        if (!rooms[code]) {
            // Recreate room if it was lost (e.g. on refresh)
            rooms[code] = [];
        }
        
        // Prevent duplicate socket entries for same socket OR same name (handles delayed disconnects on refresh)
        rooms[code] = rooms[code].filter(u => u.id !== socket.id && u.name !== (name || 'You'));

        if (rooms[code].length >= 2) {
            socket.emit('room-error', 'Room is full');
            return;
        }

        const user = { id: socket.id, name: name || 'You' };
        rooms[code].push(user);
        socket.join(code);
        
        socket.emit('room-joined', code);

        // If there's a partner, exchange names
        const partner = rooms[code].find(u => u.id !== socket.id);
        if (partner) {
            socket.to(code).emit('partner-joined', user.name);
            socket.emit('partner-joined', partner.name);
        }

        console.log(`${socket.id} joined room: ${code}`);
    });

    // PLAY SONG
    socket.on('play-song', ({ code, songId, timestamp }) => {
        socket.to(code).emit('play-song', { songId, timestamp });
    });

    // PAUSE SONG
    socket.on('pause-song', ({ code, timestamp }) => {
        socket.to(code).emit('pause-song', { timestamp });
    });

    // RESUME SONG
    socket.on('resume-song', ({ code, timestamp }) => {
        socket.to(code).emit('resume-song', { timestamp });
    });

    // SYNC SONG (Mid-song join)
    socket.on('sync-song', ({ code, songId, timestamp, isPlaying }) => {
        socket.to(code).emit('sync-song', { songId, timestamp, isPlaying });
    });

    // DISCONNECT
    socket.on('disconnect', () => {
        for (const code in rooms) {
            rooms[code] = rooms[code].filter(u => u.id !== socket.id);
            if (rooms[code].length === 0) delete rooms[code];
            else socket.to(code).emit('partner-left');
        }
        console.log('disconnected:', socket.id);
    });
});

// 6. Start server
server.listen(4000, () => {
    console.log('HearMeOut server running on port 4000');
});