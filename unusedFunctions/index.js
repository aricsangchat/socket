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