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
}

function getWuerfelIDs()
// adds dice dictionary to DOM
{
    let wuerfelIDs = {"wuerfelEins":1,"wuerfelZwei":2,"wuerfelDrei":3,"wuerfelVier":4,"wuerfelFuenf":5,"wuerfelSechs":6};
    return wuerfelIDs;
}

function assignNewPic(i, x)
// is called if a new assignment of picture is needed
{
    const counters = ["Eins", "Zwei", "Drei", "Vier", "Fuenf", "Sechs"];
    $("#wuerfel" + counters[i]).attr("src", bilder(x));
}

function getCurrentPlayer()
{
    return gameValues.currentPlayerID
}

function switchCurrentPlayer()
{
    gameValues.currentPlayerID = gameValues.currentPlayerID==0 ? 1 : 0;
}

function registerHoldListener()
// registers a listener to the document - needed for each click on a dice
{
    $("div img").click(function(event){
        let playerID = getCurrentPlayer();
        let imgID = event.target.id;
        if(gameValues.player[playerID].wurfel[wuerfelIDs[imgID]-1].locked != true)
        {
            gameValues.player[playerID].wurfel[wuerfelIDs[imgID]-1].hold = !gameValues.player[playerID].wurfel[wuerfelIDs[imgID]-1].hold;
            applyGameValuesToUi(1);
        }
    });
}

function registerButtonListerner()
// registers a listener for the buttons and fires events
{
    $("#knopf1").click(function(){rollUnholdDice(2)});
    $("#knopf2").click(function(){bank()});
    $("#knopf3").click(function(){zilch(1)});
}

function registerCounterListener()
// registers a listener for each click, which analyzes the mom points
{
    $("div img").click(function(){analyze()})
}

function applyGameValuesToUi(x)
{
    let playerID = getCurrentPlayer();
    for(let i=0;i<6;i++)
    {
        if(x==1)    // is called when player clicks on dice, adds new class to the dice; needed for analyze
        {
            let thisWuerfelHoldBool = gameValues.player[playerID].wurfel[i].hold;
            if(thisWuerfelHoldBool)
            {
                $($("div img")[i]).addClass("hold");
            }
            else if(thisWuerfelHoldBool == false)
            {
                $($("div img")[i]).removeClass("hold");
            }
        }
        if(x==2)    // is called when reroll unhold dice. x==2 -> adds locked class and removes hold class
        {
            let thisWuerfelLockedBool = gameValues.player[playerID].wurfel[i].locked;
            if(thisWuerfelLockedBool)
            {
                $($("div img")[i]).addClass("locked");
                $($("div img")[i]).removeClass("hold");
            }
        }
        if(x==3)    // is called when player rolls nothing, all dice are going to be locked, player gains +500 and is allowed to roll next roll;
        {
            for(let i=0; i<6;i++)
            {
                $($("div img")[i]).addClass("hold");
            }
        }
    }
}

function init()
// creates gameValues and returns to DOM
{
    const gameValues = {
        "gameCode": "thisIsARandomName",
        "currentPlayerID": 0,
        "player": [
            {
                "playerID": 0,
                "name": "Manuel",
                "momPoints": 0,
                "holdPoints": 0,
                "totalPoints": 0,
                "durchgang": 1,
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
                "name": "Markus",
                "momPoints": 0,
                "holdPoints": 0,
                "totalPoints": 0,
                "durchgang": 1,
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
    }
    $("#namePlayer1").text(gameValues.player[0].name);
    $("#namePlayer2").text(gameValues.player[1].name);
    return gameValues;
}

function rollUnholdDice(x)
// function called by body.onload and eventlistener to reroll all not-checked dice ("noHold")
{
    let playerID = getCurrentPlayer();
    $("#spielerName1").text(gameValues.player[playerID].name);
    if(x==1)
    //new set of 6 dice
    {
        for(let i=0; i<6; i++)
        {
            let newWuerfel = parseInt(Math.random() * 6 + 1);
            gameValues.player[playerID].wurfel[i].augenzahl = newWuerfel;
            assignNewPic(i, newWuerfel);
        }
        $("#sondertext").text("");
        //check if first roll has nothing: no 1, no 5 and no dice occures more than 2x
        let has1or5 = gameValues.player[playerID].wurfel.some(a=>[1,5].includes(a.augenzahl));   // checks if the first roll does not contain 1 and/or 5.
        if(has1or5==false)
        {
            let holdList = [];
            let helperList = [];
            gameValues.player[playerID].wurfel.forEach(a=>{holdList.push(a.augenzahl)});
            for(let i=1;i<7;i++)
            {
                helperList.push(holdList.filter(a=>a==i).length)
            }
            let has3idents = helperList.some(a=>[3,4,5,6].includes(a));
            if(!has3idents)
            {
                applyGameValuesToUi(3);
                gameValues.player[playerID].momPoints += 500 + gameValues.player[playerID].holdPoints;
                $("#punkteAnzeige").text(gameValues.player[playerID].momPoints);
                $("#sondertext").text("Du hast NICHTS gewürfelt. Los - nochmal. Gibt 500 extra Looser Punkte");
            }
        }
    }

    else if(x==2)
    // called after click on roll button
    {
        let validator = [""];
        gameValues.player[playerID].wurfel.forEach(a=>{if(a.counted==false&&a.hold==true){validator.push("stop")}});
        if(gameValues.player[playerID].nextRollOK != true)
        {
            alert("Du darfst Würfel ohne Punkteeinfluss nicht halten");
            gameValues.player[playerID].wurfel.forEach(a=>{if(a.hold==true&&a.counted==true){a.counted==false}});
            return;
        }
        else if(validator.includes("stop"))
        {
            alert("Das geht so nicht!");
            return;
        }
        else if($(".hold").length==0||gameValues.player[playerID].momPoints==0)    // checks if any dice is on hold
        {
            alert("Du kannst nicht würfeln ohne zu halten");
            return;
        }
        else if(($(".hold").length) + ($(".locked").length)==6)
        {
            gameValues.player[playerID].holdPoints += gameValues.player[playerID].momPoints;
            $("div img").removeClass();
            gameValues.player[playerID].wurfel.forEach(a=> {a.hold=false;a.locked=false});
            rollUnholdDice(1);
            return;
        }
        else
        {
            gameValues.player[playerID].holdPoints += gameValues.player[playerID].momPoints;
            gameValues.player[playerID].momPoints = 0;
            (gameValues.player[playerID].wurfel).forEach((a,i) => {
                if(a.hold == false && a.locked == false)
                {
                    a.augenzahl = parseInt(Math.random() * 6 + 1);
                    assignNewPic(i,a.augenzahl);
                }
                else if(a.hold == true)
                {
                    a.hold = false;
                    a.locked = true;
                    applyGameValuesToUi(2)
                }
            })
        }
    }
}

function validateAsCounted(x)
{
    let playerID = getCurrentPlayer();
    gameValues.player[playerID].wurfel.forEach(a=>{if(a.hold==true && a.augenzahl==x){a.counted=true}});
}

function analyze()
// is called any time a dice is selected or unselected and analyzes the mom points
{
    let playerID = getCurrentPlayer();
    gameValues.player[playerID].momPoints = 0;
    gameValues.player[playerID].nextRollOK = true;
    const holdDiceWithOccurence = gameValues.player[playerID].wurfel
        .filter(wurfel=>wurfel.hold)
        .reduce((holdDiceMap,wurfel)=>{
            holdDiceMap[wurfel.augenzahl] += 1;
        return holdDiceMap;
    },{1:0,2:0,3:0,4:0,5:0,6:0})
    for(k in holdDiceWithOccurence)
    {
        let playerID = getCurrentPlayer();
        let y = holdDiceWithOccurence[k]; // y for readability - gives the occurence of one specific dice as number
        switch(k)
        {
            case "1":
                gameValues.player[playerID].momPoints += 100 * y;
                validateAsCounted(k)
                break;
            case "5":
                gameValues.player[playerID].momPoints += 50 * y;
                validateAsCounted(k)
                break;
        }
        if(y!=0)
        {
            let holdDice = [];
            for(let j=0;j<6;j++)
            {
                if(gameValues.player[playerID].wurfel[j].hold == true)
                {
                    holdDice.push(gameValues.player[playerID].wurfel[j].augenzahl);
                }
            }

            let isStreet = [1,2,3,4,5,6].every((val,ind)=>val===holdDice[ind])        // checks if user rolled a straight 1-6 == 2000 points

            if(isStreet)
            {
                gameValues.player[playerID].momPoints = 2000;
            }
        }
        if(y>2 && y<6)
        {
            switch(k)
            {
                case "1":
                    gameValues.player[playerID].momPoints += 700;
                    validateAsCounted(k);
                    break;
                case "2":
                    gameValues.player[playerID].momPoints += 200;
                    if(y==4||y==5){gameValues.player[playerID].nextRollOK = false};
                    validateAsCounted(k);
                    break;
                case "3":
                    gameValues.player[playerID].momPoints += 300;
                    if(y==4||y==5){gameValues.player[playerID].nextRollOK = false};
                    validateAsCounted(k);
                    break;
                case "4":
                    gameValues.player[playerID].momPoints += 400;
                    if(y==4||y==5){gameValues.player[playerID].nextRollOK = false};
                    validateAsCounted(k);
                    break;
                case "5":
                    gameValues.player[playerID].momPoints += 350;
                    validateAsCounted(k);
                    break;
                case "6":
                    gameValues.player[playerID].momPoints += 600;
                    if(y==4||y==5){gameValues.player[playerID].nextRollOK = false};
                    validateAsCounted(k);
                    break;
            }
        }
        else if(y==6)
        {
            switch(k)
            {
                case "1":
                    gameValues.player[playerID].momPoints = 2000;
                    break;
                case "2":
                    gameValues.player[playerID].momPoints = 400;
                    break;
                case "3":
                    gameValues.player[playerID].momPoints = 600;
                    break;
                case "4":
                    gameValues.player[playerID].momPoints = 800;
                    break;
                case "5":
                    gameValues.player[playerID].momPoints = 1000;
                    break;
                case "6":
                    gameValues.player[playerID].momPoints = 1200;
                    break;
            }
        }
    }
    $("#punkteAnzeige").text(gameValues.player[playerID].momPoints+gameValues.player[playerID].holdPoints);
}

function zilch(x) // kind of reset
{
    let playerID = getCurrentPlayer();
    $("div img").removeClass();
    gameValues.player[playerID].momPoints = 0;
    gameValues.player[playerID].holdPoints = 0;
    $("#punkteAnzeige").text(gameValues.player[playerID].momPoints);
    gameValues.player[playerID].wurfel.forEach(a=> {a.hold=false;a.locked=false});

    if(x==1)
    {
        let durchg = gameValues.player[playerID].durchgang;
        $("#punkteTabelle"+playerID+ " tr:last").after("<tr><td>" + durchg + "</td><td> Zilch </td><td>" + gameValues.player[playerID].totalPoints +"</td>");
        gameValues.player[playerID].durchgang += 1;
    }
    switchCurrentPlayer();
    rollUnholdDice(1);
}

function bank()
{
    let playerID = getCurrentPlayer();
    let tot = gameValues.player[playerID].totalPoints;
    let hold = gameValues.player[playerID].holdPoints;
    let mom = gameValues.player[playerID].momPoints;
    let durchg = gameValues.player[playerID].durchgang;
    if(mom==0)
    {
        alert("Du kannst nicht schreiben ohne erst Punkte zu halten");
        return;
    }
    else if((hold+mom)<400)
    {
        alert("Du kannst weniger als 400 Punkte nicht schreiben");
        return;
    }
    else
    {
        gameValues.player[playerID].durchgang += 1;
        tot += hold + mom;
        gameValues.player[playerID].totalPoints = tot;
        if(tot >= 10000)
        {
            alert("Du hast gewonnen, mehr als 10'000 Pkte");
            tot = 0;
            $("#punkteTotal").text(tot);
            zilch();
        }
        else
        {
            let playerID = getCurrentPlayer();
            $("#punkteTabelle"+playerID+ " tr:last").after("<tr><td>" + durchg + "</td><td>" + (mom + hold) + "</td><td>" + tot + "</td>");
            zilch();
        }
    }
};

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
        if(k.gameFull=="notFull")
        {
            const newGameButton = document.createElement('button');
            console.log("k: " + k + ", active games: " + activeGames[k]);
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
  console.log(gameId);
  socket.emit('init', gameId);
});

socket.on('ausgabe', (activeGames) => {
    console.log(activeGames);
});

location.hash = '';
