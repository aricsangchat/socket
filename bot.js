const binance = require('node-binance-api');
const schedule = require('node-schedule');
const util = require('util');
const _ = require('lodash');
const moment = require('moment');
const json2csv = require('json2csv');
const fs = require('fs');
const brain = require('brain.js');
const helpers = require('./helpers/helpers.js');

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
    quantity: 40,
    globalTrendQuantity: 40,
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
    tradeSpeed: 'conservative',
    tradeSpeedObj: {}
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
  name: 'UpDownBuy'
}
let trace8 = {
  x: [],
  y: [],
  mode: 'lines',
  name: 'UpDownSell'
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
  settings[0].tradeSpeedObj = helpers.setTradeSpeed(settings[0].tradeSpeed)
  getSocketChartData('BNBUSDT', '1m', 'BNBUSDTEMA', io);
  engageTimeOut = setTimeout(function(){
    engage = true
  }, 300000);

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
  
};


function placeBuyOrder(price, quantity) {
  binance.buy(settings[0].ticker, quantity, parseFloat(price), {}, buyResponse => {
    console.log('Bought @:', parseFloat(price));
    //console.log('Buy order id: ' + buyResponse);
    //console.log(util.inspect(buyResponse, { showHidden: true, depth: null }));
  });
}

function placeSellOrder(price, quantity) {
  binance.sell(settings[0].ticker, quantity, parseFloat(price), {}, sellResponse => {
    console.log('Sold @:', parseFloat(price));
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
    closetrace2.y.push(helpers.calculateMovingAverage(close,closetrace2.y[closetrace2.y.length - 1], 7));
    closetrace3.x.push(Date.now());
    closetrace3.y.push(helpers.calculateMovingAverage(close,closetrace3.y[closetrace3.y.length - 1], 25));
    closetrace4.x.push(Date.now());
    closetrace4.y.push(helpers.calculateMovingAverage(close,closetrace4.y[closetrace4.y.length - 1], 99));
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
    trace2.y.push(helpers.calculateMovingAverage(buys[buys.length - 1].price,trace2.y[trace2.y.length - 1], 7));
    trace3.x.push(Date.now());
    trace3.y.push(helpers.calculateMovingAverage(buys[buys.length - 1].price,trace3.y[trace3.y.length - 1], 25));
    trace4.x.push(Date.now());
    trace4.y.push(helpers.calculateMovingAverage(buys[buys.length - 1].price,trace4.y[trace4.y.length - 1], 99));
    trace5.x.push(Date.now());
    trace5.y.push(parseFloat(parseFloat(sells[sells.length - 1].price).toFixed(settings[0].decimalPlace)));
    trace6.x.push(Date.now());
    trace6.y.push(helpers.calculateMovingAverage(sells[sells.length - 1].price,trace6.y[trace6.y.length - 1], 7));
    trace7.x.push(Date.now());
    trace7.y.push(helpers.calculateMovingAverage(sells[sells.length - 1].price,trace7.y[trace7.y.length - 1], 25));
    trace8.x.push(Date.now());
    trace8.y.push(helpers.calculateMovingAverage(sells[sells.length - 1].price,trace8.y[trace8.y.length - 1], 99));
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

function graphEma(close, time, io, chartName, last) {

  let closeData = [ closetrace1, closetrace2, closetrace3, closetrace4, closetrace5, closetrace6 ];
  if (closetrace1.x.length > 2) {
    closetrace1.x.push(time);
    closetrace1.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
    closetrace2.x.push(time);
    closetrace2.y.push(helpers.calculateMovingAverage(close,closetrace2.y[closetrace2.y.length - 1], 7));
    closetrace3.x.push(time);
    closetrace3.y.push(helpers.calculateMovingAverage(close,closetrace3.y[closetrace3.y.length - 1], 25));
    closetrace4.x.push(time);
    closetrace4.y.push(helpers.calculateMovingAverage(close,closetrace4.y[closetrace4.y.length - 1], 99));
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
  handleBuySell(time, close, last);
  //handleUpDownBuySell(time, close, last);
  
  console.log('sum5:', _.sum(closetrace5.y));
  console.log('sum6:', _.sum(closetrace6.y));
  console.log('profit:', parseFloat(_.sum(closetrace6.y)) - parseFloat(_.sum(closetrace5.y)));
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
    //console.log(chart[tick]);
    if (chart[tick].hasOwnProperty('isFinal') === false) {
      graphEma(parseFloat(chart[tick].close), Date.now(), io, chartName, last);
    }
    //console.log(symbol+" last price: "+last);
    io.emit('botLog', 'Engage: '+ engage);
    io.emit('botLog', 'Speed: '+ settings[0].tradeSpeed);
  });

  timeOut = setTimeout(function(){
    Object.keys(chartData).map(function(key) {
      
      graphEma(parseFloat(chartData[key].close), parseFloat(key), io, chartName);
      
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

let openOrders99 = [];
let openOrders97 = [];
let openOrders95 = [];

function handleBuySell(time, close, last) {
  if (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 1 ] === 'up' && (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 1 ] === 'up' && percentageTrace2Trace3.y[percentageTrace2Trace3.y.length - 1 ] > 99)) {
    // sell openOrders 99
    settings[0].orderTrend99.forEach((boughtOrder, i) => {
      if (parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)) > parseFloat(boughtOrder) + 0.06) {

        closetrace6.x.push(time);
        closetrace6.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
        settings[0].orderTrend99[i] = null;
        if (engage === true) {
          binance.marketSell(settings[0].ticker, 1);
          //placeSellOrder(close, 1);
        }
      }
    });
    settings[0].orderTrend99.forEach(order => {
      if (order !== null) {
        openOrders99.push(order);
      } 
    });
    settings[0].orderTrend99 = openOrders99;
    openOrders99 = [];

    // sell openOrders 97
    settings[0].orderTrend97.forEach((boughtOrder, i) => {
      if (parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)) > parseFloat(boughtOrder) + 0.07) {
        for (let index = 0; index < 5; index++) {
          closetrace6.x.push(time);
          closetrace6.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
        }
        settings[0].orderTrend97[i] = null;
        if (engage === true) {
          binance.marketSell(settings[0].ticker, 5);
          //placeSellOrder(close, 5);
        }
      }
    });
    settings[0].orderTrend97.forEach(order => {
      if (order !== null) {
        openOrders97.push(order);
      } 
    });
    settings[0].orderTrend97 = openOrders97;
    openOrders97 = [];

    // sell openOrders 95
    settings[0].orderTrend95.forEach((boughtOrder, i) => {
      if (parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)) > parseFloat(boughtOrder) + 0.08) {
        for (let index = 0; index < 10; index++) {
          closetrace6.x.push(time);
          closetrace6.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
        }
        settings[0].orderTrend95[i] = null;
        if (engage === true) {
          binance.marketSell(settings[0].ticker, 10);
          //placeSellOrder(close, 10);
        }
      }
    });
    settings[0].orderTrend95.forEach(order => {
      if (order !== null) {
        openOrders95.push(order);
      } 
    });
    settings[0].orderTrend95 = openOrders95;
    openOrders95 = [];
    
  }
  if (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 1 ] === 'down' && (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 2 ] === 'up' && percentageTrace2Trace3.y[percentageTrace2Trace3.y.length - 1 ] < settings[0].tradeSpeedObj.one)) {
    // buy 1 qty 
    if (settings[0].orderTrend99.length < 10) {
      settings[0].orderTrend99.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      closetrace5.x.push(time);
      closetrace5.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));

      if (engage === true) {
        binance.marketBuy(settings[0].ticker, 1);
        //placeBuyOrder(close, 1);
      }
    } 
  } 
  if (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 1 ] === 'down' && (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 2 ] === 'up' && percentageTrace2Trace3.y[percentageTrace2Trace3.y.length - 1 ] < settings[0].tradeSpeedObj.five)) {
    // buy 5 qty
    if (settings[0].orderTrend97.length < 4) {
      settings[0].orderTrend97.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      for (let index = 0; index < 5; index++) {
        closetrace5.x.push(time);
        closetrace5.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      }

      if (engage === true) {
        binance.marketBuy(settings[0].ticker, 5);
        //placeBuyOrder(close, 5);
      }
    } 
  }
  if (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 1 ] === 'down' && (settings[0].bluePercentageTrend[settings[0].bluePercentageTrend.length - 2 ] === 'down' && percentageTrace2Trace3.y[percentageTrace2Trace3.y.length - 1 ] < settings[0].tradeSpeedObj.ten)) {
    // buy 10 qty
    if (settings[0].orderTrend95.length < 4) {
      settings[0].orderTrend95.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      for (let index = 0; index < 10; index++) {
        closetrace5.x.push(time);
        closetrace5.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
      }
      

      if (engage === true) {
        binance.marketBuy(settings[0].ticker, 10);
        //placeBuyOrder(close, 10);
      }
    } 
  }
  console.log('sot99',settings[0].orderTrend99);
  console.log('sot97',settings[0].orderTrend97);
  console.log('sot95',settings[0].orderTrend95);
  console.log('OO99',openOrders99);
  console.log('OO97',openOrders97);
  console.log('OO95',openOrders95);
}

// function handleUpDownBuySell(time, close, last) {
//   if (settings[0].greenPercentageTrend[settings[0].orangePercentageTrend.length - 1 ] === 'down' && (settings[0].orderTrend99.length > 0 && (settings[0].orangePercentageTrend[settings[0].orangePercentageTrend.length - 4 ] === 'up' && percentageTrace2Trace4.y[percentageTrace2Trace4.y.length - 1 ] > parseFloat(percentageTrace3Trace4.y[percentageTrace3Trace4.y.length - 1 ]) + 0.00))) {
//     // sell
//     settings[0].orderTrend99.forEach((boughtOrder, i) => {
//       //if (parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)) > parseFloat(boughtOrder) + 0.04) {

//         closetrace6.x.push(time);
//         closetrace6.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
//         settings[0].orderTrend99[i] = null;
//         if (engage === true) {
//           binance.marketSell(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//         }
//       //}
//     });
//     settings[0].orderTrend99.forEach(order => {
//       if (order !== null) {
//         openOrders.push(order);
//       } 
//     });
//     settings[0].orderTrend99 = openOrders;
//     openOrders = [];
    
//   } else if (settings[0].orangePercentageTrend[settings[0].orangePercentageTrend.length - 1 ] === 'down' && (settings[0].orangePercentageTrend[settings[0].orangePercentageTrend.length - 4 ] === 'up' && percentageTrace2Trace4.y[percentageTrace2Trace4.y.length - 1] < parseFloat(percentageTrace3Trace4.y[percentageTrace3Trace4.y.length - 1 ]) - 0.0)) {
//     // buy
//     if (settings[0].orderTrend99.length < 1) {
//       settings[0].orderTrend99.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
//       closetrace5.x.push(time);
//       closetrace5.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));

//       if (engage === true) {
//         binance.marketBuy(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//       }
//     } 
//   } 
//   // else if (settings[0].percentageTrend[settings[0].percentageTrend.length - 1 ] === 'down' && (settings[0].percentageTrend[settings[0].percentageTrend.length - 2 ] === 'up' && percentageTrace2Trace3.y[percentageTrace2Trace3.y.length - 1 ] < 99.75)) {
//   //   // buy
//   //   if (settings[0].orderTrend99.length <= 10) {
//   //     settings[0].orderTrend99.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
//   //     closetrace5.x.push(time);
//   //     closetrace5.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));

//   //     if (engage === true) {
//   //       binance.marketBuy(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//   //     }
//   //   } 
//   // } else if (settings[0].percentageTrend[settings[0].percentageTrend.length - 1 ] === 'down' && (settings[0].percentageTrend[settings[0].percentageTrend.length - 2 ] === 'down' && percentageTrace2Trace3.y[percentageTrace2Trace3.y.length - 1 ] < 99.55)) {
//   //   // buy
//   //   if (settings[0].orderTrend99.length <= 20) {
//   //     settings[0].orderTrend99.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));
//   //     closetrace5.x.push(time);
//   //     closetrace5.y.push(parseFloat(parseFloat(close).toFixed(settings[0].decimalPlace)));

//   //     if (engage === true) {
//   //       binance.marketBuy(settings[0].ticker, settings[0].globalTrendQuantity.toFixed(settings[0].decimalPlace));
//   //     }
//   //   } 
//   // }
//   console.log('sot',settings[0].orderTrend99);
//   console.log('OO',openOrders);
// }
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
  percentageTrace3Trace4.x.push(time - 0000);
  percentageTrace3Trace4.y.push(parseFloat(trace3[trace3.length - 1])/parseFloat(trace4[trace4.length - 1]) * 100);
  declarePercentageTrend(percentageTrace2Trace3.y, settings[0].bluePercentageTrend);
  declarePercentageTrend(percentageTrace2Trace4.y, settings[0].orangePercentageTrend);
  declarePercentageTrend(percentageTrace3Trace4.y, settings[0].greenPercentageTrend);
  io.emit('PercentageChart', percentageData);
}

function declarePercentageTrend(trace, trend) {
  if (trace[trace.length - 1] > trace[trace.length - 2]) {
    trend.push('up');
  } else {
    trend.push('down');
  }
  if (trend.length > 60) {
    trend.shift();
  }
}