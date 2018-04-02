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
    minSpread: 0.0200,
    spreadProfit: 0.0200,
    minProfit: 0.0300,
    decimalPlace: 4,
    avlToStart: 20,
    avlMax: 21,
    buyPad: 0.000000,
    sellPad: 0.000000,
    quantity: 2,
    globalTrendQuantity: 2,
    buyPrice: null,
    buyOrderNum: null,
    sellOrderNum: null,
    sellPrice: null,
    state: null,
    bst: null,
    sst: null,
    bstLimit: 0.0000,
    sstLimit: -0.0200,
    sstLimitEnable: false,
    buySellPad: 0,
    buySellPadPercent: 0,
    time: 2,
    startingAverage: null,
    close: null,
    trend: [],
    ema25Trend: [],
    reset: false,
    queue: [],
    amountOfBuys: null,
    amountOfSells: null,
    percentageTrend: [],
    orderTrend995: ['sold'],
    orderTrend99: [],
    orderTrend985: ['sold'],
    orderTrend98: ['sold'],
    orderTrend975: ['sold'],
    orderTrend97: ['sold'],
  }
];


let closetrace1 = {
  x: [],
  y: [],
  mode: 'markers',
  name: 'Cost'
};
let closetrace2 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'EMA7'
};
let closetrace3 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'EMA25'
};
let closetrace4 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'EMA99'
};
let closetrace5 = {
  x: [],
  y: [],
  mode: 'markers',
  name: 'Buy'
};
let closetrace6 = {
  x: [],
  y: [],
  mode: 'markers',
  name: 'Sell'
};
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
  mode: 'markers',
  name: 'Sell'
}
let trace6 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'Sell7'
}
let trace7 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'Sell25'
}
let trace8 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'Sell99'
}
let volumeTrace = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'Volume'
}
let openBuyOrders = [];
let openSellOrders = [];
let timeOut;
let boughtArray = [];

let webSocketData = [ trace1, trace2, trace3, trace4, trace5, trace6, trace7, trace8 ];
let volumeData = [volumeTrace];
let spread = null;
const debounceBuy = _.debounce(placeBuyOrder, 1000, {leading: true, trailing: false});
const debounceSell = _.debounce(placeSellOrder, 1000, {leading: true, trailing: false});
const debounceCancelBuy = _.debounce(cancelBuy, 700, {leading: true, trailing: false});
const debounceCancelSell = _.debounce(cancelSell, 700, {leading: true, trailing: false});
let spreadSellprice;
let globalTrendBuyPrice = null;
let engage = false;

exports.startProgram = (io) => {
  getSocketChartData('BNBUSDT', '1m', 'BNBUSDTEMA', io);
  engageTimeOut = setTimeout(function(){
    engage = true
  }, 300000);
  //getSocketChartData('BTCUSDT', '4h', 'BTCUSDTEMA', io);
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
  
  let startingAverageArray = [];
  let movingAverageArray = [];
  

    

  //Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  // binance.websockets.candlesticks([settings[0].ticker], '1m', (candlesticks) => {
  //   let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
  //   let { o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
  //   settings[0].close = close;
  //   graph1mCandleStick(close, io);
  //   graphVolume(volume, io);
  // });

  // binance.websockets.trades([settings[0].ticker], function(trades) {
  //   declareGlobalTrend(closetrace2.y[closetrace2.y.length - 1], closetrace3.y[closetrace3.y.length - 1], closetrace4.y[closetrace4.y.length - 1], closetrace4.y[closetrace4.y.length - 2]);
  //   let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;
  //   console.log(symbol+' trade update. price: '+price+', quantity: '+quantity+', maker: '+maker);

  //   if (maker) {
  //     buys.push({
  //       price: parseFloat(price),
  //       quantity: parseFloat(quantity)
  //     });
  //   } else {
  //     sells.push({
  //       price: parseFloat(price),
  //       quantity: parseFloat(quantity)
  //     });
  //   }

  //   //graphWebSocket(buys, sells, io, webSocketData);

    
  //   // if (trace6.y[trace6.y.length - 1] > trace7.y[trace7.y.length - 1] && (trace6.y[trace6.y.length - 1] >= trace6.y[trace6.y.length - 2] && trace7.y[trace7.y.length - 1] > trace8.y[trace8.y.length - 1])) {
  //   //   settings[0].trend = 'up';
  //   // } else {
  //   //   if (openBuyOrders.length > 0) {
  //   //     cancelBuys();
  //   //   }
  //   //   settings[0].trend = 'down';
  //   //   for (let index = 0; index < 20; index++) {
  //   //     clearTimeout(timeOut);
  //   //   }
  //   // }

  //   // if (trace1.y[trace1.y.length - 1] < trace1.y[trace1.y.length - 2] || trace5.y[trace1.y.length - 1] < trace5.y[trace5.y.length - 2]) {
  //   //   if (openBuyOrders.length > 0) {
  //   //     cancelBuys();
  //   //   }
  //   //   settings[0].trend = 'down';
  //   //   for (let index = 0; index < 20; index++) {
  //   //     clearTimeout(timeOut);
  //   //   }
  //   // } 

  //   if (buys.length >= settings[0].avlToStart) {
  //     currentSellPrice = parseFloat(sells[sells.length - 1].price).toFixed(settings[0].decimalPlace);
  //     handleBuySell(currentSellPrice);
  //     let buyPrice = parseFloat(buys[buys.length - 1].price);
  //     spread = parseFloat(sells[sells.length - 1].price) - parseFloat(buys[buys.length - 1].price);
  //     //placeSpreadOrder(spread, buyPrice);
  //     //handleOpenBuyOrder(buyPrice, spread);
  //     //handleOpenSellOrder(currentSellPrice);
  //     console.log('buys:', buys.length, 'sells:', sells.length);
  //     console.log('SPD:', spread);
  //     console.log('BPR:', buyPrice);
  //     console.log('SPR:', currentSellPrice);
  //     console.log('STE:', settings[0].state);
  //     console.log('TRD:', settings[0].trend[settings[0].trend.length - 1], settings[0].trend[settings[0].trend.length - 2]);
      
  //     // if ( spread >= settings[0].minSpread && (settings[0].state === null && settings[0].trend === 'up')) {
  //     //   timeOut = setTimeout(function(){ debounceBuy(buyPrice); }, 4000);
  //     // } 

  //     // if (boughtArray.length > 0) {
  //     //   boughtArray.forEach(buy => {
  //     //     if (settings[0].trend === 'up') {
  //     //       console.log('Going Up Still', buy);
  //     //     } else {
  //     //       placeSellOrders(buy.quantity, buy.orderId);
  //     //       buy.orderId = null;
  //     //     }
  //     //   });
  //     // }
    
  //     if (sells.length >= settings[0].avlMax) {
  //       sells.shift();
  //     }
  //     if (buys.length >= settings[0].avlMax) {
  //       buys.shift();
  //     }
  //     if (settings[0].trend.length > 5) {
  //       settings[0].trend.shift();
  //     }
  //   }
  // });

  // function balance_update(data) {
  //   // console.log('Balance Update');
  //   // for ( let obj of data.B ) {
  //   //   let { a:asset, f:available, l:onOrder } = obj;
  //   //   if ( available == '0.00000000' ) continue;
  //   //   console.log(asset+'\tavailable: '+available+' ('+onOrder+' on order)');
  //   // }
  // }
  // function execution_update(data) {
  //   let { x:executionType, s:symbol, p:price, q:quantity, S:side, o:orderType, i:orderId, X:orderStatus } = data;
  //   if (symbol === settings[0].ticker) {
  //     if ( executionType == 'NEW' ) {
  //       if ( orderStatus == 'REJECTED' ) {
  //         console.log('Order Failed! Reason: '+data.r);
  //         return;
  //       }
  //     }
  //     //NEW, CANCELED, REPLACED, REJECTED, TRADE, EXPIRED
  //     console.log(symbol+'\t'+side+' '+executionType+' '+orderType+' ORDER #'+orderId);
  //     console.log(symbol+' '+side+' '+orderType+' ORDER #'+orderId+' ('+orderStatus+')');
  //     console.log('..price: '+price+', quantity: '+quantity);

  //     if (side === 'BUY' && orderStatus === 'FILLED') {
  //       settings[0].state = null;
  //       // console.log('filled quantity: ',quantity);
  //       // placeSellOrder(parseFloat(price) + parseFloat(settings[0].spreadProfit));
  //       // if (parseFloat(quantity) === 2.00000000) {
  //       //   placeSellOrder(parseFloat(price) + parseFloat(settings[0].spreadProfit));
  //       // } else 
  //       if (parseFloat(quantity) === 3.00000000) {
  //         globalTrendBuyPrice = parseFloat(closetrace1.y[closetrace1.y.length - 1]);
  //       }
  //       // boughtArray.push({
  //       //   price: parseFloat(price),
  //       //   quantity: quantity,
  //       //   orderId: orderId
  //       // })
  //       return;
  //     } else if (side === 'SELL' && orderStatus === 'FILLED') {
  //       settings[0].state = null;
  //       settings[0].sellPrice = null;
  //       settings[0].sellOrderNum = null;
  //       settings[0].buyPrice = null;
  //       //settings[0].buyOrderNum = null;
  //       return;
  //     } else if (side === 'BUY' && orderStatus === 'NEW') {
  //       //placeSellOrder(parseFloat(price) + parseFloat(settings[0].spreadProfit));
  //       settings[0].state = 'Buying';
  //       settings[0].buyPrice = price;
  //       settings[0].buyOrderNum = orderId;
  //       // openBuyOrders.push({
  //       //   orderId: orderId,
  //       //   price: parseFloat(price)
  //       // });
  //       // let openBuys = [];
  //       // openBuyOrders.forEach(order => {
  //       //   if (order.orderId !== null) {
  //       //     openBuys.push(order);
  //       //   } 
  //       // });
  //       // openBuyOrders = openBuys;
  //       return;
  //     } else if (side === 'SELL' && orderStatus === 'NEW') {
  //       settings[0].state = null;
  //       settings[0].sellPrice = price;
  //       settings[0].sellOrderNum = orderId;
  //       // openSellOrders.push({
  //       //   orderId: orderId,
  //       //   price: parseFloat(price)
  //       // });
  //       // let openSells = [];
  //       // openSellOrders.forEach(order => {
  //       //   if (order.orderId !== null) {
  //       //     openSells.push(order);
  //       //   } 
  //       // });
  //       // openSellOrders = openSells;
  //       return;
  //     } else if (side === 'BUY' && orderStatus === 'PARTIALLY_FILLED') {
  //       // settings[0].state = 'buyPartialFill';
  //       return;
  //     } else if (side === 'SELL' && orderStatus === 'PARTIALLY_FILLED') {
  //       // settings[0].state = 'sellPartialFill';
  //       return;
  //     } else if (side === 'SELL' && orderStatus === 'CANCELED') {
  //       // settings[0].state = 'RelistSell';
  //       settings[0].sellPrice = null;
  //       settings[0].sellOrderNum = null;
  //       return;
  //     } else if (side === 'BUY' && orderStatus === 'CANCELED') {
  //       settings[0].state = null;
  //       settings[0].buyPrice = null;
  //       // settings[0].buyOrderNum = null;
  //       return;
  //     } else {
  //       return;
  //     }
  //   }
  // }
  // binance.websockets.userData(balance_update, execution_update);
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
    //console.log(util.inspect(sellResponse, { showHidden: true, depth: null }));
  });
}

function cancelBuy(orderNum) {
  binance.cancel(settings[0].ticker, orderNum, function(response, symbol) {
    console.log('Canceled order #: ', + orderNum);
  });
}

function cancelSell(orderNum, price) {
  binance.cancel(settings[0].ticker, orderNum, function(response, symbol) {
    console.log('Canceled order #: ', + orderNum);
    binance.marketSell(settings[0].ticker, settings[0].quantity.toFixed(settings[0].decimalPlace));
    //placeSellOrder(price + 0.0010);
  });
}

function cancelBuys() {
  if (openBuyOrders.length > 0) {
    openBuyOrders.forEach(order => {
      binance.cancel(settings[0].ticker, order.orderId, function(response, symbol) {
        console.log('Canceled order #: ', + order.orderId);
      });
    })
    openBuyOrders = [];
  }
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
    console.log('Buy Status:', order);
    if (bst.toFixed(settings[0].decimalPlace) > settings[0].bstLimit && order.orderId != null) {
      cancelBuy(order.orderId);
      order.orderId = null;
    }
  });
  cb();
}

function checkSellStatus(sellPrice) {
  openSellOrders.forEach(order => {
    let sst = sellPrice - order.price;
    console.log('SST:', sst.toFixed(settings[0].decimalPlace));
    console.log('Sell Status', order);
    if (sst.toFixed(settings[0].decimalPlace) < settings[0].sstLimit && order.orderId != null) {
      cancelSell(order.orderId, sellPrice);
      order.orderId = null;
    }
  });
}

function placeSellOrders(quantity, orderId) {
  binance.marketSell(settings[0].ticker, quantity);
  let openPurchases = [];
  boughtArray.forEach(buy => {
    if (buy.orderId !== orderId) {
      openPurchases.push(order);
    } 
  });
  boughtArray = openPurchases;
}

function declareGlobalTrend(trace1, trace2, trace3, trace3Prev) {
  if (trace1 >= trace2 && (trace2 >= trace3 && trace3 > trace3Prev)) {
    settings[0].trend.push('up');
  } else if (trace1 <= trace2 && trace2 <= trace3) {
    settings[0].trend.push('down');
    //cancelBuys();
  }
  // else if (trace1 < trace2 && trace2 > trace3) {
  //   settings[0].trend.push('correcting');
  //   cancelBuys();
  // } else if (trace1 > trace2 && trace2 < trace3) {
  //   settings[0].trend.push('bounce');
  // } 
}

// function handleBuySell(sellPrice) {
//   if (settings[0].trend[settings[0].trend.length - 1 ] === 'up' && settings[0].trend[settings[0].trend.length - 2 ] === 'down') {
//     // trend is going up
//     binance.marketBuy(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//   } else if (settings[0].trend[settings[0].trend.length - 1 ] === 'down' && settings[0].trend[settings[0].trend.length - 2 ] === 'up') {
//     // place sell order
//    // binance.marketSell(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//    placeSellOrder(parseFloat(sellPrice + 0.0050));
//   } else if (settings[0].trend[settings[0].trend.length - 1 ] === 'up' && (settings[0].trend[settings[0].trend.length - 4 ] === 'up' && globalTrendBuyPrice !== null)) {
//     takeProfit(parseFloat(sellPrice));
//     console.log('take profit');
//   }
//   // else if (settings[0].trend[settings[0].trend.length - 1 ] === 'up' && settings[0].trend[settings[0].trend.length - 2 ] === 'bounce') {
//   //   // trend is going up
//   //   binance.marketBuy(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//   // }  else if (settings[0].trend[settings[0].trend.length - 1 ] === 'correcting' && settings[0].trend[settings[0].trend.length - 2 ] === 'up') {
//   //   // place sell order
//   //   binance.marketSell(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//   // } 
   
//   // else if (settings[0].reset && settings[0].trend[settings[0].trend.length - 1 ] === 'up') {
//     // binance.marketBuy(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//     // settings[0].reset = false;
//   // }
// }

function placeSpreadOrder(spread, buyPrice) {
  if (spread >= settings[0].minSpread && (settings[0].trend[settings[0].trend.length - 1 ] === 'up' || settings[0].trend[settings[0].trend.length - 1 ] === 'bounce')) {
    if (settings[0].state === null) {
    // spreadSellprice = parseFloat(buyPrice) + parseFloat(settings[0].spreadProfit);
    debounceBuy(buyPrice);
    }
  }
}

function handleOpenBuyOrder(buyPrice, spread) {
  if (openBuyOrders.length > 0) {
    checkBuyStatus(buyPrice, () => {
      if ( spread >= settings[0].minSpread && (settings[0].state === null && settings[0].trend === 'up')) {
        // timeOut = setTimeout(function(){ debounceBuy(buyPrice); }, 4000);
        debounceBuy(buyPrice);
      }
    });
  }
}

function handleOpenSellOrder(currentSellPrice) {
  if (openSellOrders.length > 0 && (settings[0].trend[settings[0].trend.length - 1 ] === 'correcting' || settings[0].trend[settings[0].trend.length - 1 ] === 'down')) {
    checkSellStatus(currentSellPrice);
  }
}

function graph1mCandleStick(close, io) {
  let closeData = [ closetrace1, closetrace2, closetrace3, closetrace4 ];

  if (closetrace1.x.length > 2) {
    closetrace1.x.push(Date.now());
    closetrace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace2.x.push(Date.now());
    closetrace2.y.push(calculateMovingAverage(close,closetrace2.y[closetrace2.y.length - 1], 7));
    closetrace3.x.push(Date.now());
    closetrace3.y.push(calculateMovingAverage(close,closetrace3.y[closetrace3.y.length - 1], 25));
    closetrace4.x.push(Date.now());
    closetrace4.y.push(calculateMovingAverage(close,closetrace4.y[closetrace4.y.length - 1], 99));
  } else {
    closetrace1.x.push(Date.now());
    closetrace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace2.x.push(Date.now());
    closetrace2.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace3.x.push(Date.now());
    closetrace3.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace4.x.push(Date.now());
    closetrace4.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
  }
  if (trace1.x.length > 500) {
    closetrace1.x.shift();
    closetrace1.y.shift();
    closetrace2.x.shift();
    closetrace2.y.shift();
    closetrace3.x.shift();
    closetrace3.y.shift();
    closetrace4.x.shift();
    closetrace4.y.shift();
  }

  io.emit('closeData', closeData);
}

function graphVolume(volume, io) {
  volumeTrace.x.push(Date.now());
  volumeTrace.y.push(parseFloat(parseFloat(volume).toFixed(settings[0].decimalPlace)));
  
  if (volumeTrace.x.length > 500) {
    volumeTrace.x.shift();
    volumeTrace.y.shift();
  }

  io.emit('volumeData', volumeData);
}

function graphWebSocket(buys, sells, io, webSocketData) {

  if (trace1.x.length > 2) {
    trace1.x.push(Date.now());
    trace1.y.push(parseFloat(parseFloat(buys[buys.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace2.x.push(Date.now());
    trace2.y.push(calculateMovingAverage(buys[buys.length - 1].price,trace2.y[trace2.y.length - 1], 7));
    trace3.x.push(Date.now());
    trace3.y.push(calculateMovingAverage(buys[buys.length - 1].price,trace3.y[trace3.y.length - 1], 25));
    trace4.x.push(Date.now());
    trace4.y.push(calculateMovingAverage(buys[buys.length - 1].price,trace4.y[trace4.y.length - 1], 99));
    trace5.x.push(Date.now());
    trace5.y.push(parseFloat(parseFloat(sells[sells.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace6.x.push(Date.now());
    trace6.y.push(calculateMovingAverage(sells[sells.length - 1].price,trace6.y[trace6.y.length - 1], 7));
    trace7.x.push(Date.now());
    trace7.y.push(calculateMovingAverage(sells[sells.length - 1].price,trace7.y[trace7.y.length - 1], 25));
    trace8.x.push(Date.now());
    trace8.y.push(calculateMovingAverage(sells[sells.length - 1].price,trace8.y[trace8.y.length - 1], 99));
  } else {
    trace1.x.push(Date.now());
    trace1.y.push(parseFloat(parseFloat(buys[buys.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace2.x.push(Date.now());
    trace2.y.push(parseFloat(parseFloat(buys[buys.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace3.x.push(Date.now());
    trace3.y.push(parseFloat(parseFloat(buys[buys.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace4.x.push(Date.now());
    trace4.y.push(parseFloat(parseFloat(buys[buys.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace5.x.push(Date.now());
    trace5.y.push(parseFloat(parseFloat(sells[sells.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace6.x.push(Date.now());
    trace6.y.push(parseFloat(parseFloat(sells[sells.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace7.x.push(Date.now());
    trace7.y.push(parseFloat(parseFloat(sells[sells.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace8.x.push(Date.now());
    trace8.y.push(parseFloat(parseFloat(sells[sells.length - 1].price).toFixed(settings[0].decimalPlace)));
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
    trace5.x.shift();
    trace5.y.shift();
    trace6.x.shift();
    trace6.y.shift();
    trace7.x.shift();
    trace7.y.shift();
    trace8.x.shift();
    trace8.y.shift();
  }

  io.emit('graphData', webSocketData);
}

function takeProfit(sellPrice) {
  const availableProfit = parseFloat(sellPrice) - parseFloat(globalTrendBuyPrice);
  console.log('take profit: ', sellPrice, globalTrendBuyPrice);
  console.log('available Profit:',availableProfit);
  if ( availableProfit > settings[0].minProfit) {
    binance.sell(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace), sellPrice.toFixed(settings[0].decimalPlace), {}, sellResponse => {
      console.log('Sold @:', sellPrice);
      // console.log('Sold order id: ' + sellResponse.orderId);
      //console.log(util.inspect(sellResponse, { showHidden: true, depth: null }));
    });
    //settings[0].reset = true;
    //settings[0].trend = [];
    globalTrendBuyPrice = null;
  }
}

function graphEma(close, time, io, chartName) {

  let closeData = [ closetrace1, closetrace2, closetrace3, closetrace4, closetrace5, closetrace6 ];
  if (closetrace1.x.length > 2) {
    closetrace1.x.push(time);
    closetrace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace2.x.push(time);
    closetrace2.y.push(calculateMovingAverage(close,closetrace2.y[closetrace2.y.length - 1], 7));
    closetrace3.x.push(time);
    closetrace3.y.push(calculateMovingAverage(close,closetrace3.y[closetrace3.y.length - 1], 25));
    closetrace4.x.push(time);
    closetrace4.y.push(calculateMovingAverage(close,closetrace4.y[closetrace4.y.length - 1], 99));
    mapPercentage(closetrace1.y, closetrace2.y, closetrace3.y, closetrace4.y, closetrace5.y, closetrace6.y, time, close, io);
    declareTrend(closetrace1.y, closetrace2.y, closetrace3.y, closetrace4.y, closetrace5.y, closetrace6.y, time, close );
  } else {
    closetrace1.x.push(time);
    closetrace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace2.x.push(time);
    closetrace2.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace3.x.push(time);
    closetrace3.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace4.x.push(time);
    closetrace4.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    mapPercentage(closetrace1.y, closetrace2.y, closetrace3.y, closetrace4.y, closetrace5.y, closetrace6.y, time, close, io);
    declareTrend(closetrace1.y, closetrace2.y, closetrace3.y, closetrace4.y, closetrace5.y, closetrace6.y, time, close );
  }
  handleBuySell(time, close);
  
  console.log('sum5:', _.sum(closetrace5.y));
  console.log('sum6:', _.sum(closetrace6.y));
  console.log('profit:', parseFloat(_.sum(closetrace6.y)) - parseFloat(_.sum(closetrace5.y)))
  io.emit(chartName, closeData);
}

function getSocketChartData(ticker, interval, chartName, io) {
  let chartData = null;
  binance.websockets.chart(ticker, interval, (symbol, interval, chart) => {
    let tick = binance.last(chart);
    const last = chart[tick].close;
    //console.log(chart);
    chartData = chart;

    //console.log(result[0]);
    // Optionally convert 'chart' object to array:
    // let ohlc = binance.ohlc(chart);
    // console.log(symbol, ohlc);
    console.log(chart[tick]);
    if (chart[tick].hasOwnProperty('isFinal') === false) {
      graphEma(parseFloat(chart[tick].close), Date.now(), io, chartName);
    }
    console.log(symbol+" last price: "+last);
  });

  timeOut = setTimeout(function(){
    Object.keys(chartData).map(function(key) {
      
      graphEma(parseFloat(chartData[key].close), parseFloat(key), io, chartName)
      
      //return [{[key]: chartData[key]}];
    });
  }, 4000);
}

function declareTrend(trace1, trace2, trace3, trace4, trace5, trace6, time, close) {
  if (trace2[trace2.length - 1] > trace3[trace3.length - 1] && trace3[trace3.length - 1] > trace4[trace4.length - 1]) {
    settings[0].trend.push('up');
  } else if (trace2[trace2.length - 1] < trace3[trace3.length - 1] && trace3[trace3.length - 1] < trace4[trace4.length - 1]) {
    settings[0].trend.push('down');
  }
  
  if (settings[0].trend.length > 5) {
    settings[0].trend.shift();
  }
}

let openOrders = [];
function handleBuySell(time, close) {
  if (percentageTrace2Trace4.y[percentageTrace2Trace4.y.length - 1] > percentageTrace3Trace4.y[percentageTrace3Trace4.y.length - 1] && (settings[0].percentageTrend[settings[0].percentageTrend.length - 1 ] === 'down' && settings[0].percentageTrend[settings[0].percentageTrend.length - 2 ] === 'up')) {
    // sell
    if (percentageTrace2Trace4.y[percentageTrace2Trace4.y.length - 1 ] > 100.1) {
      
        settings[0].orderTrend99.forEach((boughtOrder, i) => {
          if (parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)) > parseFloat(boughtOrder)) {

            closetrace6.x.push(time);
            closetrace6.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
            settings[0].orderTrend99[i] = null;
            if (engage === true) {
              binance.marketSell(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
            }
          }
        });
        settings[0].orderTrend99.forEach(order => {
          if (order !== null) {
            openOrders.push(order);
          } 
        });
      settings[0].orderTrend99 = openOrders;
      openOrders = [];
      console.log('sot',settings[0].orderTrend99);
      console.log('OO',openOrders);
    }
  } else if (percentageTrace2Trace4.y[percentageTrace2Trace4.y.length - 1] < percentageTrace3Trace4.y[percentageTrace3Trace4.y.length - 1] && (settings[0].percentageTrend[settings[0].percentageTrend.length - 1 ] === 'up' && settings[0].percentageTrend[settings[0].percentageTrend.length - 2 ] === 'down')) {
    // buy
    if (percentageTrace2Trace4.y[percentageTrace2Trace4.y.length - 1 ] < 99.9) {
      settings[0].orderTrend99.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      closetrace5.x.push(time);
      closetrace5.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));

      if (engage === true) {
        binance.marketBuy(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
      }
    }
    
  }
}
let percentageTrace2Trace3 = {
  x: [],
  y: [],
  mode: 'markers',
  name: 'Percentage'
};
let percentageTrace2Trace4 = {
  x: [],
  y: [],
  mode: 'markers',
  name: 'Percentage'
};
let percentageTrace3Trace4 = {
  x: [],
  y: [],
  mode: 'markers',
  name: 'Percentage'
};

function mapPercentage(trace1, trace2, trace3, trace4, trace5, trace6, time, close, io) {
  
  let percentageData = [ percentageTrace2Trace3, percentageTrace2Trace4, percentageTrace3Trace4 ];
  percentageTrace2Trace3.x.push(time);
  percentageTrace2Trace3.y.push(parseFloat(trace2[trace2.length - 1])/parseFloat(trace3[trace3.length - 1]) * 100);
  percentageTrace2Trace4.x.push(time);
  percentageTrace2Trace4.y.push(parseFloat(trace2[trace2.length - 1])/parseFloat(trace4[trace4.length - 1]) * 100);
  percentageTrace3Trace4.x.push(time);
  percentageTrace3Trace4.y.push(parseFloat(trace3[trace3.length - 1])/parseFloat(trace4[trace4.length - 1]) * 100);
  declarePercentageTrend(percentageTrace2Trace4.y);
  io.emit('PercentageChart', percentageData);
}

function declarePercentageTrend(trace) {
  if (trace[trace.length - 1] > trace[trace.length - 2]) {
    settings[0].percentageTrend.push('up');
  } else {
    settings[0].percentageTrend.push('down');
  }
  if (settings[0].percentageTrend.length > 60) {
    settings[0].percentageTrend.shift();
  }
}