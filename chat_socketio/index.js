const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const activeUsers = new Object();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.broadcast.emit('chat', {"message": "Teilnehmer hat den Chat betreten"});
  socket.on('disconnect', () => {
    let thisUser = activeUsers[socket.id];
    let nachricht = thisUser + " hat den Chat verlassen";
    socket.broadcast.emit('chat', {"message": nachricht});
    delete activeUsers[socket.id];
    let userlist = [];
    for(let k in activeUsers)
    {
      userlist.push(activeUsers[k]);
    };
    io.emit('onlineUser', userlist)
  });
});

io.on('connection', (socket) => {
  socket.on('isTyping', (msg) => {
    let nachricht = activeUsers[socket.id] + " ist am schreiben...";
    socket.broadcast.emit('chat', {"typing": true, "message": nachricht});
  });
});

io.on('connection', (socket) => {
  socket.on('chat', (msg) => {
    let nachricht = activeUsers[socket.id] + ": " + msg["input"];
    io.emit('chat', {"typing": false, "message": nachricht, "nickname": activeUsers[socket.id]});
  });
});

io.on('connection', (socket) => {
  socket.on('onlineUser', (msg) => {
    activeUsers[socket.id] = msg["nickname"];
    let userlist = [];
    for(let k in activeUsers)
    {
      userlist.push(activeUsers[k]);
    }
    console.log(userlist);
    io.emit('onlineUser', userlist)
  });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
