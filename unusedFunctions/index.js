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

const debounceBuy = _.debounce(placeBuyOrder, 1000, {leading: true, trailing: false});
const debounceSell = _.debounce(placeSellOrder, 1000, {leading: true, trailing: false});
const debounceCancelBuy = _.debounce(cancelBuy, 700, {leading: true, trailing: false});
const debounceCancelSell = _.debounce(cancelSell, 700, {leading: true, trailing: false});

function graphVolume(volume, io) {
  volumeTrace.x.push(Date.now());
  volumeTrace.y.push(parseFloat(parseFloat(volume).toFixed(settings[0].decimalPlace)));
  
  if (volumeTrace.x.length > 500) {
    volumeTrace.x.shift();
    volumeTrace.y.shift();
  }

  io.emit('volumeData', volumeData);
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