var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
const bot = require('./bot');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('botLog', function(msg){
    if (msg === 'start'){
      bot.startProgram(io);
    } else if (msg === 'stop') {
      bot.stopSockets(io);
    } else if (msg === 'save') {
      bot.saveTrainingData(io);
    } else {
      bot.outputCommand(io, msg);
    }
    io.emit('botLog', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
