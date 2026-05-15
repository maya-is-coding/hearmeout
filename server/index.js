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
        origin: ["http://localhost:3000", "https://hearmeout-seven.vercel.app"],
        methods: ["GET", "POST"]
    }
});

// 4. Store active rooms
// Each room: { users: [...], songState: { songId, timestamp, isPlaying, updatedAt }, theme: 'dorm' }
const rooms = {};

// Helper: get a room or create skeleton
function getRoom(code) {
    if (!rooms[code]) {
        rooms[code] = { users: [], songState: null, theme: 'dorm' };
    }
    return rooms[code];
}

// Helper: compute the "live" timestamp accounting for elapsed time since last update
function getLiveTimestamp(songState) {
    if (!songState) return 0;
    if (!songState.isPlaying) return songState.timestamp;
    // Song is playing — add elapsed time since the server recorded it
    const elapsed = (Date.now() - songState.updatedAt) / 1000;
    return songState.timestamp + elapsed;
}

// 5. Listen for connections
io.on('connection', (socket) => {
    console.log('someone connected:', socket.id);

    // CREATE ROOM
    socket.on('create-room', (name) => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms[code] = {
            users: [{ id: socket.id, name: name || 'You' }],
            songState: null,
            theme: 'dorm'
        };
        socket.join(code);
        socket.emit('room-created', code);
        console.log(`room created: ${code}`);
    });

    // JOIN ROOM
    socket.on('join-room', ({ code, name }) => {
        const room = getRoom(code);

        // Prevent duplicate socket entries for same socket OR same name (handles delayed disconnects on refresh)
        room.users = room.users.filter(u => u.id !== socket.id && u.name !== (name || 'You'));

        if (room.users.length >= 2) {
            socket.emit('room-error', 'Room is full');
            return;
        }

        const user = { id: socket.id, name: name || 'You' };
        room.users.push(user);
        socket.join(code);
        
        socket.emit('room-joined', code);

        // If there's a partner, exchange names
        const partner = room.users.find(u => u.id !== socket.id);
        if (partner) {
            socket.to(code).emit('partner-joined', user.name);
            socket.emit('partner-joined', partner.name);
        }

        console.log(`${socket.id} joined room: ${code}`);
    });

    // REQUEST SYNC — new joiner asks the server for current room state
    socket.on('request-sync', (code) => {
        const room = rooms[code];
        if (!room) return;

        // Send theme
        socket.emit('theme-changed', room.theme);

        // Send song state if any
        if (room.songState) {
            socket.emit('sync-song', {
                songId: room.songState.songId,
                timestamp: getLiveTimestamp(room.songState),
                isPlaying: room.songState.isPlaying
            });
        }

        console.log(`sync sent to ${socket.id} for room ${code}`);
    });

    // PLAY SONG
    socket.on('play-song', ({ code, songId, timestamp }) => {
        // Store on server
        const room = rooms[code];
        if (room) {
            room.songState = { songId, timestamp, isPlaying: true, updatedAt: Date.now() };
        }
        socket.to(code).emit('play-song', { songId, timestamp });
    });

    // PAUSE SONG
    socket.on('pause-song', ({ code, timestamp }) => {
        const room = rooms[code];
        if (room && room.songState) {
            room.songState.timestamp = timestamp;
            room.songState.isPlaying = false;
            room.songState.updatedAt = Date.now();
        }
        socket.to(code).emit('pause-song', { timestamp });
    });

    // RESUME SONG
    socket.on('resume-song', ({ code, timestamp }) => {
        const room = rooms[code];
        if (room && room.songState) {
            room.songState.timestamp = timestamp;
            room.songState.isPlaying = true;
            room.songState.updatedAt = Date.now();
        }
        socket.to(code).emit('resume-song', { timestamp });
    });

    // SYNC SONG (Mid-song join — kept for backward compat, but server now handles this)
    socket.on('sync-song', ({ code, songId, timestamp, isPlaying }) => {
        socket.to(code).emit('sync-song', { songId, timestamp, isPlaying });
    });

    // CHANGE THEME
    socket.on('change-theme', ({ code, themeId }) => {
        const room = rooms[code];
        if (room) {
            room.theme = themeId;
        }
        // Broadcast to everyone else in the room
        socket.to(code).emit('theme-changed', themeId);
        console.log(`theme changed to ${themeId} in room ${code}`);
    });

    // DISCONNECT
    socket.on('disconnect', () => {
        for (const code in rooms) {
            const room = rooms[code];
            room.users = room.users.filter(u => u.id !== socket.id);
            if (room.users.length === 0) {
                delete rooms[code];
            } else {
                socket.to(code).emit('partner-left');
            }
        }
        console.log('disconnected:', socket.id);
    });
});

// 6. Start server
server.listen(4000, () => {
    console.log('HearMeOut server running on port 4000');
});