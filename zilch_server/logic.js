module.exports.analyze = function analyze(gameId)
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