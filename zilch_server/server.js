const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const allUsers = new Object();
const activeGames = new Object();

// Provide all files from public
app.use(express.static('./public'));

// Landingpoint
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/zilch.html');
});

// First connect and adding user to allUsers - Object; send back Userlist to io
io.on('connection', (socket) => {
  // Register new Player to allUsers
  socket.on('registerPlayer', (msg) => {
    console.log("User verbunden: " + msg);
    allUsers[socket.id] = msg;
    console.log(allUsers);
    io.emit('updatePlayerList', allUsers)
  });
  // Create new Game
  socket.on('createNewGame', () => {
    const gameId = "game" + socket.id;
    socket.join(gameId);
    socket.emit('joinedGame', gameId)
  });
  // Leave current Game
  socket.on('leaveGame', () => {
    socket.emit('leftGame');
  })
});

// Delete user from userlist at disconnect
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    console.log('User verlassen: ' + allUsers[socket.id])
    delete allUsers[socket.id];
    io.emit('updatePlayerList', allUsers);
  })
})

// Server port
server.listen(3003, () => {
    console.log('listening on *:3003');
});
