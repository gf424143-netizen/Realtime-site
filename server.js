const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const http = require('http');
const WebSocket = require('ws');
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let content = fs.readFileSync('content.txt', 'utf8');

wss.on('connection', ws => {
  ws.send(content); // Send initial content
});

function broadcastUpdate(newContent) {
  content = newContent;
  fs.writeFileSync('content.txt', newContent);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(newContent);
    }
  });
}

app.use(express.static('public'));
app.use(express.json());

app.get('/api/content', (req, res) => {
  if (req.query.password === process.env.VIEW_PASSWORD) {
    res.send(content);
  } else {
    res.status(403).send('Invalid password');
  }
});

app.post('/api/update', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    broadcastUpdate(req.body.content);
    res.send('Updated');
  } else {
    res.status(403).send('Invalid admin password');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Running on http://localhost:' + PORT));
