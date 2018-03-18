const binance = require('node-binance-api');
const schedule = require('node-schedule');
const util = require('util');
const _ = require('lodash');
const moment = require('moment');
const json2csv = require('json2csv');
const fs = require('fs');
const brain = require('brain.js');
const trainingDataJson = require('../aroc-trader/data/trainingData');

const fields = ['close', 'time', 'ema7', 'ema25', 'ema99', 'ema150'];
let buyCommand = 0;
let sellCommand = 0;
let waitCommand = 1;

binance.options({
  'APIKEY':'zs4zBQPvwO9RW9aQd2FSDF8zNVZmFWTJajrczPvshygpXo00ft1ESlYyI3LI9hWU',
  'APISECRET':'oYtkOlUZlq8sS8pjU68JKQYeWwEaHxQI2g87x5akySl3OjVfiX40z0GcFu4VjCBV',
  'test': false,
  'reconnect': false
});

let settings = [
  {
    settingName: 'Socket Trader',
    ticker: 'ETHUSDT',
    mainCurrency: 'ETH',
    secCurrency: 'USDT',
    cancelBuyCron: '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
    minSpread: 1.00,
    spreadProfit: 2.30,
    decimalPlace: 2,
    avlToStart: 5,
    avlMax: 21,
    buyPad: 0.000000,
    sellPad: 0.000000,
    quantity: 0.10,
    buyPrice: null,
    buyOrderNum: null,
    sellOrderNum: null,
    sellPrice: null,
    state: null,
    bst: null,
    sst: null,
    bstLimit: 1.31,
    sstLimit: -1.30,
    sstLimitEnable: false,
    buySellPad: 0,
    buySellPadPercent: 0,
    time: 2,
    startingAverage: null,
    close: null
  },{
    settingName: 'Socket Trader',
    ticker: 'TRXETH',
    mainCurrency: 'ETH',
    secCurrency: 'TRX',
    cancelBuyCron: '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
    minSpread: 0.00000002,
    maxSpread: 10.00, // not in use
    decimalPlace: 8,
    avlToStart: 10,
    avlMax: 21,
    buyPad: 0.000000,
    sellPad: 0.000000,
    quantity: 2500,
    buyPrice: null,
    buyOrderNum: null,
    sellOrderNum: null,
    sellPrice: null,
    state: null,
    bst: null,
    sst: null,
    bstLimit: 0.00000005,
    sstLimit: -0.00000005,
    sstLimitEnable: true,
    buySellPad: 0,
    buySellPadPercent: 0
  }
];
let trainingData = [];
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
  const debounceBuy = _.debounce(placeBuyOrder, 700, {leading: true, trailing: false});
  const debounceSell = _.debounce(placeSellOrder, 700, {leading: true, trailing: false});
  const debounceCancelBuy = _.debounce(cancelBuy, 700, {leading: true, trailing: false});
  const debounceCancelSell = _.debounce(cancelSell, 700, {leading: true, trailing: false});
  let networkArray = [];
  let maxMinArray = [];

  // const net = new brain.NeuralNetwork({
  //   activation: 'relu', // activation function
  //   hiddenLayers: [10,5],
  //   iterations: 20000,
  //   log: true,
  //   logPeriod: 10,
  //   learningRate: 0.5 // global learning rate, useful when training using streams
  // });
  //
  // net.train(trainingDataJson);

  let inputs = [];
  // Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  binance.websockets.candlesticks([settings[0].ticker], '1m', (candlesticks) => {
    let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
    let { o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
    settings[0].close = close;
    if (trace1.x.length > 2) {
      trace1.x.push(Date.now());
      trace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      maxMinArray.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      trace2.x.push(Date.now());
      trace2.y.push(calculateMovingAverage(close,trace2.y[trace2.y.length - 1], 7));
      trace3.x.push(Date.now());
      trace3.y.push(calculateMovingAverage(close,trace3.y[trace3.y.length - 1], 25));
      trace4.x.push(Date.now());
      trace4.y.push(calculateMovingAverage(close,trace4.y[trace4.y.length - 1], 99));
      trace5.x.push(Date.now());
      trace5.y.push(_.max(maxMinArray));
      trace6.x.push(Date.now());
      trace6.y.push(_.min(maxMinArray));
    } else {
      trace1.x.push(Date.now());
      trace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      trace2.x.push(Date.now());
      trace2.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      trace3.x.push(Date.now());
      trace3.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      trace4.x.push(Date.now());
      trace4.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      trace5.x.push(Date.now());
      trace5.y.push(_.max(trace1.y));
      trace6.x.push(Date.now());
      trace6.y.push(_.min(trace1.y));
    }
    let maxHigh = _.max(maxMinArray);
    let maxLow = _.min(maxMinArray);
    // if(trace2.y[trace2.y.length - 1] >= trace3.y[trace3.y.length - 1] && trace2.y[trace2.y.length - 1] > trace2.y[trace2.y.length - 2]) {
    //   for (var i = 0; i < 10; i++) {
    //     let minus = i + 2;
    //     const buyIndicator1 = parseFloat(trace1.y[trace1.y.length - 1]) - parseFloat(trace1.y[trace1.y.length - minus]);
    //     console.log('buyIndicator1: ', buyIndicator1);
    //     if (settings[0].state === 'trade' && (buyIndicator1 >= 1.50 && settings[0].buyOrderNum === null)) {
    //       console.log('place buy order at ', trace1.y[trace1.y.length - minus]);
    //       debounceBuy(parseFloat(trace1.y[trace1.y.length - 1]));
    //       break;
    //     }
    //   }
    // }

    if (settings[0].state === 'Bought Filled' || settings[0].state === null) {
      if (settings[0].buyPrice !== null && settings[0].sellOrderNum === null) {
        // for (var i = 0; i < trace1.y.length; i++) {
        //   let minus = i + 1;
        //   let sellIndicator = parseFloat(trace1.y[trace1.y.length - minus]) - parseFloat(settings[0].buyPrice);
        //   if (sellIndicator >= 1.50) {
            const sellPrice = parseFloat(settings[0].buyPrice) + 1.30;
            console.log('place sell order at ', parseFloat(settings[0].buyPrice) + 1.50);
            debounceSell(sellPrice);
            //break;
          //}
        //}
      }
    }

    if (trace2.y[trace2.y.length - 1] > trace3.y[trace3.y.length - 1] && (trace3.y[trace3.y.length - 1] > trace4.y[trace4.y.length - 1])) {
      //settings[0].state = 'trade';
      let buyIndicator2 = parseFloat(trace1.y[trace1.y.length - 1]) - parseFloat(trace1.y[trace1.y.length - 2]);
      console.log('buyIndicator2',buyIndicator2);
      let buyIndicator3 = parseFloat(maxHigh) - parseFloat(close);
      console.log('buyIndicator3',buyIndicator3);
      let buyIndicator4 = parseFloat(close) - parseFloat(maxLow);
      console.log('buyIndicator4', buyIndicator4);
      if (buyIndicator4 === 0.00 && (settings[0].buyOrderNum === null && (trace1.x.length > 40 && buyIndicator3 >= 1.30))) {
        console.log('place buy order at ', maxLow);
        debounceBuy(parseFloat(maxLow));
      }
    }



    // cancelBuyIndicator = settings[0].buyPrice - trace1.y[trace1.y.length - 1];
    // if (cancelBuyIndicator >= 1.50)

    inputs.push(getBinary(trace1.y[trace1.y.length - 1], trace1.y[trace1.y.length - 2]));
    inputs.push(getBinary(trace2.y[trace2.y.length - 1], trace2.y[trace2.y.length - 2]));
    inputs.push(getBinary(trace3.y[trace3.y.length - 1], trace3.y[trace3.y.length - 2]));
    inputs.push(getBinary(trace4.y[trace4.y.length - 1], trace4.y[trace4.y.length - 2]));

    // if (inputs.length >= 40) {
    //   inputs.splice(0, 4);
    //   trainingData.push({
    //     input: inputs,
    //     output: {
    //       wait: waitCommand,
    //       buy: buyCommand,
    //       sell: sellCommand
    //     }
    //   });
    //   waitCommand = 1;
    //   buyCommand = 0;
    //   sellCommand = 0;
    // }
    //
    //
    // if (trainingData >= 10) {
    //   trainingData.shift();
    // }

    if (trace1.x.length > 200) {
      trace1.x.shift();
      trace1.y.shift();
      trace2.x.shift();
      trace2.y.shift();
      trace3.x.shift();
      trace3.y.shift();
      trace4.x.shift();
      trace4.y.shift();
      trace5.x.shift();
      trace5.y.shift();
      trace6.x.shift();
      trace6.y.shift();
    }
    if (trace1.x.length > 10) {
      maxMinArray.shift();
    }

    io.emit('graphData', data);
    io.emit('botLog', null, trainingData);
    io.emit('botLog', symbol+' '+interval+' candlestick update');
    io.emit('botLog', 'close: '+close);
    io.emit('botLog', 'volume: '+volume);
    io.emit('botLog', 'state: '+settings[0].state);
    io.emit('botLog', 'BON: '+settings[0].buyOrderNum);
    io.emit('botLog', 'SON: '+settings[0].sellOrderNum);
    io.emit('botLog', 'HII: '+maxHigh);
    io.emit('botLog', 'LOW: '+maxLow);
    // let output = net.run(trainingData[trainingData.length - 1].input);
    // console.log('Output',output);
    // io.emit('botLog', 'ODB: '+output.buy);
    // io.emit('botLog', 'ODS: '+output.sell);
    // io.emit('botLog', 'ODW: '+output.wait);
    //console.log('net:', networkArray);
  });

  let x1 = [];
  let x2 = [];
  let quantityTrace1 = {
    x: x1,
    type: "histogram",
  };
  var quantityTrace2 = {
    x: x2,
    type: "histogram",
  };

  binance.websockets.trades([settings[0].ticker], function(trades) {
    let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;
    console.log(symbol+' trade update. price: '+price+', quantity: '+quantity+', maker: '+maker);
    if (maker) {
      buys.push({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      });
      x1.push(parseFloat(quantity));
    } else {
      sells.push({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      });
      x2.push(parseFloat(quantity));
    }
    let histoData = [quantityTrace1, quantityTrace2];
    io.emit('histoData', histoData);
    // if (buys.length >= settings[0].avlToStart) {
    //   spread = getSpread(buys[buys.length - 1], sells[sells.length - 1]);
    //   let averageBuyPrice = _.meanBy(buys, 'price');
    //   let averageSellPrice = _.meanBy(sells, 'price');
    //   let minBuyPrice = _.minBy(buys, 'price');
    //   // let averageSellPrice = _.meanBy(sells, 'price');
    //   let buyPrice = parseFloat(buys[buys.length - 1].price);
    //   currentSellPrice = parseFloat(sells[sells.length - 1].price);
    //   settings[0].bst = buyPrice - settings[0].buyPrice;
    //   settings[0].sst = currentSellPrice - settings[0].sellPrice;
    //   settings[0].buySellPad = spread * settings[0].buySellPadPercent;
    //   // console.log('buys:', buys.length, 'sells:', sells.length);
    //   // console.log('SPD:', spread);
    //   // console.log('BPR:', buyPrice);
    //   // console.log('SPR:', currentSellPrice.toFixed(settings[0].decimalPlace));
    //   // console.log('ABP:', averageBuyPrice.toFixed(settings[0].decimalPlace));
    //   // console.log('ASP:', averageSellPrice.toFixed(settings[0].decimalPlace));
    //   console.log('BST:', buyPrice - settings[0].buyPrice);
    //   // console.log('BON:', settings[0].buyOrderNum);
    //   console.log('SST:', currentSellPrice - settings[0].sellPrice);
    //   // console.log('SON:', settings[0].sellOrderNum);
    //   // console.log('STE:', settings[0].state);
    //   // console.log('MBP:', minBuyPrice.price);
    //
    //   if (buyPrice <= minBuyPrice.price && (spread >= settings[0].minSpread && settings[0].state === null)) {
    //   // if (spread >= settings[0].minSpread && settings[0].state === null) {
    //     //debounceBuy(buyPrice);
    //   } else if (settings[0].state === 'RelistSell' && settings[0].sstLimitEnable === true) {
    //     //debounceSell(parseFloat(buyPrice) + parseFloat(settings[0].spreadProfit));
    //   } else if (settings[0].bst >= settings[0].bstLimit && (settings[0].buyOrderNum !== null && settings[0].state !== 'buyPartialFill')) {
    //     debounceCancelBuy(settings[0].buyOrderNum);
    //   } else if (settings[0].sst <= settings[0].sstLimit && (settings[0].sellOrderNum !== null && (settings[0].state !== 'sellPartialFill' && settings[0].sstLimitEnable === true))) {
    //     // debounceCancelSell(settings[0].sellOrderNum);
    //   }
      if (sells.length >= settings[0].avlMax) {
        sells.shift();
      }
      if (buys.length >= settings[0].avlMax) {
        buys.shift();
      }
      if (x1.length > 1) {
        x1.shift();
        x2.shift();
      }
    // }
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
        settings[0].state = 'Bought Filled';
        return;
      } else if (side === 'SELL' && orderStatus === 'FILLED') {
        settings[0].state = null;
        settings[0].sellPrice = null;
        settings[0].sellOrderNum = null;
        settings[0].buyPrice = null;
        settings[0].buyOrderNum = null;
        return;
      } else if (side === 'BUY' && orderStatus === 'NEW') {
        settings[0].state = 'Buying';
        settings[0].buyPrice = price;
        settings[0].buyOrderNum = orderId;
        return;
      } else if (side === 'SELL' && orderStatus === 'NEW') {
        settings[0].state = 'Selling';
        settings[0].sellPrice = price;
        settings[0].sellOrderNum = orderId;
        return;
      } else if (side === 'BUY' && orderStatus === 'PARTIALLY_FILLED') {
        settings[0].state = 'buyPartialFill';
        return;
      } else if (side === 'SELL' && orderStatus === 'PARTIALLY_FILLED') {
        settings[0].state = 'sellPartialFill';
        return;
      } else if (side === 'SELL' && orderStatus === 'CANCELED') {
        settings[0].state = 'RelistSell';
        settings[0].sellPrice = null;
        settings[0].sellOrderNum = null;
        return;
      } else if (side === 'BUY' && orderStatus === 'CANCELED') {
        settings[0].state = null;
        settings[0].buyPrice = null;
        settings[0].buyOrderNum = null;
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
