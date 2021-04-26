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

function joinThisGame(gameId)
{
    socket.emit('joinRequest', gameId);
}

socket.on('joinRequestAnswer', (gameId) => {
    console.log("Du darfst dem Spiel beitreten: " + gameId);
    const newLeaveButton = document.createElement('button');
    newLeaveButton.innerHTML = "Dieses Spiel beenden";
    newLeaveButton.setAttribute('onclick', 'leaveGame("' + gameId + '")');
    $('#leaveGameButton').append(newLeaveButton);
    const buttonText = $('#'+gameId).text();
    const submit = {"gameId":gameId, "buttonText":buttonText};
    socket.emit('gameFull', submit);
});

socket.on('gameStart', (gameId) => {
  alert("Dein Spiel startet");
  socket.emit('init', gameId);
});

location.hash = '';

socket.on('nameToCountTable', (gameValues) => {
    $("#namePlayer1").text(gameValues.player[0].name);
    $("#namePlayer2").text(gameValues.player[1].name);
    socket.emit('requestFirstRoll', (gameValues["gameCode"]));
});

socket.on('firstRollToUi', (thisRoll) => {
    const activePlayer = thisRoll.currentPlayerID;
    const activePlayerName = thisRoll.player[activePlayer].name;
    $("#spielerName1").text(activePlayerName);
    for(let i=0; i<6; i++)
    {
        let dice = thisRoll.player[activePlayer].wurfel[i].augenzahl;
        assignNewPic(i, dice);
    };
    let myId = socket.id==thisRoll.player[0].socketId ? 0 : 1;
    console.log("meine id: " + myId);
    sessionStorage.setItem("myId", myId);
    toSessionStorage(thisRoll);
});

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

function toSessionStorage(thisRoll)
{
    sessionStorage.setItem("gameValues", JSON.stringify(thisRoll));
};

function fromSessionStorage()
{
    return JSON.parse(sessionStorage.gameValues)
}

function isItMyTurn()
{
    // return true;
    // let currPlayer = currentPlayerId();
    // if(currPlayer==(sessionStorage.getItem("myId"))){return true}
    // else{return false};
}

function myPlayerId()
{
    return sessionStorage.getItem("myId");
}

function currentPlayerId()
{
    return JSON.parse(sessionStorage.gameValues).currentPlayerID;
}

function myGameId()
{
    return JSON.parse(sessionStorage.gameValues).gameCode;
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
}

socket.on('confirmHoldChange', thisRoll => {
    toSessionStorage(thisRoll);
    applyGameValuesToUi();
});

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
        // if(x==1)
        // is called when player clicks on dice, adds new class to the dice;
        // needed for analyze
        // {
        //     let thisWuerfelHoldBool = gameValues.player[playerID].wurfel[i].hold;
        //     if(thisWuerfelHoldBool)
        //     {
        //         $($("div img")[i]).addClass("hold");
        //     }
        //     else if(thisWuerfelHoldBool == false)
        //     {
        //         $($("div img")[i]).removeClass("hold");
        //     }
        // }
        // if(x==2)    // is called when reroll unhold dice. x==2 -> adds locked class and removes hold class
        // {
        //     let thisWuerfelLockedBool = gameValues.player[playerID].wurfel[i].locked;
        //     if(thisWuerfelLockedBool)
        //     {
        //         $($("div img")[i]).addClass("locked");
        //         $($("div img")[i]).removeClass("hold");
        //     }
        // }
        // if(x==3)    // is called when player rolls nothing, all dice are going to be locked, player gains +500 and is allowed to roll next roll;
        // {
        //     for(let i=0; i<6;i++)
        //     {
        //         $($("div img")[i]).addClass("hold");
        //     }
        // }
    // }
};

function registerCounterListener()
// registers a listener for each click, which analyzes the mom points
{
    $("div img").click(() => 
    {
        const gameId = myGameId();
        socket.emit('analyze', gameId)
    });
}

socket.on('itWasCounted', (thisRoll) => {
    toSessionStorage(thisRoll);
    let playerID = currentPlayerId();
    let gameValues = fromSessionStorage();
    $("#punkteAnzeige").text(gameValues.player[playerID].momPoints+gameValues.player[playerID].holdPoints);
})

function registerButtonListener()
// registers a listener for the buttons and fires events
{

    $("#knopf1").click(() => {rollUnholdDice2()});
    $("#knopf2").click(() => {bankPoints()});
    $("#knopf3").click(() => {zilch()}
    );
}

function rollUnholdDice2()
{
    const gameId = myGameId();
    socket.emit('rollDice', gameId);
};

socket.on('unholdDiceRolled', (thisRoll) => {
    toSessionStorage(thisRoll);
    newDicePics()
});

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

function bankPoints()
{
    const gameId = myGameId();
    socket.emit('bankPoints', gameId);
}

socket.on('bankPoints', (submit) => {
    toSessionStorage(submit["gameValues"]);
    const result = submit["result"];
    const gameValues = fromSessionStorage();
    const playerId = currentPlayerId();
    const points = (gameValues.player[playerId].momPoints
        + gameValues.player[playerId].holdPoints)
    const tot = gameValues.player[playerId].totalPoints;
    const durchg = gameValues.player[playerId].durchgang;
    if(result==1){
        alert("Schreiben ohne Punkte nicht möglich");
    }
    else if(result==2){
        alert("Weniger als 400 Punkte kann man nicht schreiben");
    }
    else if(result==3){
        alert("Gewonnen, mehr als 10'000 Punkte");
    }
    else if(result==4){
        $("#punkteTabelle"+playerId+ " tr:last").after("<tr><td>"
            + durchg + "</td><td>" + points + "</td><td>" + tot + "</td>");
        zilch();
        applyGameValuesToUi();
    };
});

socket.on('nextPlayer', (thisRoll) => {
    toSessionStorage(thisRoll);
    applyGameValuesToUi();
    const playerId = currentPlayerId();
    const gameValues = fromSessionStorage();
    const activePlayer = thisRoll.currentPlayerID;
    const activePlayerName = thisRoll.player[activePlayer].name;
    const durchg = gameValues.player[playerId].durchgang;
    $("#spielerName1").text(activePlayerName);
    $("#punkteTabelle"+playerId+ " tr:last").after("<tr><td>"
        + durchg + "</td><td> Zilch </td><td>"
        + gameValues.player[playerId].totalPoints +"</td>");
    newDicePics();
    applyGameValuesToUi();
});

function zilch()
{
    const gameId = myGameId();
    socket.emit('zilch', gameId);
};