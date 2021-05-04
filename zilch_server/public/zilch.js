// Sockets

let socket = io();

$('#nameForm').on('submit', (e) => {
  e.preventDefault();
  let name = document.getElementById('nameInput').value;
  if(name!="") {
    socket.emit('registerPlayer', name);
  };
});

socket.on('updatePlayerList', (msg) => {
  $('#playerOnlineList').html('<tr><th>Name</th><th>Socket ID</td></tr>');
  for(k in msg)
  {
    $('#playerOnlineList tr:last').after('<tr><td>'+msg[k]+'</td><td>'+k);
  };
  location.hash = 'lobby';
});

socket.on('showAllGames', (activeGames) => {
    $('#availableGames').empty();
    for(k in activeGames)
    {
        if(activeGames[k].gameFull=="notFull")
        {
            const newGameButton = document.createElement('button');
            newGameButton.setAttribute('onclick', 'joinThisGame("' + k + '")');
            newGameButton.setAttribute('id', k);
            newGameButton.innerHTML = activeGames[k]["userGameName"];
            $('#availableGames').append(newGameButton);
        }
    };
});

socket.on('joinedGame', (gameId) => {
  console.log("Du bist jetzt im Raum: " + gameId["gameId"] + " " + gameId["name"]);
  location.hash = 'game';
  const newLeaveButton = document.createElement('button');
  newLeaveButton.innerHTML = "Dieses Spiel beenden";
  newLeaveButton.setAttribute('onclick', 'leaveGame(' + gameId + ')');
  $('#leaveGameButton').append(newLeaveButton);
});

socket.on('leftGame', () => {
  console.log("Du hast das Spiel verlassen, zurück zur Lobby");
  location.hash = 'lobby';
});

socket.on('joinRequestAnswer', (gameId) => {
    console.log("Du darfst dem Spiel beitreten: " + gameId);
    const newLeaveButton = document.createElement('button');
    newLeaveButton.innerHTML = "Dieses Spiel beenden";
    newLeaveButton.setAttribute('onclick', 'leaveGame("' + gameId + '")');
    $('#leaveGameButton').append(newLeaveButton);
    socket.emit('gameFull', gameId);
});

socket.on('gameStart', (submit) => {
  alert("Dein Spiel startet");
  toSessionStorage(submit["gameValues"]);
  const gameValues = submit["gameValues"];
  $("#namePlayer1").text(gameValues.player[0].name);
  $("#namePlayer2").text(gameValues.player[1].name);
  socket.emit('requestFirstRoll', submit["gameId"]);
});

socket.on('firstRollToUi', (thisRoll) => {
    toSessionStorage(thisRoll);
    const activePlayer = thisRoll.currentPlayerID;
    const activePlayerName = thisRoll.player[activePlayer].name;
    $("#spielerName1").text(activePlayerName);
    for(let i=0; i<6; i++)
    {
        let dice = thisRoll.player[activePlayer].wurfel[i].augenzahl;
        assignNewPic(i, dice);
    };
    if(thisRoll.player[activePlayer].nothing)
    {
        $("#punkteAnzeige").text(thisRoll.player[activePlayer].momPoints+thisRoll.player[activePlayer].holdPoints);
        $("#sondertext").text("Du hast NICHTS gewürfelt. Los - nochmal. Gibt 500 extra Looser Punkte");
        toSessionStorage(thisRoll);
        applyGameValuesToUi();
    };
    let myId = socket.id==thisRoll.player[0].socketId ? 0 : 1;
    console.log("meine id: " + myId);
    sessionStorage.setItem("myId", myId);
    if(socket.id!=thisRoll.player[activePlayer].socketId){$('#knopf1, #knopf2, #knopf3').hide()}
    else{$('#knopf1, #knopf2, #knopf3').show()};
});

socket.on('confirmHoldChange', thisRoll => {
    toSessionStorage(thisRoll);
    applyGameValuesToUi();
});

socket.on('itWasCounted', (thisRoll) => {
    toSessionStorage(thisRoll);
    let playerID = currentPlayerId();
    let gameValues = fromSessionStorage();
    $("#punkteAnzeige").text(gameValues.player[playerID].momPoints+gameValues.player[playerID].holdPoints);
})

socket.on('unholdDiceRolled', (thisRoll) => {
    toSessionStorage(thisRoll);
    $("#sondertext").text("");
    newDicePics()
});

socket.on('bankPoints', (submit) => {
    const playerId = currentPlayerId(); // Get old player ID to assign new values to table
    toSessionStorage(submit["gameValues"]);
    const gameValues = fromSessionStorage();
    const result = submit["result"];
    const points = (gameValues.player[playerId].momPoints
        + gameValues.player[playerId].holdPoints);
    const tot = gameValues.player[playerId].totalPoints;
    if(result==0){
        alert("Du Schlingel. Du bist nicht dran.");
    }
    else if(result==1){
        alert("Schreiben ohne Punkte nicht möglich");
    }
    else if(result==2){
        alert("Weniger als 400 Punkte kann man nicht schreiben");
    }
    else if(result==3){
        alert("Gewonnen, mehr als 10'000 Punkte");
    }
    else if(result==4){
        const durchg = gameValues.player[playerId].durchgang;
        $("#punkteTabelle"+playerId+ " tr:last").after("<tr><td>"
            + durchg + "</td><td>" + points + "</td><td>" + tot + "</td>");
        resetAfterBank();
    };
});

socket.on('resetAfterBankOk', (thisRoll) => {
    toSessionStorage(thisRoll);
    applyGameValuesToUi();
    $("#sondertext").text("");
    newRoll();
});

socket.on('newRollOk', (thisRoll) => {
    toSessionStorage(thisRoll);
    newDicePics();
    const activePlayer = thisRoll.currentPlayerID;
    const activePlayerName = thisRoll.player[activePlayer].name;
    $("#spielerName1").text(activePlayerName);
    if(thisRoll.player[activePlayer].nothing)
    {
        thisRoll.player[activePlayer].momPoints += 500 + thisRoll.player[activePlayer].holdPoints;
        $("#punkteAnzeige").text(thisRoll.player[activePlayer].momPoints);
        $("#sondertext").text("Du hast NICHTS gewürfelt. Los - nochmal. Gibt 500 extra Looser Punkte");
        thisRoll.player[activePlayer].wurfel.forEach(a=>{a.hold=true});
        console.log(thisRoll.player[activePlayer].wurfel);
        for(let i=0; i<6;i++){$($("div img")[i]).addClass("hold");}
        toSessionStorage(thisRoll);
        applyGameValuesToUi();
    };
    if(socket.id!=thisRoll.player[activePlayer].socketId){$('#knopf1, #knopf2, #knopf3').hide()}
    else{$('#knopf1, #knopf2, #knopf3').show()};
});

socket.on('zilchOk', (thisRoll) => {
    const playerId = currentPlayerId();
    const playerId2 = playerId==0 ? 1 : 0;
    const tot = thisRoll.player[playerId].totalPoints;
    const durchg = thisRoll.player[playerId].durchgang;
    toSessionStorage(thisRoll);
    applyGameValuesToUi();
    newDicePics();
    $("spielerName1").text(thisRoll.player[playerId2].name);
    $("#punkteTabelle"+playerId+ " tr:last").after("<tr><td>"
        + durchg + "</td><td> Zilch </td><td>"
        + tot +"</td>");
    $("#sondertext").text("");
    newRoll();
});

//<------------------------------------------------------------------------>

function newDicePics()
{
    const gameValues = fromSessionStorage();
    const activePlayer = currentPlayerId();
    for(let i=0; i<6; i++)
    {
        let dice = gameValues.player[activePlayer].wurfel[i].augenzahl;
        assignNewPic(i, dice);
        applyGameValuesToUi();
    };
}

function bilder(x)
// provides link to the pictures needed to display
{
    switch(x)
    {
        case 1:
            return "one.png";
            case 2:
            return "two.png";
        case 3:
            return "three.png";
        case 4:
            return "four.png";
        case 5:
            return "five.png";
        case 6:
            return "six.png";
    }
};

function getWuerfelIDs()
// adds dice dictionary to DOM
{
    let wuerfelIDs = {"wuerfelEins":1,"wuerfelZwei":2,"wuerfelDrei":3,"wuerfelVier":4,"wuerfelFuenf":5,"wuerfelSechs":6};
    return wuerfelIDs;
};

function assignNewPic(i, x)
// is called if a new assignment of picture is needed
{
    const counters = ["Eins", "Zwei", "Drei", "Vier", "Fuenf", "Sechs"];
    $("#wuerfel" + counters[i]).attr("src", bilder(x));
};

function myPlayerId()
{
    return sessionStorage.getItem("myId");
};

function currentPlayerId()
{
    return JSON.parse(sessionStorage.gameValues).currentPlayerID;
};

function myGameId()
{
    return JSON.parse(sessionStorage.gameValues).gameCode;
};

function toSessionStorage(thisRoll)
{
    sessionStorage.setItem("gameValues", JSON.stringify(thisRoll));
};

function fromSessionStorage()
{
    return JSON.parse(sessionStorage.gameValues)
}

function holdListener()
// registers a listener to the document - needed for each click on a dice
{
    $("div img").click(event => {
        const gameId = myGameId();
        const wuerfelIDs = {"wuerfelEins":1,"wuerfelZwei":2,"wuerfelDrei":3,
        "wuerfelVier":4,"wuerfelFuenf":5,"wuerfelSechs":6};
        const imgID = event.target.id;
        const diceIndexToHold = (wuerfelIDs[imgID]-1)
        const submit = {"gameId": gameId, "diceIndexToHold": diceIndexToHold}
        socket.emit('holdDiceChangeRequest', submit);
    });
};

function applyGameValuesToUi()
{
    let playerID = currentPlayerId();
    let gameValues = fromSessionStorage();
    for(let i=0;i<6;i++)
    {
        let holdClass = gameValues.player[playerID].wurfel[i].hold;
        if(holdClass){
            $($("div img")[i]).addClass("hold")
        }
        else{
            $($("div img")[i]).removeClass("hold")
        };

        let lockedClass = gameValues.player[playerID].wurfel[i].locked;
        if(lockedClass){
            $($("div img")[i]).addClass("locked")
        }
        else{
            $($("div img")[i]).removeClass("locked")
        };
        let countedClass = gameValues.player[playerID].wurfel[i].counted; 
        if(countedClass){
            $($("div img")[i]).addClass("counted")
        }
        else{
            $($("div img")[i]).removeClass("counted")
        };
    }
};

function registerCounterListener()
// registers a listener for each click, which analyzes the mom points
{
    $("div img").click(() => 
    {
        const gameId = myGameId();
        socket.emit('analyze', gameId)
    });
};

function registerButtonListener()
// registers a listener for the buttons and fires events
{

    $("#knopf1").click(() => {rollUnholdDice2()});
    $("#knopf2").click(() => {bankPoints()});
    $("#knopf3").click(() => {zilch()});
};

function joinThisGame(gameId)
{
    socket.emit('joinRequest', gameId);
};

function rollUnholdDice2()
{
    const gameId = myGameId();
    socket.emit('rollDice', gameId);
};

function bankPoints()
{
    const gameId = myGameId();
    socket.emit('bankPoints', gameId);
};

function resetAfterBank()
{
    const gameId = myGameId();
    socket.emit('resetAfterBank', gameId);
};

function newRoll()
{
    const gameId = myGameId();
    socket.emit('newRoll', gameId);
};

function zilch()
{
    const gameId = myGameId();
    socket.emit('zilch', gameId);
};

function createGame()
{
    const userGameName = prompt("Gib deinem Spiel einen Namen:");
    if(userGameName==null)
    {
        console.log("***Abbrechen geklickt***");
    }
    else if(userGameName!="")
    {
        socket.emit('createNewGame', userGameName);
    }
    else
    {
        createGame()
    }
};

function leaveGame()
{
  socket.emit('leaveGame');
};

//<------------------------------------------------------------------------>

location.hash = '';

