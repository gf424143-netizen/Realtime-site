require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const VIEWER_PASSWORD = process.env.VIEWER_PASSWORD;

// Path to store live content
const contentFile = path.join(__dirname, 'content.txt');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for viewer authentication
app.get('/auth', (req, res) => {
    const pass = req.query.password;
    if (pass === VIEWER_PASSWORD || pass === ADMIN_PASSWORD) {
        res.json({ access: true });
    } else {
        res.json({ access: false });
    }
});

// Route for admin authentication
app.get('/auth-admin', (req, res) => {
    const pass = req.query.password;
    if (pass === ADMIN_PASSWORD) {
        res.json({ access: true });
    } else {
        res.json({ access: false });
    }
});

// Socket.io connection
io.on('connection', socket => {
    console.log('A user connected');

    // Send current content when user connects
    if (fs.existsSync(contentFile)) {
        const currentContent = fs.readFileSync(contentFile, 'utf8');
        socket.emit('updateContent', currentContent);
    }

    // Listen for admin updates
    socket.on('updateContent', text => {
        fs.writeFileSync(contentFile, text, 'utf8');
        io.emit('updateContent', text);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
