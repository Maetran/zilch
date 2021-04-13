const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const allUsers = {};

express.static('./public');
app.use(express.static('./public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/zilch.html');
});

io.on('registerPlayer', (msg) => {
  
})

server.listen(3003, () => {
    console.log('listening on *:3003');
});
