const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const allUsers = {};

express.static('./public');
app.use(express.static('./public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/zilch.html');
});

io.on('connection', (socket) => {
  socket.on('registerPlayer', (msg) => {
    let playerSocketId = socket.id;
    let playerName = msg;
    allUsers[playerSocketId] = playerName;
  })
})

server.listen(3003, () => {
    console.log('listening on *:3003');
});
