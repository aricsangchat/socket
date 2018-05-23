exports.setTradeSpeed = (speed) => {
  if (speed === 'aggressive') {
    return {
      one: 99.90,
      five: 99.70,
      ten: 99.50,
    }
  } else if (speed === 'conservative') {
    return {
      one: 99.00,
      five: 98.90,
      ten: 98.80,
    }
  }
}

exports.outputCommand = (io, command) => {
  if (command === 'manual sell') {
    settings[0].orderTrend99 = [];
    settings[0].orderTrend97 = [];
    settings[0].orderTrend95 = [];
  } else if (command.includes('engage')) {
    let output = command.split(' ');
    engage = output[1];
  } else if (command.includes('speed')) {
    let speed = command.split(' ');
    settings[0].tradeSpeedObj = helpers.setTradeSpeed(speed[1])
  }
  console.log(command);
}

exports.stopSockets = (io) => {
  let endpoints = binance.websockets.subscriptions();
  for ( let endpoint in endpoints ) {
    io.emit('botLog', 'Socket Endpoints: '+endpoint);
  	console.log(endpoint);
  	binance.websockets.terminate(endpoint);
  }
}

exports.calculateMovingAverage = (price,prevEMA,time) => {
  if (prevEMA.length === 0) {
    return price * 2/(time+1) + price * (1-2/(time+1));
  } else {
    return price * 2/(time+1) + prevEMA * (1-2/(time+1));
  }
}