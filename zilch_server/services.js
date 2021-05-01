const allUsers = new Object();
const activeGames = new Object();
module.exports.allUsers = allUsers;
module.exports.activeGames = activeGames;

module.exports.registerPlayer = function registerPlayer(userName, userId)
{
    allUsers[userId] = userName;
    return {allUsers, activeGames};
}

module.exports.createNewGame = function createNewGame(userGameName, userId)
{
    const gameId = "game" + userId;
    const playerName = allUsers[userId];
    activeGames[gameId] = {"userGameName":userGameName};
    activeGames[gameId]["players"] = [{"name":playerName, "socketId": userId, "currentPlayer":0}];
    console.log("dein spielername in dieser id: " + activeGames[gameId].players[0].name);
    const gameParams = {"gameId": gameId, "name": userGameName};
    activeGames[gameId]["gameFull"] = "notFull";
    return {gameParams, activeGames, gameId};
}

module.exports.joinRequest = function joinRequest(gameId)
{
    for(k in activeGames)
    {
        if(k==gameId)
        {
            return true;
        }
    }
}

module.exports.gameFull = function gameFull(gameId, userId)
{
    const playerName = allUsers[userId];
    console.log("Aktive Spiele anzeigen: " + activeGames);
    console.log("Aktive Spiele anzeigen: " + activeGames[gameId]);
    console.log("Aktive Spiele anzeigen: " + activeGames[gameId].players);
    console.log("Game Id beigetreten: " + gameId);
    activeGames[gameId].players.push({"name":playerName, "socketId": userId, "currentPlayer":1});
    activeGames[gameId]["gameFull"] = "full";
    const gameValues = init(gameId);
    return gameValues;
}

function init(gameId)
{
    const gameValues = {
        "gameCode": gameId,
        "currentPlayerID": 0,
        "player": [
            {
                "playerId": 0,
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
                "playerId": 1,
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

module.exports.requestFirstRoll = function requestFirstRoll(gameId)
{
    console.log("*** request first roll *** + " + getCurrentPlayer(gameId));
    rollUnholdDice(1, gameId);
    return activeGames[gameId].session;
}

function getCurrentPlayer(gameId)
{
    return activeGames[gameId].session.currentPlayerID;
}

function rollUnholdDice(x, gameId)
// function called on game start and eventlistener
// to reroll all not-checked dice ("noHold"), as well called after opponent finished his roll
{
    console.log(activeGames[gameId].session);
    console.log(activeGames[gameId].session.currentPlayerID);
    console.log("roll unhold dice: " + activeGames[gameId].session.currentPlayerID);
    let playerId = getCurrentPlayer(gameId);
    if(x==1)
    //new set of 6 dice
    {
        console.log("*** im rollunhold(1) ***")
        for(let i=0; i<6; i++)
        {
            let newWuerfel = parseInt(Math.random() * 6 + 1);
            activeGames[gameId].session.player[playerId].wurfel[i].augenzahl = newWuerfel;
        }
    }
    //     $("#sondertext").text("");
    //     //check if first roll has nothing: no 1, no 5 and no dice occures more than 2x
    //     let has1or5 = gameValues.player[playerId].wurfel.some(a=>[1,5].includes(a.augenzahl));   // checks if the first roll does not contain 1 and/or 5.
    //     if(has1or5==false)
    //     {
    //         let holdList = [];
    //         let helperList = [];
    //         gameValues.player[playerId].wurfel.forEach(a=>{holdList.push(a.augenzahl)});
    //         for(let i=1;i<7;i++)
    //         {
    //             helperList.push(holdList.filter(a=>a==i).length)
    //         }
    //         let has3idents = helperList.some(a=>[3,4,5,6].includes(a));
    //         if(!has3idents)
    //         {
    //             applyGameValuesToUi(3);
    //             gameValues.player[playerId].momPoints += 500 + gameValues.player[playerId].holdPoints;
    //             $("#punkteAnzeige").text(gameValues.player[playerId].momPoints);
    //             $("#sondertext").text("Du hast NICHTS gewürfelt. Los - nochmal. Gibt 500 extra Looser Punkte");
    //         }
    // }
    // }
    
    if(x==2)
    // called after click on roll button
    {
        console.log("*** im rollUnhold(2) ***");
        const validator = [""];
        activeGames[gameId].session.player[playerId].wurfel.forEach(a=>{if(a.counted==false&&a.hold==true){validator.push("stop")}});
        let holdLockedCounter = 0;
        activeGames[gameId].session.player[playerId].wurfel.forEach(a=>(a.hold==true ? holdLockedCounter += 1 : 0));
        activeGames[gameId].session.player[playerId].wurfel.forEach(a=>(a.locked==true ? holdLockedCounter += 1 : 0));
        console.log("hold + locked: " + holdLockedCounter)
        if(activeGames[gameId].session.player[playerId].nextRollOK != true)
        {
            console.log("Du darfst Würfel ohne Punkteeinfluss nicht halten");
            activeGames[gameId].session.player[playerId].wurfel.forEach(a=>{if(a.hold==true&&a.counted==true){a.counted==false}});
            return;
        }
        else if(validator.includes("stop"))
        {
            console.log("Das geht so nicht!");
            return;
        }
        else if(activeGames[gameId].session.player[playerId].wurfel.every(a=>a.hold==false)||activeGames[gameId].session.player[playerId].momPoints==0)    // checks if any dice is on hold
        {
            console.log("Du kannst nicht würfeln ohne zu halten");
            return;
        }
        else if(holdLockedCounter==6)
        {
            activeGames[gameId].session.player[playerId].holdPoints += activeGames[gameId].session.player[playerId].momPoints;
            activeGames[gameId].session.player[playerId].wurfel.forEach(a=> {a.hold=false;a.locked=false});
            rollUnholdDice(1, gameId); // TODO, think is not working atm
            return;
        }
        else
        {
            activeGames[gameId].session.player[playerId].holdPoints += activeGames[gameId].session.player[playerId].momPoints;
            activeGames[gameId].session.player[playerId].momPoints = 0;
            (activeGames[gameId].session.player[playerId].wurfel).forEach((a,i) => {
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
