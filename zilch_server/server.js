const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const {registerPlayer, createNewGame, joinRequest, gameFull,
    requestFirstRoll, holdDiceChangeRequest, analyze, rollDice, bankThis, 
    resetAfterBank, zilchThis, newRollDice, leftGame,} = require('./services');

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
        const {allUsers, activeGames} = registerPlayer(user, socket.id);
        io.emit('updatePlayerList', allUsers);
        socket.emit('showAllGames', activeGames);
    });

    // Create new Game
    socket.on('createNewGame', (userGameName) => {
        const {gameParams, activeGames, gameId} = createNewGame(userGameName, socket.id);
        socket.join(gameId);
        socket.emit('joinedGame', gameParams);
        io.emit('showAllGames', activeGames);
    });

    // Leave current Game
    socket.on('leaveGame', (gameId) => {
        socket.leave(gameId);
        socket.to(gameId).emit('leftGame');  // NOT FINISHED, TODO
    });

    // Checking if game is available for 2nd player
    socket.on('joinRequest', (gameId) => {
        if(joinRequest(gameId)){socket.emit('joinRequestAnswer', gameId)};
    });

    // Mark game as full (opened Game got 2nd Player)
    socket.on('gameFull', gameId => {
        const {gameValues, activeGames} = gameFull(gameId, socket.id)
        socket.join(gameId);
        const submit = {"gameValues":gameValues, "gameId":gameId} 
        io.to(gameId).emit('gameStart', submit);
        io.emit('showAllGames', activeGames);
    });

    // First roll requested
    socket.on('requestFirstRoll', (gameId) => {
        const gameValues = requestFirstRoll(gameId);
        io.to(gameId).emit('firstRollToUi', (gameValues));
    });

    // Requested to hold 1 dice
    socket.on('holdDiceChangeRequest', (submit) => {
        const gameId = submit["gameId"];
        const diceIndexToHold = submit["diceIndexToHold"];
        const {controller, session} = holdDiceChangeRequest(gameId, diceIndexToHold, socket.id);
        if(controller){io.to(gameId).emit('confirmHoldChange', session)};
    });

    // Clicked on any dice, analyze if points
    socket.on('analyze', (gameId) => { 
        const gameValues = analyze(gameId, socket.id);
        io.to(gameId).emit('itWasCounted', gameValues);
    });

    // Regular roll of dice after holding & clicking on button
    socket.on('rollDice', (gameId) => {
        const session = rollDice(gameId, socket.id);
        io.to(gameId).emit('unholdDiceRolled', session);
    });

    // Bank rolled points to total points
    socket.on('bankPoints', (gameId) => {
        const submit = bankThis(gameId, socket.id) 
        io.to(gameId).emit('bankPoints', submit);
    });

    // Reset game attr after banking points
    socket.on('resetAfterBank', gameId => {
        const gameValues = resetAfterBank(gameId, socket.id);
        io.to(gameId).emit('resetAfterBankOk', gameValues);
    });

    // Reqest of reset classes & initial countings for each dice
    socket.on('zilch', (gameId) => {
        const gameValues = zilchThis(gameId, socket.id);
        console.log("Game Values = " + gameValues);
        if(gameValues!=undefined){io.to(gameId).emit('zilchOk', gameValues)};
    });

    // Request to switch player
    socket.on('newRoll', gameId => {
        const gameValues = newRollDice(gameId, socket.id);
        io.to(gameId).emit('newRollOk', gameValues);
    });

    // update list after player leaves
    socket.on('disconnect', () => {
        const {allUsers, activeGames} = leftGame(socket.id)
        io.emit('updatePlayerList', allUsers);
        io.emit('showAllGames', activeGames);
    });
});

// Server port
server.listen(3003, () => {
    console.log('listening on *:3003');
});