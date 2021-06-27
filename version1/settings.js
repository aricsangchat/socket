module.exports = {
  ticker: 'DOGEUSDT',
  mainCurrency: 'USDT',
  secCurrency: 'DOGE',
  decimalPlace: 4,
  buyPrice: null,
  buyOrderNum: null,
  sellOrderNum: null,
  sellPrice: null,
  state: null,
  startingAverage: null,
  close: null,
  trend: [],
  ema25Trend: [],
  reset: false,
  queue: [],
  amountOfBuys: null,
  amountOfSells: null,
  bluePercentageTrend: [],
  orangePercentageTrend: [],
  greenPercentageTrend: [],
  orderTrend995: ['sold'],
  orderTrend99: [],
  orderTrend97: [],
  orderTrend95: [],
  orderTrend985: ['sold'],
  orderTrend98: ['sold'],
  orderTrend975: ['sold'],
  orderTrendUpNDown: [],
  tradeSpeed: 'aggressive',
  tradeSpeedObj: {
    one: 99.90,
    five: 99.75,
    ten: 99.50,
  },
  engage: false,
  outputCommand: (io, command) => {
    const helpers = require('../helpers/helpers.js');

    if (command === 'manual sell') {
      module.exports.orderTrend99 = [];
      module.exports.orderTrend97 = [];
      module.exports.orderTrend95 = [];
    } else if (command.includes('engage')) {
      let output = command.split(' ');
      module.exports.engage = output[1];
    } else if (command.includes('speed')) {
      let speed = command.split(' ');
      module.exports.tradeSpeedObj = helpers.setTradeSpeed(speed[1])
      module.exports.tradeSpeed = speed[1]
    }
    console.log(command);
  },
}