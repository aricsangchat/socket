const binance = require('node-binance-api');

exports.stopSockets = (io) => {
  binance.options({
    'APIKEY':'zs4zBQPvwO9RW9aQd2FSDF8zNVZmFWTJajrczPvshygpXo00ft1ESlYyI3LI9hWU',
    'APISECRET':'oYtkOlUZlq8sS8pjU68JKQYeWwEaHxQI2g87x5akySl3OjVfiX40z0GcFu4VjCBV',
    'test': true,
    'reconnect': false
  });
  let endpoints = binance.websockets.subscriptions();
  for ( let endpoint in endpoints ) {
  	console.log(endpoint);
  	//binance.websockets.terminate(endpoint);
  }
}
