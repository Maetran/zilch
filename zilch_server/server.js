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
  socket.on('registerPlayer', (user) => {
    allUsers[socket.id] = user;
    io.emit('updatePlayerList', allUsers);
    socket.emit('showAllGames', activeGames);
  });
  // Create new Game
  socket.on('createNewGame', (userGameName) => {
    const gameId = "game" + socket.id;
    socket.join(gameId);
    const gameParams = {"gameId": gameId, "name": userGameName};
    socket.emit('joinedGame', gameParams);
    io.emit('newGameAvailable', gameParams);
    activeGames[gameId] = [userGameName,[socket.id]];
    console.log("im Spiel "  + gameId + ": "+ activeGames[gameId][1]);
  });
  // Leave current Game
  socket.on('leaveGame', (gameId) => {
    socket.leave(gameId);
    socket.to(gameId).emit('leftGame');
  });
  // Mark game as full (opened Game got 2nd Player)
  socket.on('gameFull', (submit) => {
    const gameName = submit["buttonText"];
    const gameId = submit["gameId"];
    console.log(activeGames.gameId[1]);
    // activeGames[gameId][1].push(socket.id);
    console.log(activeGames);
    socket.join(gameId);
    io.emit('gameNowFull', gameId);
    io.to(gameId).emit('gameStart');
    delete activeGames[gameId];
  });

  // activeGames = {"gameId":["buttonText",[player1, player2]]}

  // update list after player leaves
  socket.on('disconnect', () => {
    console.log('User verlassen: ' + allUsers[socket.id])
    delete allUsers[socket.id];
    if(activeGames["game"+socket.id]==undefined)
    {
      delete activeGames["game"+socket.id];
    }
    io.emit('updatePlayerList', allUsers);
    io.emit('showAllGames', activeGames);
  });
});

// Server port
server.listen(3003, () => {
    console.log('listening on *:3003');
});
