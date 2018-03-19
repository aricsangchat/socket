const binance = require('node-binance-api');
const schedule = require('node-schedule');
const util = require('util');
const _ = require('lodash');
const moment = require('moment');
const json2csv = require('json2csv');
const fs = require('fs');
const brain = require('brain.js');

const fields = ['close', 'time', 'ema7', 'ema25', 'ema99', 'ema150'];
let buyCommand = 0;
let sellCommand = 0;
let waitCommand = 1;

binance.options({
  'APIKEY':'wh0XcP5dRVMCERbZG8zYmr6eCUdkefP0h5bbaIRTHFnKldeP2qWB9xZPnnycdvAe',
  'APISECRET':'rXDjEe5bWn22rxygY7qpQC84T3PtotpMP1zfXgNoZFc8DEA5Mu5mgKjJnAkHQhct',
  'test': false,
  'reconnect': false
});

let settings = [
  {
    settingName: 'Socket Trader',
    ticker: 'BNBUSDT',
    mainCurrency: 'USDT',
    secCurrency: 'BNB',
    cancelBuyCron: '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
    minSpread: 0.0050,
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
    sstLimit: -0.0100,
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
let trace5 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'Highs'
}
let trace6 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'Lows'
}
let openBuyOrders = [];

exports.startProgram = (io) => {
  let sells = [];
  let buys = [];
  let spdAvg = [];
  let lastOrder = {};
  let sellsTransactionArray = [];
  let buysTransationArray = [];
  let cst = null;
  let tickerData = null;
  let lastOrderStatus = null;
  let currentSellPrice = null;
  let spread = null;
  let startingAverageArray = [];
  let movingAverageArray = [];

  let data = [ trace1, trace2, trace3, trace4, trace5, trace6 ];
  const debounceBuy = _.debounce(placeBuyOrder, 1000, {leading: true, trailing: false});
  const debounceSell = _.debounce(placeSellOrder, 1000, {leading: true, trailing: false});
  const debounceCancelBuy = _.debounce(cancelBuy, 700, {leading: true, trailing: false});
  const debounceCancelSell = _.debounce(cancelSell, 700, {leading: true, trailing: false});
  let networkArray = [];
  let maxMinArray = [];

  let inputs = [];
  //Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  binance.websockets.candlesticks([settings[0].ticker], '1m', (candlesticks) => {
    let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
    let { o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
    settings[0].close = close;
    if (trace1.x.length > 2) {
      trace1.x.push(Date.now());
      trace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      trace2.x.push(Date.now());
      trace2.y.push(calculateMovingAverage(close,trace2.y[trace2.y.length - 1], 7));
      trace3.x.push(Date.now());
      trace3.y.push(calculateMovingAverage(close,trace3.y[trace3.y.length - 1], 25));
      trace4.x.push(Date.now());
      trace4.y.push(calculateMovingAverage(close,trace4.y[trace4.y.length - 1], 99));
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

    io.emit('graphData', data);
    // io.emit('botLog', null, trainingData);
    io.emit('botLog', symbol+' '+interval+' candlestick update');
    io.emit('botLog', 'close: '+close);
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

  binance.websockets.trades([settings[0].ticker], function(trades) {
    let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;
    console.log(symbol+' trade update. price: '+price+', quantity: '+quantity+', maker: '+maker);
    
    if (trace2.y[trace2.y.length - 1] > trace3.y[trace3.y.length - 1] && (trace1.y[trace1.y.length - 1] > trace2.y[trace2.y.length - 1] && trace2.y[trace2.y.length - 1] >= trace2.y[trace2.y.length - 2])) {
      settings[0].trend = 'up';
    } else {
      if (openBuyOrders.length > 0) {
        cancelBuys();
      }
      settings[0].trend = 'down';
    }

    if (maker) {
      buys.push({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      });
    } else {
      sells.push({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      });
    }

    if (buys.length >= settings[0].avlToStart) {
      spread = getSpread(buys[buys.length - 1], sells[sells.length - 1]);
      //let averageBuyPrice = _.meanBy(buys, 'price');
      //let averageSellPrice = _.meanBy(sells, 'price');
      //let minBuyPrice = _.minBy(buys, 'price');
      // let averageSellPrice = _.meanBy(sells, 'price');
      let buyPrice = parseFloat(buys[buys.length - 1].price);
      //settings[0].buyPrice = parseFloat(buys[buys.length - 1].price);
      currentSellPrice = parseFloat(sells[sells.length - 1].price);
      settings[0].bst = buyPrice - settings[0].buyPrice;
      settings[0].sst = currentSellPrice - settings[0].sellPrice;
      settings[0].buySellPad = spread * settings[0].buySellPadPercent;
      console.log('buys:', buys.length, 'sells:', sells.length);
      console.log('SPD:', spread);
      console.log('BPR:', buyPrice);
      console.log('SPR:', currentSellPrice.toFixed(settings[0].decimalPlace));
      // console.log('ABP:', averageBuyPrice.toFixed(settings[0].decimalPlace));
      // console.log('ASP:', averageSellPrice.toFixed(settings[0].decimalPlace));
      // console.log('BST:', settings[0].bst.toFixed(settings[0].decimalPlace));
      // console.log('BON:', settings[0].buyOrderNum);
      console.log('SST:', settings[0].sst.toFixed(settings[0].decimalPlace));
      console.log('STE:', settings[0].state);
      console.log('TRD:', settings[0].trend);
      // console.log('SON:', settings[0].sellOrderNum);
      // console.log('STE:', settings[0].state);
      // console.log('MBP:', minBuyPrice.price);
      if ( spread >= settings[0].minSpread && (settings[0].state === null && settings[0].trend === 'up')) {
        debounceBuy(buyPrice);
      } 

      if (openBuyOrders.length > 0) {
        checkBuyStatus(buyPrice, () => {
          if ( spread >= settings[0].minSpread && (settings[0].state === null && settings[0].trend === 'up')) {
            debounceBuy(buyPrice);
          }
        });
      }
    
      if (sells.length >= settings[0].avlMax) {
        sells.shift();
      }
      if (buys.length >= settings[0].avlMax) {
        buys.shift();
      }
    }
  });

  function balance_update(data) {
    // console.log('Balance Update');
    // for ( let obj of data.B ) {
    //   let { a:asset, f:available, l:onOrder } = obj;
    //   if ( available == '0.00000000' ) continue;
    //   console.log(asset+'\tavailable: '+available+' ('+onOrder+' on order)');
    // }
  }
  function execution_update(data) {
    let { x:executionType, s:symbol, p:price, q:quantity, S:side, o:orderType, i:orderId, X:orderStatus } = data;
    if (symbol === settings[0].ticker) {
      if ( executionType == 'NEW' ) {
        if ( orderStatus == 'REJECTED' ) {
          console.log('Order Failed! Reason: '+data.r);
          return;
        }
      }
      //NEW, CANCELED, REPLACED, REJECTED, TRADE, EXPIRED
      console.log(symbol+'\t'+side+' '+executionType+' '+orderType+' ORDER #'+orderId);
      console.log(symbol+' '+side+' '+orderType+' ORDER #'+orderId+' ('+orderStatus+')');
      console.log('..price: '+price+', quantity: '+quantity);

      if (side === 'BUY' && orderStatus === 'FILLED') {
        settings[0].state = null;
        placeSellOrder(parseFloat(price) + parseFloat(settings[0].spreadProfit));
        return;
      } else if (side === 'SELL' && orderStatus === 'FILLED') {
        settings[0].state = null;
        settings[0].sellPrice = null;
        settings[0].sellOrderNum = null;
        settings[0].buyPrice = null;
        //settings[0].buyOrderNum = null;
        return;
      } else if (side === 'BUY' && orderStatus === 'NEW') {
        placeSellOrder(parseFloat(price) + parseFloat(settings[0].spreadProfit));
        settings[0].state = 'Buying';
        settings[0].buyPrice = price;
        settings[0].buyOrderNum = orderId;
        openBuyOrders.push({
          orderId: orderId,
          price: parseFloat(price)
        });
        return;
      } else if (side === 'SELL' && orderStatus === 'NEW') {
        settings[0].state = null;
        settings[0].sellPrice = price;
        settings[0].sellOrderNum = orderId;
        return;
      } else if (side === 'BUY' && orderStatus === 'PARTIALLY_FILLED') {
        // settings[0].state = 'buyPartialFill';
        return;
      } else if (side === 'SELL' && orderStatus === 'PARTIALLY_FILLED') {
        // settings[0].state = 'sellPartialFill';
        return;
      } else if (side === 'SELL' && orderStatus === 'CANCELED') {
        // settings[0].state = 'RelistSell';
        settings[0].sellPrice = null;
        settings[0].sellOrderNum = null;
        return;
      } else if (side === 'BUY' && orderStatus === 'CANCELED') {
        settings[0].state = null;
        settings[0].buyPrice = null;
        // settings[0].buyOrderNum = null;
        return;
      } else {
        return;
      }
    }
  }
  binance.websockets.userData(balance_update, execution_update);
};

exports.stopSockets = (io) => {
  let endpoints = binance.websockets.subscriptions();
  for ( let endpoint in endpoints ) {
    io.emit('botLog', 'Socket Endpoints: '+endpoint);
  	console.log(endpoint);
  	binance.websockets.terminate(endpoint);
  }
}

exports.outputCommand = (io, command) => {
  if (command === 'b') {
    buyCommand = 1;
    sellCommand = 0;
    waitCommand = 0;
  } else if (command === 's') {
    sellCommand = 1;
    buyCommand = 0;
    waitCommand = 0;
  } else if (command === 'p') {
    placeBuyOrder(settings[0].close);
  } else if (command === 'a') {
    placeSellOrder(settings[0].close);
  } else if (command === 'c') {
    binance.cancelOrders(settings[0].ticker, (error, response, symbol) => {
    	//console.log(symbol+" cancel response:", response);
      console.log('Canceled Orders.');
    });
  }else {
    waitCommand = 1;
    buyCommand = 0;
    sellCommand = 0;
  }
  console.log(command);
}

exports.saveTrainingData = (io, command) => {
  var json = JSON.stringify(trainingData);
  fs.writeFile('trainingData.json', json, 'utf8', function(err) {
    if (err) throw err;
    console.log('file saved');
  });
}

function calculateHighs(close) {
  if(close > trace5.y[trace5.y.length - 1]) {
    return close;
  } else{
    return trace5.y[trace5.y.length - 1];
  }
}
function calculateLows(close) {
  if(close < trace6.y[trace6.y.length - 1]) {
    return close;
  } else{
    return trace6.y[trace6.y.length - 1];
  }
}
function getBinary(current,previous) {
  if (current < previous) {
    return -1;
  } else if (current > previous) {
    return 1;
  } else if (current === previous) {
    return 0;
  }
}
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

function placeBuyOrder(buyPrice) {
  const finalBuyPrice = parseFloat(buyPrice);

  binance.buy(settings[0].ticker, settings[0].quantity.toFixed(settings[0].decimalPlace), finalBuyPrice.toFixed(settings[0].decimalPlace), {}, buyResponse => {
    console.log('Bought @:', finalBuyPrice);
    //console.log('Buy order id: ' + buyResponse);
    //console.log(util.inspect(buyResponse, { showHidden: true, depth: null }));
  });
}

function placeSellOrder(price) {
  const sellPrice = parseFloat(price);

  binance.sell(settings[0].ticker, settings[0].quantity.toFixed(settings[0].decimalPlace), sellPrice.toFixed(settings[0].decimalPlace), {}, sellResponse => {
    console.log('Sold @:', sellPrice);
    // console.log('Sold order id: ' + sellResponse.orderId);
    // console.log(util.inspect(sellResponse, { showHidden: true, depth: null }));
  });
}

function cancelBuy(orderNum) {
  binance.cancel(settings[0].ticker, orderNum, function(response, symbol) {
    console.log('Canceled order #: ', + orderNum);
  });
}

function cancelBuys() {
  console.log(openBuyOrders);
  openBuyOrders.forEach(order => {
    binance.cancel(settings[0].ticker, order.orderId, function(response, symbol) {
      console.log('Canceled order #: ', + order.orderId);
    });
  })
  openBuyOrders = [];
}

function cancelSell(orderNum) {
  binance.cancel(settings[0].ticker, orderNum, function(response, symbol) {
    console.log('Canceled order #: ', + orderNum);
  });
}

function getSpread(buys, sells) {
  const profit =  sells.price - buys.price;
  return profit.toFixed(settings[0].decimalPlace);
}

function count(array_elements) {
    array_elements.sort();

    var current = null;
    var cnt = 0;
    for (var i = 0; i < array_elements.length; i++) {
        if (array_elements[i] != current) {
            if (cnt > 0) {
                document.write(current + ' comes --> ' + cnt + ' times<br>');
            }
            current = array_elements[i];
            cnt = 1;
        } else {
            cnt++;
        }
    }
    if (cnt > 0) {
        document.write(current + ' comes --> ' + cnt + ' times');
    }

}

function checkBuyStatus(buyPrice, cb) {
  openBuyOrders.forEach(order => {
    let bst = buyPrice - order.price;
    console.log('BST:', bst.toFixed(settings[0].decimalPlace));
    if (bst.toFixed(settings[0].decimalPlace) > settings[0].bstLimit && order.orderId != null) {
      cancelBuy(order.orderId);
      order.orderId = null;
    }
  });
  cb();
}
