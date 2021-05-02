const allUsers = new Object();
const activeGames = new Object();

// *** Example of game values structure
    // activeGames = {[gameId]:{"userGameName":gameName,
    //  "players":[{"name":playerName,"socketId":socketId, "currentPlayer": 0}], "session": gameParams, "gameFull": full/notFull}}


module.exports.registerPlayer = function registerPlayer(userName, userId)
{
    allUsers[userId] = userName;
    return {allUsers, activeGames};
};

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
};

module.exports.joinRequest = function joinRequest(gameId)
{
    for(k in activeGames)
    {
        if(k==gameId)
        {
            return true;
        }
    }
};

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
    return {gameValues, activeGames};
};

module.exports.requestFirstRoll = function requestFirstRoll(gameId)
{
    console.log("*** request first roll *** + " + getCurrentPlayer(gameId));
    rollUnholdDice(1, gameId);
    return activeGames[gameId].session;
};

module.exports.holdDiceChangeRequest = function holdDiceChangeRequest(gameId, diceIndexToHold, userId)
{
    const playerId = getCurrentPlayer(gameId);
    console.log("diceindextohold: " + diceIndexToHold);
    console.log("gameId: " + gameId)
    console.log("player id: " + playerId);
    if(isItMyTurn(gameId, userId))
    {
        if(activeGames[gameId].session.player[playerId].wurfel[diceIndexToHold].locked != true)
        {
            activeGames[gameId].session.player[playerId].wurfel[diceIndexToHold].hold = !activeGames[gameId].session.player[playerId].wurfel[diceIndexToHold].hold;
            const session = activeGames[gameId].session;
            return {"controller": true, session};
        }
    }
    else
    {
        const session = activeGames[gameId].session;
        return {"controller": false, session};
    };
};

module.exports.analyze = function analyze(gameId, userId)
{
    if(isItMyTurn(gameId, userId))
    {
        calculate(gameId);
        // activeGames[gameId].session.player[0] // USELESS? IF CODE WORKING, DELETE
        // return activeGames[gameId].session; // testing if needed, maybe working without else
    }
    return activeGames[gameId].session;
};

module.exports.rollDice = function rollDice(gameId, userId)
{
    if(isItMyTurn(gameId, userId)){rollUnholdDice(2, gameId)};
    return activeGames[gameId].session; 
};

module.exports.bankThis = function bankThis(gameId, userId)
{
    let result = 0;
    if(isItMyTurn(gameId, userId))
    {
        result = bank(gameId);
    };
    return {"result":result, "gameValues": activeGames[gameId].session}
};

module.exports.resetAfterBank = function resetAfterBank(gameId, userId)
{
    if(isItMyTurn(gameId, userId))
    {
        const playerId = getCurrentPlayer(gameId);
        activeGames[gameId].session.player[playerId].momPoints = 0;
        activeGames[gameId].session.player[playerId].holdPoints = 0;
        activeGames[gameId].session.player[playerId].wurfel
            .forEach(a=> {a.hold=false;a.locked=false;a.counted=false});
    };
    return activeGames[gameId].session;
};

module.exports.zilchThis = function zilchThis(gameId, userId)
{
    if(isItMyTurn(gameId, userId))
    {
        const playerId = getCurrentPlayer(gameId);
        activeGames[gameId].session.player[playerId].momPoints = 0;
        activeGames[gameId].session.player[playerId].holdPoints = 0;
        activeGames[gameId].session.player[playerId].durchgang += 1;
        for(let i=0;i<2;i++)
        {
            activeGames[gameId].session.player[i].wurfel
                .forEach(a=> {a.hold=false;a.locked=false;a.counted=false});
        }
        switchCurrentPlayer(gameId);
    }
    return activeGames[gameId].session;
};

module.exports.newRollDice = function newRollDice(gameId, userId)
{
    if(isItMyTurn(gameId, userId))
    {
        rollUnholdDice(1, gameId);
    }    
    return activeGames[gameId].session;
};

module.exports.leftGame = function leftGame(userId)
{
    console.log('User verlassen: ' + allUsers[userId])
    delete allUsers[userId];
    const gameName = "game" + userId;
    if(activeGames[gameName]!=undefined)
    {
        console.log("Spiel noch im Dict. drin: " + gameName);
        delete activeGames[gameName];
        console.log("Spiel jetzt gelöscht: " + gameName)
    };
    return {allUsers, activeGames}
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
};

function getCurrentPlayer(gameId)
{
    return activeGames[gameId].session.currentPlayerID;
};

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
};

function isItMyTurn(gameId, userId)
{
    const currentPlayer = getCurrentPlayer(gameId);
    return activeGames[gameId].session.player[currentPlayer].socketId == userId;
};

function calculate(gameId)
// is called any time a dice is selected or unselected and analyzes the mom points
{
    console.log("analyze: " + activeGames[gameId].session.currentPlayerID)
    const playerId = getCurrentPlayer(gameId);
    activeGames[gameId].session.player[playerId].momPoints = 0;
    activeGames[gameId].session.player[playerId].nextRollOK = true;
    const holdDiceWithOccurence = activeGames[gameId].session.player[playerId].wurfel
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
                activeGames[gameId].session.player[playerId].momPoints += 100 * y;
                validateAsCounted(k, gameId, playerId)
                break;
            case "5":
                activeGames[gameId].session.player[playerId].momPoints += 50 * y;
                validateAsCounted(k, gameId, playerId)
                break;
        }
        if(y!=0)
        {
            let holdDice = [];
            for(let j=0;j<6;j++)
            {
                if(activeGames[gameId].session.player[playerId].wurfel[j].hold == true)
                {
                    holdDice.push(activeGames[gameId].session.player[playerId].wurfel[j].augenzahl);
                }
            }

            let isStreet = [1,2,3,4,5,6].every((val,ind)=>val===holdDice[ind])        // checks if user rolled a straight 1-6 == 2000 points

            if(isStreet)
            {
                activeGames[gameId].session.player[playerId].momPoints = 2000;
            }
        }
        if(y>2 && y<6)
        {
            switch(k)
            {
                case "1":
                    activeGames[gameId].session.player[playerId].momPoints += 700;
                    validateAsCounted(k, gameId, playerId);
                    break;
                case "2":
                    activeGames[gameId].session.player[playerId].momPoints += 200;
                    if(y==4||y==5){activeGames[gameId].session.player[playerId].nextRollOK = false};
                    validateAsCounted(k, gameId, playerId);
                    break;
                case "3":
                    activeGames[gameId].session.player[playerId].momPoints += 300;
                    if(y==4||y==5){activeGames[gameId].session.player[playerId].nextRollOK = false};
                    validateAsCounted(k, gameId, playerId);
                    break;
                case "4":
                    activeGames[gameId].session.player[playerId].momPoints += 400;
                    if(y==4||y==5){activeGames[gameId].session.player[playerId].nextRollOK = false};
                    validateAsCounted(k, gameId, playerId);
                    break;
                case "5":
                    activeGames[gameId].session.player[playerId].momPoints += 350;
                    validateAsCounted(k, gameId, playerId);
                    break;
                case "6":
                    activeGames[gameId].session.player[playerId].momPoints += 600;
                    if(y==4||y==5){activeGames[gameId].session.player[playerId].nextRollOK = false};
                    validateAsCounted(k, gameId, playerId);
                    break;
            }
        }
        else if(y==6)
        {
            switch(k)
            {
                case "1":
                    activeGames[gameId].session.player[playerId].momPoints = 2000;
                    break;
                case "2":
                    activeGames[gameId].session.player[playerId].momPoints = 400;
                    break;
                case "3":
                    activeGames[gameId].session.player[playerId].momPoints = 600;
                    break;
                case "4":
                    activeGames[gameId].session.player[playerId].momPoints = 800;
                    break;
                case "5":
                    activeGames[gameId].session.player[playerId].momPoints = 1000;
                    break;
                case "6":
                    activeGames[gameId].session.player[playerId].momPoints = 1200;
                    break;
            }
        }
    }
};

function validateAsCounted(x, gameId, playerId)
{
    activeGames[gameId].session.player[playerId].wurfel.forEach(a=>{if(a.hold==true && a.augenzahl==x){a.counted=true}});
};

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
            activeGames[gameId].session.player[playerId].durchgang += 1;
            switchCurrentPlayer(gameId);
            return 4;
        }
    }
};

function switchCurrentPlayer(gameId)
{
    activeGames[gameId].session.currentPlayerID = activeGames[gameId].session.currentPlayerID==0 ? 1 : 0;
};