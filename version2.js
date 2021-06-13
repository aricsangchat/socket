
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
const config = require('./config.json');
const Binance = require('node-binance-api');
const { toNumber } = require('lodash');
const binance = new Binance().options({
  APIKEY: config.BINANCE_APIKEY,
  APISECRET: config.BINANCE_APISECRET,
  test: true,
  reconnect: true
});

app.use(express.static('version2'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/version2/index.html');
});

// app.get('/api/get-all-tickers', function(req, res){
//   bot.allTickers();
// });

io.on('connection', function (socket) {
  let index = 1;
  //   socket.on('botLog', function(msg){
  //     if (msg === 'start') {
  //       tickerSettings.forEach(tickerSetting => {
  //         bot.start(tickerSetting.ticker, io, bot.getAverageBuyPrice);
  //         //bot.getAverageBuyPrice()
  //       })
  //     } else if (msg === 'stop') {
  //       helpers.stopSockets(io);
  //     } else {
  //       settings.outputCommand(io, msg);
  //     }
  //     io.emit('botLog', msg);
  //   });

  // Spot Chart Websocket and Cache
  let hasExecuted = false; // Only Run Once
  binance.websockets.chart("ETHUSDT", "1m", (symbol, interval, data) => {
    let dataPointArray = [];
    let unixTime = '';
    let open = '';
    let high = '';
    let low = '';
    let close = '';
    let volume = '';

    let dataPointObject = {
      x: unixTime,
      y: [open, high, low, close, volume]
    }

    // format cached data on load, only runs once
    if (hasExecuted === false) {
      // Example Data Object:
      // {
      //   '1623136620000': {
      //     open: '2501.97000000',
      //     high: '2502.39000000',
      //     low: '2491.23000000',
      //     close: '2498.64000000',
      //     volume: '1652.88677000'
      //   },
      // }
      // Loop through unix time to datapoint array
      // Example dataPointArray output: [ { x: unixTime}, y: [Open, High ,Low, Close] }, ... ]

      for (const key in data) {
        //console.log(`${key}: ${data[key]}`);
        unixTime = convertUnixToTimestamp(toNumber(key));
        open = toNumber(data[key].open);
        high = toNumber(data[key].high);
        low = toNumber(data[key].low);
        close = toNumber(data[key].close);
        volume = toNumber(data[key].volume)
        dataPointObject = [unixTime, open, high, low, close, volume]

        dataPointArray.push(dataPointObject)
        //index++;
      }
      io.emit('chartJS', dataPointArray);
      hasExecuted = true;
    }
  });
});



http.listen(port, function () {
  console.log('listening on V2 *:' + port);
});

const convertUnixToTimestamp = (unix) => {
  var utcSeconds = unix;
  var d = new Date(unix);
  console.log(d);
  return d;
}

const formatData = (time, ) => {

}