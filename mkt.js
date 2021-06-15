const array = require('lodash/array');
const { MKTE } = require('@mkt-eg/mkt')

const MKT = new MKTE('bbbc22c3a13c74456a6d4bb7ba5745476ebfdc81c867fc240258122b78eb6a6f')
MKT.historical({
sympolPrice: 'true',
e: 'CCCAGG',
fsym: 'ETH',
tsyms: 'USDT',
type: 'single',
aggregate: '5',
aggregatePredictableTimePeriods: true,
limit: 30,
allData: 'false',
extraParams: 'NotAvailable',
sign: 'false',
apiType: 'minute'
}).then((results)=>{
const data = JSON.stringify(results.data)
const options = {
rawData:data,
chunkSize:5,// split data into 5 series array
forcastList:array.chunk(rawData,5)[3], // Get The last series from data.
steps:30, // predicit the next 30 days
NNOptions: {
inputSize: 4,
hiddenLayers: [4,4],
outputSize: 4,
learningRate: 0.01,
decayRate: 0.999,
},
trainOptions:{
iterations: 20000, // the maximum times to iterate the training data --> number greater than 0
errorThresh: 0.005, // the acceptable error percentage from training data --> number between 0 and 1
log: true, // true to use console.log, when a function is supplied it is used --> Either true or a function
logPeriod: 10, // iterations between logging out --> number greater than 0
learningRate: 0.3, // scales with delta to effect training rate --> number between 0 and 1
momentum: 0.1, // scales with next layer's change value --> number between 0 and 1
callback: null, // a periodic call back that can be triggered while training --> null or function
callbackPeriod: 10, // the number of iterations through the training data between callback calls --> number greater than 0
timeout: Infinity // the max number of milliseconds to train for --> number greater than 0
}
}

console.log(MKT.predict(options))

})