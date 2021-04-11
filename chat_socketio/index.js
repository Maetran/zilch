const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.broadcast.emit('chat', {"message": "Teilnehmer hat den Chat betreten"});
  socket.on('disconnect', () => {
    socket.broadcast.emit('chat', {"message": "Teilnehmer hat den Chat verlassen"});
  });
});

io.on('connection', (socket) => {
  socket.on('isTyping', (msg) => {
    let nachricht = msg["nickname"] + " ist am schreiben...";
    socket.broadcast.emit('chat', {"typing": true, "message": nachricht});
  });
});

io.on('connection', (socket) => {
  socket.on('chat', (msg) => {
    let nachricht = msg["nickname"] + ": " + msg["input"];
    io.emit('chat', {"typing": false, "nickname": msg["nickname"], "message": nachricht});
  });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
