const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const allUsers = new Object();
const activeGames = new Object();


// *** Example of game values structure
// activeGames = {[gameId]:{"userGameName":gameName,
//  "players":[{"name":playerName,"socketId":socketId, "currentPlayer": 0}], "session": gameParams, "gameFull": full/notFull}}

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
    const playerName = allUsers[socket.id];
    socket.join(gameId);
    activeGames[gameId] = {"userGameName":userGameName};
    activeGames[gameId]["players"] = [{"name":playerName, "socketId": socket.id, "currentPlayer":0}];
    console.log("dein spielername in dieser id: " + activeGames[gameId].players[0].name);
    const gameParams = {"gameId": gameId, "name": userGameName};
    activeGames[gameId]["gameFull"] = "notFull";
    socket.emit('joinedGame', gameParams);
    io.emit('showAllGames', activeGames);
  });

  // Leave current Game
  socket.on('leaveGame', (gameId) => {
    socket.leave(gameId);
    socket.to(gameId).emit('leftGame');
  });

  // Checking if game is available for 2nd player
    socket.on('joinRequest', (gameId) => {
        for(k in activeGames)
        {
            if(k==gameId)
            {
                console.log("game id vorhanden: " + gameId + ", k: " + k + ". Einstieg ins Spiel möglich");
                socket.emit('joinRequestAnswer', gameId);
            }
        }
    });

  // Mark game as full (opened Game got 2nd Player)
  socket.on('gameFull', (submit) => {
    const playerName = allUsers[socket.id];
    const gameId = submit["gameId"];
    console.log("Aktive Spiele anzeigen: " + activeGames);
    console.log("Game Id beigetreten: " + gameId);
    activeGames[gameId].players.push({"name":playerName, "socketId": socket.id, "currentPlayer":1});
    console.log("dein spielername in dieser id: " + activeGames[gameId].players[1].name);
    socket.join(gameId);
    io.emit('gameNowFull', gameId);
    io.to(gameId).emit('gameStart', gameId);
    activeGames[gameId]["gameFull"] = "full";
    console.log(activeGames[gameId].gameFull);
    io.emit('showAllGames', activeGames);
  });

  // Init values
    socket.on('init', (gameId) => {
        const mySocketId = socket.id;
        const gameValues = init(gameId, mySocketId); 
        io.to(gameId).emit('nameToCountTable', gameValues);
  });

    // First roll requested
    socket.on('requestFirstRoll', (gameId) => {
        rollUnholdDice(1, gameId);
        const firstRollValues = activeGames[gameId].session;
        io.to(gameId).emit('firstRollToUi', (firstRollValues));
    });

    // Requested to hold 1 dice
    socket.on('holdDiceChangeRequest', (submit) => {
        console.log("*** im hold changer *** ");
        const diceIndexToHold = submit["diceIndexToHold"];
        console.log("diceindextohold: " + diceIndexToHold);
        const gameId = submit["gameId"];
        console.log("gameId: " + gameId)
        const playerId = getCurrentPlayer(gameId);
        console.log("player id: " + playerId);
        if(isItMyTurn(gameId, socket.id))
        {
            if(activeGames[gameId].session.player[playerId].wurfel[diceIndexToHold].locked != true)
            {
                activeGames[gameId].session.player[playerId].wurfel[diceIndexToHold].hold = !activeGames[gameId].session.player[playerId].wurfel[diceIndexToHold].hold;
            };
            io.to(gameId).emit('confirmHoldChange', (activeGames[gameId].session));
        };
    });

    // Clicked on any dice, analyze if points
    socket.on('analyze', (gameId) => {
        if(isItMyTurn(gameId, socket.id))
        {
            analyze(gameId);
            io.to(gameId).emit('itWasCounted', (activeGames[gameId].session));
        };
    });

    // Regular roll of dice after holding & clicking on button
    socket.on('rollDice', (gameId) => {
        if(isItMyTurn(gameId, socket.id))
        {
            rollUnholdDice(2, gameId);
            io.to(gameId).emit('unholdDiceRolled', (activeGames[gameId].session));
        }
    })

    // Bank rolled points to total points
    socket.on('bankPoints', (gameId) => {
        console.log("bank points: " + activeGames[gameId].session.currentPlayerID)
        if(isItMyTurn(gameId, socket.id))
        {
            const result = bank(gameId);
            const submit = {"gameValues": activeGames[gameId].session, "result":result}
            io.to(gameId).emit('bankPoints', submit);
        }
    })

    // Reqest of reset classes & initial countings for each dice
    socket.on('zilch', (gameId) => {
        console.log("socket on zilch: " + activeGames[gameId].session.currentPlayerID)
        if(isItMyTurn(gameId, socket.id))
        {
            zilch(gameId);
            io.to(gameId).emit('nextPlayer', (activeGames[gameId].session));
        }
    });

    // update list after player leaves
    socket.on('disconnect', () => {
    console.log('User verlassen: ' + allUsers[socket.id])
    delete allUsers[socket.id];
    const gameName = "game" + socket.id;
    if(activeGames[gameName]!=undefined)
    {
        console.log("Spiel noch im Dict. drin: " + gameName);
        delete activeGames[gameName];
        console.log("Spiel jetzt gelöscht: " + gameName)
    }
    io.emit('updatePlayerList', allUsers);
    io.emit('showAllGames', activeGames);
    });
});

// Server port
server.listen(3003, () => {
    console.log('listening on *:3003');
});

/// *** GAME LOGIC STARTS

function isItMyTurn(gameId, socketId)
{
    console.log("is it my turn: " + activeGames[gameId].session.currentPlayerID)
    const currentPlayer = activeGames[gameId].session.currentPlayerID;
    return activeGames[gameId].session.player[currentPlayer].socketId == socketId;
}

function init(gameId)
{
    const gameValues = {
        "gameCode": gameId,
        "currentPlayerID": 0,
        "player": [
            {
                "playerID": 0,
                "name": activeGames[gameId].players[0].name,
                "socketId": activeGames[gameId].players[0].socketId,
                "momPoints": 0,
                "holdPoints": 0,
                "totalPoints": 0,
                "durchgang": 0,
                "nextRollOK":true,
                "wurfel": [
                    {"augenzahl": 2, "hold": false, "locked": false, "counted": false}, // dice 1-6
                    {"augenzahl": 2, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 5, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 4, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 1, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 5, "hold": false, "locked": false, "counted": false}
                ]
            },
            {
                "playerID": 1,
                "name": activeGames[gameId].players[1].name,
                "socketId": activeGames[gameId].players[1].socketId,
                "momPoints": 0,
                "holdPoints": 0,
                "totalPoints": 0,
                "durchgang": 0,
                "nextRollOK":true,
                "wurfel": [
                    {"augenzahl": 1, "hold": false, "locked": false, "counted": false}, // dice 1-6
                    {"augenzahl": 1, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 1, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 1, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 1, "hold": false, "locked": false, "counted": false},
                    {"augenzahl": 1, "hold": false, "locked": false, "counted": false}
                ]
            }
        ]
    };
    activeGames[gameId].session = gameValues;
    return gameValues;
}

function getCurrentPlayer(gameId)
{
    return activeGames[gameId].session.currentPlayerID;
}

function switchCurrentPlayer(gameId)
{
    console.log("switch current player: " + activeGames[gameId].session.currentPlayerID)
    activeGames[gameId].session.currentPlayerID = activeGames[gameId].session.currentPlayerID==0 ? 1 : 0;
    console.log("Jetzt an der Reihe: " + activeGames[gameId].session.currentPlayerID);
}

function rollUnholdDice(x, gameId)
// function called on game start and eventlistener
// to reroll all not-checked dice ("noHold"), as well called after opponent finished his roll
{
    console.log(activeGames[gameId].session);
    console.log(activeGames[gameId].session.currentPlayerID);
    console.log("roll unhold dice: " + activeGames[gameId].session.currentPlayerID)

    let playerID = getCurrentPlayer(gameId);
    if(x==1)
    //new set of 6 dice
    {
        console.log("*** im rollunhold(1) ***")
        for(let i=0; i<6; i++)
        {
            let newWuerfel = parseInt(Math.random() * 6 + 1);
            activeGames[gameId].session.player[playerID].wurfel[i].augenzahl = newWuerfel;
        }
    }
    //     $("#sondertext").text("");
    //     //check if first roll has nothing: no 1, no 5 and no dice occures more than 2x
    //     let has1or5 = gameValues.player[playerID].wurfel.some(a=>[1,5].includes(a.augenzahl));   // checks if the first roll does not contain 1 and/or 5.
    //     if(has1or5==false)
    //     {
    //         let holdList = [];
    //         let helperList = [];
    //         gameValues.player[playerID].wurfel.forEach(a=>{holdList.push(a.augenzahl)});
    //         for(let i=1;i<7;i++)
    //         {
    //             helperList.push(holdList.filter(a=>a==i).length)
    //         }
    //         let has3idents = helperList.some(a=>[3,4,5,6].includes(a));
    //         if(!has3idents)
    //         {
    //             applyGameValuesToUi(3);
    //             gameValues.player[playerID].momPoints += 500 + gameValues.player[playerID].holdPoints;
    //             $("#punkteAnzeige").text(gameValues.player[playerID].momPoints);
    //             $("#sondertext").text("Du hast NICHTS gewürfelt. Los - nochmal. Gibt 500 extra Looser Punkte");
    //         }
        // }
    // }

    if(x==2)
    // called after click on roll button
    {
        console.log("*** im rollUnhold(2) ***");
        const validator = [""];
        activeGames[gameId].session.player[playerID].wurfel.forEach(a=>{if(a.counted==false&&a.hold==true){validator.push("stop")}});
        let holdLockedCounter = 0;
        activeGames[gameId].session.player[playerID].wurfel.forEach(a=>(a.hold==true ? holdLockedCounter += 1 : 0));
        activeGames[gameId].session.player[playerID].wurfel.forEach(a=>(a.locked==true ? holdLockedCounter += 1 : 0));
        console.log("hold + locked: " + holdLockedCounter)
        if(activeGames[gameId].session.player[playerID].nextRollOK != true)
        {
            console.log("Du darfst Würfel ohne Punkteeinfluss nicht halten");
            activeGames[gameId].session.player[playerID].wurfel.forEach(a=>{if(a.hold==true&&a.counted==true){a.counted==false}});
            return;
        }
        else if(validator.includes("stop"))
        {
            console.log("Das geht so nicht!");
            return;
        }
        else if(activeGames[gameId].session.player[playerID].wurfel.every(a=>a.hold==false)||activeGames[gameId].session.player[playerID].momPoints==0)    // checks if any dice is on hold
        {
            console.log("Du kannst nicht würfeln ohne zu halten");
            return;
        }
        else if(holdLockedCounter==6)
        {
            activeGames[gameId].session.player[playerID].holdPoints += activeGames[gameId].session.player[playerID].momPoints;
            activeGames[gameId].session.player[playerID].wurfel.forEach(a=> {a.hold=false;a.locked=false});
            rollUnholdDice(1); // TODO, think is not working atm
            return;
        }
        else
        {
            activeGames[gameId].session.player[playerID].holdPoints += activeGames[gameId].session.player[playerID].momPoints;
            activeGames[gameId].session.player[playerID].momPoints = 0;
            (activeGames[gameId].session.player[playerID].wurfel).forEach((a,i) => {
                if(a.hold == false && a.locked == false)
                {
                    a.augenzahl = parseInt(Math.random() * 6 + 1);
                }
                else if(a.hold == true)
                {
                    a.hold = false;
                    a.locked = true;
                }
            })
        }
    }
}

function validateAsCounted(x, gameId, playerID)
{
    activeGames[gameId].session.player[playerID].wurfel.forEach(a=>{if(a.hold==true && a.augenzahl==x){a.counted=true}});
}

function analyze(gameId)
// is called any time a dice is selected or unselected and analyzes the mom points
{
    console.log("analyze: " + activeGames[gameId].session.currentPlayerID)
    const playerID = getCurrentPlayer(gameId);
    activeGames[gameId].session.player[playerID].momPoints = 0;
    activeGames[gameId].session.player[playerID].nextRollOK = true;
    const holdDiceWithOccurence = activeGames[gameId].session.player[playerID].wurfel
        .filter(wurfel=>wurfel.hold)
        .reduce((holdDiceMap,wurfel)=>{
            holdDiceMap[wurfel.augenzahl] += 1;
        return holdDiceMap;
    },{1:0,2:0,3:0,4:0,5:0,6:0})
    for(k in holdDiceWithOccurence)
    {
        let y = holdDiceWithOccurence[k]; // y for readability - gives the occurence of one specific dice as number
        switch(k)
        {
            case "1":
                activeGames[gameId].session.player[playerID].momPoints += 100 * y;
                validateAsCounted(k, gameId, playerID)
                break;
            case "5":
                activeGames[gameId].session.player[playerID].momPoints += 50 * y;
                validateAsCounted(k, gameId, playerID)
                break;
        }
        if(y!=0)
        {
            let holdDice = [];
            for(let j=0;j<6;j++)
            {
                if(activeGames[gameId].session.player[playerID].wurfel[j].hold == true)
                {
                    holdDice.push(activeGames[gameId].session.player[playerID].wurfel[j].augenzahl);
                }
            }

            let isStreet = [1,2,3,4,5,6].every((val,ind)=>val===holdDice[ind])        // checks if user rolled a straight 1-6 == 2000 points

            if(isStreet)
            {
                activeGames[gameId].session.player[playerID].momPoints = 2000;
            }
        }
        if(y>2 && y<6)
        {
            switch(k)
            {
                case "1":
                    activeGames[gameId].session.player[playerID].momPoints += 700;
                    validateAsCounted(k, gameId, playerID);
                    break;
                case "2":
                    activeGames[gameId].session.player[playerID].momPoints += 200;
                    if(y==4||y==5){activeGames[gameId].session.player[playerID].nextRollOK = false};
                    validateAsCounted(k, gameId, playerID);
                    break;
                case "3":
                    activeGames[gameId].session.player[playerID].momPoints += 300;
                    if(y==4||y==5){activeGames[gameId].session.player[playerID].nextRollOK = false};
                    validateAsCounted(k, gameId, playerID);
                    break;
                case "4":
                    activeGames[gameId].session.player[playerID].momPoints += 400;
                    if(y==4||y==5){activeGames[gameId].session.player[playerID].nextRollOK = false};
                    validateAsCounted(k, gameId, playerID);
                    break;
                case "5":
                    activeGames[gameId].session.player[playerID].momPoints += 350;
                    validateAsCounted(k, gameId, playerID);
                    break;
                case "6":
                    activeGames[gameId].session.player[playerID].momPoints += 600;
                    if(y==4||y==5){activeGames[gameId].session.player[playerID].nextRollOK = false};
                    validateAsCounted(k, gameId, playerID);
                    break;
            }
        }
        else if(y==6)
        {
            switch(k)
            {
                case "1":
                    activeGames[gameId].session.player[playerID].momPoints = 2000;
                    break;
                case "2":
                    activeGames[gameId].session.player[playerID].momPoints = 400;
                    break;
                case "3":
                    activeGames[gameId].session.player[playerID].momPoints = 600;
                    break;
                case "4":
                    activeGames[gameId].session.player[playerID].momPoints = 800;
                    break;
                case "5":
                    activeGames[gameId].session.player[playerID].momPoints = 1000;
                    break;
                case "6":
                    activeGames[gameId].session.player[playerID].momPoints = 1200;
                    break;
            }
        }
    }
}

function zilch(gameId) // reset classes and countings of round
{
    console.log("zilch funct: " + activeGames[gameId].session.currentPlayerID)
    let playerId = getCurrentPlayer(gameId);
    activeGames[gameId].session.player[playerId].momPoints = 0;
    activeGames[gameId].session.player[playerId].holdPoints = 0;
    activeGames[gameId].session.player[playerId].wurfel
        .forEach(a=> {a.hold=false;a.locked=false;a.counted=false});
    activeGames[gameId].session.player[playerId].durchgang += 1;
    switchCurrentPlayer(gameId);
    rollUnholdDice(1, gameId);
}

function bank(gameId)
{
    console.log("*** in Bank function ***");
    console.log("bank funct: " + activeGames[gameId].session.currentPlayerID)
    let playerId = getCurrentPlayer(gameId);
    let tot = activeGames[gameId].session.player[playerId].totalPoints;
    let hold = activeGames[gameId].session.player[playerId].holdPoints;
    let mom = activeGames[gameId].session.player[playerId].momPoints;
    if(mom==0)
    {
        console.log("Du kannst nicht schreiben ohne erst Punkte zu halten");
        return 1;
    }
    else if((hold+mom)<400)
    {
        console.log("Du kannst weniger als 400 Punkte nicht schreiben");
        return 2;
    }
    else
    {
        activeGames[gameId].session.player[playerId].durchgang += 1;
        tot += hold + mom;
        activeGames[gameId].session.player[playerId].totalPoints = tot;
        if(tot >= 10000)
        {
            console.log("Du hast gewonnen, mehr als 10'000 Pkte");
            tot = 0;
            return 3;
        }
        else
        {
            console.log("Punkte werden angeschrieben");
            return 4;
        }
    }
};
