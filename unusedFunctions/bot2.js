const binance = require('node-binance-api');

binance.options({
    'APIKEY': 'wh0XcP5dRVMCERbZG8zYmr6eCUdkefP0h5bbaIRTHFnKldeP2qWB9xZPnnycdvAe',
    'APISECRET': 'rXDjEe5bWn22rxygY7qpQC84T3PtotpMP1zfXgNoZFc8DEA5Mu5mgKjJnAkHQhct',
    'test': true,
    'reconnect': false
});

let settings = [
    {
        settingName: 'Socket Trader',
        ticker: 'BNBUSDT',
        mainCurrency: 'USDT',
        secCurrency: 'BNB',
        cancelBuyCron: '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
        minSpread: 0.0030,
        spreadProfit: 0.0140,
        decimalPlace: 4,
        avlToStart: 20,
        avlMax: 21,
        buyPad: 0.000000,
        sellPad: 0.000000,
        quantity: 2,
        buyPrice: null,
        buyOrderNum: null,
        sellOrderNum: null,
        sellPrice: null,
        state: null,
        bst: null,
        sst: null,
        bstLimit: 0.0000,
        sstLimit: -0.0070,
        sstLimitEnable: false,
        buySellPad: 0,
        buySellPadPercent: 0,
        time: 2,
        startingAverage: null,
        close: null,
        trend: null
    }
];

let trace1 = {
    x: [],
    y: [],
    mode: 'markers',
    name: 'Cost'
};
let trace2 = {
    x: [],
    y: [],
    mode: 'lines',
    name: 'EMA7'
};
let trace3 = {
    x: [],
    y: [],
    mode: 'lines',
    name: 'EMA25'
};
let trace4 = {
    x: [],
    y: [],
    mode: 'lines',
    name: 'EMA99'
};

//Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
binance.websockets.candlesticks([settings[0].ticker], '6h', (candlesticks) => {
    let { e: eventType, E: eventTime, s: symbol, k: ticks } = candlesticks;
    let { o: open, h: high, l: low, c: close, v: volume, n: trades, i: interval, x: isFinal, q: quoteVolume, V: buyVolume, Q: quoteBuyVolume } = ticks;
    settings[0].close = close;
    console.log('open: ', open);
    console.log('high: ', high);
    console.log('low: ', low);
    console.log('close: ', close);
    console.log('volume: ', volume);
    console.log('trades: ', trades);
    console.log('interval: ', interval);
    console.log('quoteVolume: ', quoteVolume);
    console.log('buyVolume: ', buyVolume);
    console.log('quoteBuyVolume: ', quoteBuyVolume);
    if (trace1.x.length > 2) {
        trace1.x.push(Date.now());
        trace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
        trace2.x.push(Date.now());
        trace2.y.push(calculateMovingAverage(close, trace2.y[trace2.y.length - 1], 7));
        trace3.x.push(Date.now());
        trace3.y.push(calculateMovingAverage(close, trace3.y[trace3.y.length - 1], 25));
        trace4.x.push(Date.now());
        trace4.y.push(calculateMovingAverage(close, trace4.y[trace4.y.length - 1], 99));
    } else {
        trace1.x.push(Date.now());
        trace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
        trace2.x.push(Date.now());
        trace2.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
        trace3.x.push(Date.now());
        trace3.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
        trace4.x.push(Date.now());
        trace4.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    }
    if (trace1.x.length > 500) {
        trace1.x.shift();
        trace1.y.shift();
        trace2.x.shift();
        trace2.y.shift();
        trace3.x.shift();
        trace3.y.shift();
        trace4.x.shift();
        trace4.y.shift();
    }

    //io.emit('graphData', data);
    // io.emit('botLog', null, trainingData);
    //io.emit('botLog', symbol + ' ' + interval + ' candlestick update');
    //io.emit('botLog', 'close: ' + close);
    // io.emit('botLog', 'volume: '+volume);
    // io.emit('botLog', 'state: '+settings[0].state);
    // io.emit('botLog', 'BON: '+settings[0].buyOrderNum);
    // io.emit('botLog', 'SON: '+settings[0].sellOrderNum);
    // io.emit('botLog', 'HII: '+maxHigh);
    // io.emit('botLog', 'LOW: '+maxLow);
    // let output = net.run(trainingData[trainingData.length - 1].input);
    // console.log('Output',output);
    // io.emit('botLog', 'ODB: '+output.buy);
    // io.emit('botLog', 'ODS: '+output.sell);
    // io.emit('botLog', 'ODW: '+output.wait);
    //console.log('net:', networkArray);
});


function calculateMovingAverage(price,prevEMA,time) {
    if (prevEMA.length === 0) {
      return price * 2/(time+1) + price * (1-2/(time+1));
    } else {
      return price * 2/(time+1) + prevEMA * (1-2/(time+1));
    }
  }
  function calculateMovingAverage2(price,prevEMA,time) {
    if (prevEMA.length === 0) {
      return price * 2/(time+1) + settings[0].startingAverage * (1-2/(time+1));
    } else {
      return price * 2/(time+1) + prevEMA[prevEMA.length - 1].ema25 * (1-2/(time+1));
    }
  }
  function calculateMovingAverage3(price,prevEMA,time) {
    if (prevEMA.length === 0) {
      return price * 2/(time+1) + settings[0].startingAverage * (1-2/(time+1));
    } else {
      return price * 2/(time+1) + prevEMA[prevEMA.length - 1].ema99 * (1-2/(time+1));
    }
  }
  function calculateMovingAverage4(price,prevEMA,time) {
    if (prevEMA.length === 0) {
      return price * 2/(time+1) + settings[0].startingAverage * (1-2/(time+1));
    } else {
      return price * 2/(time+1) + prevEMA[prevEMA.length - 1].ema150 * (1-2/(time+1));
    }
  }