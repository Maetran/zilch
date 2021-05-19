import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

class EntryHall extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <div id="nameDiv" class="topLine page">
        <form id="nameForm">
        <input id="nameInput" autocomplete="off" />
        <button onClick={() => this.toLobby()}>Name übermitteln</button>
        </form>
      </div>
    )
  }

  toLobby = () => {
    ReactDOM.render(<Lobby />, document.getElementById('root'));
  }
}

class Lobby extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
    <div id="lobby" class="lobby page">
      <div class="playerList">
        <p id="allPlayer">Spieler Online:</p>
        <table id="playerOnlineList">
          <tr>
            <th>Name</th>
            <th>Socket ID</th>
          </tr>
        </table>
      </div>
      <button onclick="createGame()">Neues Spiel erstellen</button>
      <div id="availableGames" />
    </div>
    )
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="mainGame" class="upperStuff page">
        <div class="containerLeft">
          <div id="diceContainer" class="allDice">
            <img id="wuerfelEins" src="one.png" alt="wuerfel1" /><br />
            <img id="wuerfelZwei" src="two.png" alt="wuerfel2" /><br />
            <img id="wuerfelDrei" src="three.png" alt="wuerfel3" /><br />
            <img id="wuerfelVier" src="four.png" alt="wuerfel4" /><br />
            <img id="wuerfelFuenf" src="five.png" alt="wuerfel5" /><br />
            <img id="wuerfelSechs" src="six.png" alt="wuerfel6" />
          </div>
        </div>
        <div class="containerMidLeft">
          <input id="knopf1" type="button" value="Würfeln" /><br /><br />
          <input id="knopf2" type="button" value="Anschreiben" /><br /><br />
          <input id="knopf3" type="button" value="Zilch" /><br /><br />
          <p id="sondertext">&NonBreakingSpace;</p>
        </div>
        <div class="containerMidRight">
          <p><span id="spielerName1">Name</span> hat in diesem Durchgang <br /><b id="punkteAnzeige">0</b><br />Punkte
                gewürfelt.</p>
        </div>
        <div class="containerPlayerOne">
          <p id="namePlayer1">Spieler 1</p>
          <table id="punkteTabelle0">
            <tr>
              <th>Durchgang</th>
              <th>Neue Punkte dazu</th>
              <th>Total Punkte</th>
            </tr>
          </table>
        </div>
        <div class="containerPlayerOne">
          <p id="namePlayer2">Spieler 2</p>
          <table id="punkteTabelle1">
            <tr>
              <th>Durchgang</th>
              <th>Neue Punkte dazu</th>
              <th>Total Punkte</th>
            </tr>
          </table>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<EntryHall />, document.getElementById('root'));

