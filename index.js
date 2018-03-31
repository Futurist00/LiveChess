var express = require('express');
var app = express();
var path = require('path');
var server = require('http').Server(app).listen(process.env.PORT || 3000);
var io = require('socket.io')(server, { wsEngine: 'ws' });
var Chess = require('chess.js').Chess;

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/images')));

app.get('/', (req, res)=>{
  res.sendFile(__dirname + '/public/index.html');
});

io.of('/').on('connection', function(socket) {
  var chess = new Chess();
  var users = [];
  var userName = "", userColor = "";
  var signedIn = false;

  console.log("New socket connected");
  socket.emit('displayUsers', users);

  socket.on('newMove', function(data) {
    //if valid move, then update the board
    if(chess.move(data))
      io.sockets.emit('updateBoard', data);
    if(chess.game_over())
      io.sockets.emit('game_over');
    console.log(chess.ascii());
  });

  socket.on('switchKingTower', function(data) {
    if(chess.move(data))
      io.sockets.emit('switchKing', data);
  });

  socket.on('newUser', function(data) {
    signedIn = true;
    userName = data;
    if(users.length % 2 === 0)  userColor = "white";
    else  userColor = "black";
    users.push({name: data, color: userColor});
    io.sockets.emit('appendUser', {name: data, color: userColor});
   });

  socket.on('newMessage', function(data) {
    io.sockets.emit('appendMessage', data);
   });

   socket.on('disconnect', function() {
     // only updating the active players, if they were logged in
     if(signedIn)
     {
       var index = getIndex(users, userName);
       if(index != -1)  users.splice(index, 1);
       socket.broadcast.emit('updateUsers', users);
       chess.reset();
       console.log('disconnected');
     }
  });
});

function getIndex(users, name)
{
  for(var item in users)
    if(users[item].name === name)
    {
      console.log("index: " + item);
      return item;
    }
}
