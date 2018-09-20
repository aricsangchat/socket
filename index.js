
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
const bot = require('./bot');
let settings = require('./settings.js');
const helpers = require('./helpers/helpers.js');
const tickerSettings = require('./tickerSettings.json');

app.use(express.static('client'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/api/get-all-tickers', function(req, res){
  bot.allTickers();
});

io.on('connection', function(socket){
  socket.on('botLog', function(msg){
    if (msg === 'start') {
      tickerSettings.forEach(tickerSetting => {
        bot.start(tickerSetting.ticker, io);
      })
    } else if (msg === 'stop') {
      helpers.stopSockets(io);
    } else {
      settings.outputCommand(io, msg);
    }
    io.emit('botLog', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
