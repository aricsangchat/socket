var express = require('express');
var app = express();
const axios = require('axios');
var http = require('http').Server(app);
var io = require('socket.io')(http);
const _ = require('lodash');
var port = process.env.PORT || 3000;
let config = '';
if (port === 3000) {
    config = require('../config.json');
}
const Binance = require('node-binance-api');
const TRIX = require('technicalindicators').TRIX;
const MACD = require('technicalindicators').MACD;
const EMA = require('technicalindicators').EMA;

const binance = new Binance().options({
    APIKEY: process.env.bkey ? process.env.bkey : config.BINANCE_APIKEY,
    APISECRET: process.env.bsec ? process.env.bsec : config.BINANCE_APISECRET,
    test: true,
    reconnect: true
});

function Bot(symbol, tf, socket) {

    const pair = symbol;
    const timeframe = tf;
    let hasCachedDataExecuted = false;
    let isFinal = false;
    let skipFirstTick = false;

    // let data = {
    //     open: [],
    //     high: [],
    //     low: [],
    //     close: [],
    //     volume: [],
    //     time: [],
    //     sma: [],
    //     mfi: [],
    //     fi: [],
    //     rsi: [],
    //     secondRSI: [],
    //     vwap: [],
    //     vwapCrossOver: [],
    //     long: [],
    //     short: [],
    //     positiveCashFlow: [],
    //     negativeCashFlow: [],
    //     obv: [],
    //     kst: [],
    //     kstSignal: [],
    //     kstCrossOver: [],
    //     adx: [],
    //     rsiCrossOver: [],
    //     liveOpenLongs: [],
    //     liveOpenShorts: [],
    //     kstGap: [],
    //     kstUpDown: [],
    //     kstSignalUpDown: [],
    //     currentPosition: [],
    //     trix: [],
    //     trixUpDown: [],
    //     doji: [],
    //     bullish: [],
    //     trixGap: [],
    //     trixGapUpDown: [],
    //     trixGapEntryExit: [],
    //     oneHourLong: [],
    //     oneHourShort: [],
    //     oneHourCurrent: [],
    //     streamBid: [],
    //     streamAsk: [],
    //     macdSignal: [],
    //     macd: []
    // }

    // ## HELPER FUNCTIONS

    const convertUnixToTimestamp = (unix) => {
        var d = new Date(unix).toLocaleString();
        return d;
    }

    const offsetPeriod = (period, data) => {
        for (let index = 0; index <= period; index++) {
            data.unshift(0)
        }
    }

    // ## INDICATORS

    const calcMACD = (data) => {
        let values = [];
        data.macd = [];
        data.macdSignal = [];

        for (let index = 0; index < data.close.length; index++) {
            values.push(data.close[index].y)

        }
        let input = {
            values: values,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        };

        let output = MACD.calculate(input);
        offsetPeriod(24, output)

        for (let index = 0; index < data.time.length; index++) {
            data.macd.push({ x: data.time[index], y: output[index].MACD })
            data.macdSignal.push({ x: data.time[index], y: output[index].signal })
        }
    }

    const calcEMA = (data, period) => {
        let closeData = [];
        data.ema[period.toString()] = [];

        for (let index = 0; index < data.close.length; index++) {
            closeData.push(data.close[index].y)
        }
        
        let output = EMA.calculate({period : period, values : closeData})
        //console.log(output.length, closeData.length)
        offsetPeriod(closeData.length - output.length - 1, output)
        //console.log(output.length, closeData.length)

        for (let index = 0; index < data.time.length; index++) {
            data.ema[period.toString()].push({ x: data.time[index], y: output[index] })
        }
    }

    const calcTRIX = (data) => {
        let values = [];
        data.trix = [];
        data.trixUpDown = [];
        for (let index = 0; index < data.close.length; index++) {
            values.push(data.close[index].y)

        }
        let input = {
            values: values,
            period: 18
        };

        let output = TRIX.calculate(input);
        offsetPeriod(51, output)

        for (let index = 0; index < data.time.length; index++) {
            data.trix.push({ x: data.time[index], y: output[index] })
        }

        for (let index = 0; index < data.trix.length; index++) {
            if (data.trix[index].y !== 0 && data.trix[index - 1].y !== 0) {
                if (data.trix[index].y > data.trix[index - 1].y) {
                    data.trixUpDown.push({ x: convertUnixToTimestamp(data.time[index]), y: "up" })
                } else if (data.trix[index].y === data.trix[index - 1].y) {
                    data.trixUpDown.push({ x: convertUnixToTimestamp(data.time[index]), y: "flat" })
                } else if (data.trix[index].y < data.trix[index - 1].y) {
                    data.trixUpDown.push({ x: convertUnixToTimestamp(data.time[index]), y: "down" })
                }
            }
        }

        offsetPeriod(52, data.trixUpDown)
    }

    const calcTrixGap = (data) => {
        let values = []
        let upDownValues = []
        data.trixGapUpDown = []
        data.trixGap = []

        for (let index = 0; index < data.trix.length; index++) {
            if (data.trix[index].y !== 0 && data.trix[index - 1].y !== 0) {
                let gap = data.trix[index].y - data.trix[index - 1].y;
                if (gap < 0) {
                    values.push(gap)
                } else {
                    values.push(gap)
                }
            }
        }

        for (let index = 1; index < values.length; index++) {
            if (values[index] > values[index - 1]) {
                upDownValues.push('up')
            } else {
                upDownValues.push('down')
            }
        }


        offsetPeriod(52, values)
        offsetPeriod(53, upDownValues)

        for (let index = 0; index < data.time.length; index++) {
            data.trixGap.push({ x: data.time[index], y: values[index] })
            data.trixGapUpDown.push({ x: convertUnixToTimestamp(data.time[index]), y: upDownValues[index] })
        }
    }

    // ## LIVE TRADING COMMANDS, BUY AND SELL


    const handleExit = (lastPrice, lastPurchasePrice, time, takeProfit) => {
        //console.log(lastPrice, lastPurchasePrice.y + (lastPurchasePrice.y * 0.015))
        if (lastPrice > lastPurchasePrice.y + (lastPurchasePrice.y * takeProfit)) {
            data.short.push({ x: time, y: lastPrice })
            data.currentPosition.push({ position: 'short', price: lastPrice, time: time })
        }
    }

    const handleStopLoss = (lastPrice, lastPurchasePrice, time) => {
        if (lastPrice < lastPurchasePrice.y - lastPurchasePrice.y * 0.01) {
            data.short.push({ x: time, y: lastPrice })
            data.currentPosition.push({ position: 'short', price: lastPrice, time: time })
            marketSell()
            return true;
        }
        return false;
    }

    const marketBuy = () => {
        let quantity = 0.1;
        binance.marketBuy(pair, quantity);
    }

    const marketSell = () => {
        let quantity = 0.1;
        binance.marketSell(pair, quantity);
    }

    // ## STRATEGIES

    const calcMACDStrategy = (data) => {
        data.long = [];
        data.short = []
        data.currentPosition = [];
        data.ema = {};

        // Create Indicator
        calcMACD(data)
        calcEMA(data, 21)
        calcEMA(data, 200)
        //console.log(data.ema['21'])

        const handleUpDownTrendSetting = (index) => {
            if (data.ema['21'][index].y > data.ema['200'][index].y) {
                // up trend
                return {
                    long: -10,
                    sell: 10
                }
            } else {
                // down trend 
                return {
                    long: -50,
                    sell: 0
                }
            }
        }

        

        for (let index = 0; index < data.time.length; index++) {
            //if (data.ema['21'][index].y > data.ema['200'][index].y) {
                if (data.macd[index].y > data.macdSignal[index].y && data.macd[index].y < handleUpDownTrendSetting(index).long) {
                
                    if (data.currentPosition.length === 0) {
                        data.long.push(data.close[index])
                        data.currentPosition.push({ position: 'long', details: data.close[index] })
                    } else {
                        if (data.currentPosition[data.currentPosition.length - 1].position === "short") {
                            data.long.push(data.close[index])
                            data.currentPosition.push({ position: 'long', details: data.close[index] })
                        }
                    }
                }
            //}
            
                
            if (data.currentPosition.length > 0) {
                if (data.currentPosition[data.currentPosition.length - 1].position === "long") {
                    //let stopLoss = handleStopLoss(data.close[index].y, data.long[data.long.length - 1], data.time[index]);

                    //if (!stopLoss) {
                        if (data.macd[index].y < data.macdSignal[index].y && data.macd[index].y > handleUpDownTrendSetting(index).sell) {
                            //console.log(new Date(masterDataObject.time[index]), masterDataObject.close[index])
                            data.short.push(data.close[index])
                            data.currentPosition.push({ position: 'short', details: data.close[index] })

                        } 
                        // else if (data.ema['21'][index - 1].y > data.ema['200'][index - 1].y && data.ema['21'][index].y < data.ema['200'][index].y) {
                        //     data.short.push(data.close[index])
                        //     data.currentPosition.push({ position: 'short', details: data.close[index] })
                        // }
                    //}

                } 
            }
            
        }        
    }

    const calcTrixStrategy = (data) => {
        data.long = [];
        data.short = []
        data.currentPosition = [];
        data.ema = {};

        calcTRIX(data)
        calcTrixGap(data)
        calcEMA(data, 21)
        calcEMA(data, 200)

        for (let index = 0; index < data.time.length; index++) {
            if (data.trixUpDown[index] !== 0 && data.trixUpDown[index - 1] !== 0) {
                if (data.trixUpDown[index - 1].y === 'down' && (data.trixUpDown[index].y === "up" || data.trixUpDown[index].y === "flat")) {
                    if (data.trix[index].y < -0.051) {
                        if (data.currentPosition.length === 0) {
                            data.long.push(data.close[index])
                            data.currentPosition.push({ position: 'long', details: data.close[index] })
                        } else {
                            if (data.currentPosition[data.currentPosition.length - 1].position === "short") {
                                data.long.push(data.close[index])
                                data.currentPosition.push({ position: 'long', details: data.close[index] })
                            }
                        }
                    }
                }
                if (data.currentPosition.length > 0) {
                    if (data.currentPosition[data.currentPosition.length - 1].position === "long") {
                        //let stopLoss = handleStopLoss(data.close[index].y, data.long[data.long.length - 1], data.time[index]);

                        //if (!stopLoss) {
                            if (data.trixUpDown[index - 1].y === "up" && (data.trixUpDown[index].y === 'flat' || data.trixUpDown[index].y === "down")) {
                                //console.log(new Date(masterDataObject.time[index]), masterDataObject.close[index])
                                data.short.push(data.close[index])
                                data.currentPosition.push({ position: 'short', details: data.close[index] })

                            }
                        //}

                    }
                }
            }
        }
    }

    // ## PROFIT CALCULATIONS

    const calcProfit = (data) => {
        let longSum = 0;
        let shortSum = 0;
        let initialInvestment = 500;

        for (let index = 0; index < data.long.length; index++) {
            console.log((data.long[index].y * (initialInvestment/data.long[index].y)) - (data.short[index].y * (initialInvestment/data.long[index].y)), initialInvestment/data.long[index].y)

            initialInvestment = ((data.short[index].y * (initialInvestment/data.long[index].y)) - (data.long[index].y * (initialInvestment/data.long[index].y))) + initialInvestment;
            longSum = (data.long[index].y * (initialInvestment/data.long[index].y)) + longSum
        }
        for (let index = 0; index < data.short.length; index++) {
            shortSum = (data.short[index].y * (initialInvestment/data.short[index].y)) + shortSum
        }

        console.log('Total Buy:', longSum, "Total Sell:", shortSum, 'Total Capitol:', initialInvestment)

        let gross = shortSum - longSum;
        let totalTradeAmount = shortSum + longSum;
        let fees = totalTradeAmount * 0.00075;
        let net = gross - fees;
        let percent = longSum

        console.log('Gross: ', parseFloat(gross.toFixed(2)), 'Fees: ', parseFloat(fees.toFixed(2)), 'Net: ', parseFloat(net.toFixed(2)))

        socket.emit(`${symbol}-${tf}-profit-log`, { gross: parseFloat(gross.toFixed(2)), fees: parseFloat(fees.toFixed(2)), net: parseFloat(net.toFixed(2)) });

    }

    const calcCompoundProfit = (data) => {
        
    }

    const calcOneHourProfit = () => {
        let longSum = 0;
        let shortSum = 0;
        for (let index = 0; index < data.oneHourLong.length; index++) {
            longSum = data.oneHourLong[index].y + longSum
        }
        for (let index = 0; index < data.oneHourShort.length; index++) {
            shortSum = data.oneHourShort[index].y + shortSum
        }

        console.log(longSum, shortSum)

        let gross = shortSum - longSum;
        let totalTradeAmount = shortSum + longSum;
        let fees = totalTradeAmount * 0.00075;
        let net = gross - fees;

        console.log('Gross: ', parseFloat(gross.toFixed(2)), 'Fees: ', parseFloat(fees.toFixed(2)), 'Net: ', parseFloat(net.toFixed(2)))

        socket.emit(`${symbol}-${tf}-profit-log`, { gross: parseFloat(gross.toFixed(2)), fees: parseFloat(fees.toFixed(2)), net: parseFloat(net.toFixed(2)) });

    }

    const calcOneHourStrategy = () => {
        data.oneHourCurrent = []
        data.oneHourLong = []
        data.oneHourShort = []

        for (let index = 0; index < data.time.length; index++) {
            if (data.trixGapUpDown[index].y !== null && data.trixGapUpDown[index - 1].y !== null) {
                if (data.trixGapUpDown[index].y === 'up' && data.trixGapUpDown[index - 1].y === 'down') {
                    if (data.trixGap[index].y < -0.01 && data.trixGap[index].y > -0.02) {
                        if (data.oneHourCurrent.length === 0) {
                            data.oneHourLong.push(data.close[index])
                            data.oneHourCurrent.push({ position: 'long', details: data.close[index] })
                        } else {
                            if (data.oneHourCurrent[data.oneHourCurrent.length - 1].position === "short") {
                                data.oneHourLong.push(data.close[index])
                                data.oneHourCurrent.push({ position: 'long', details: data.close[index] })
                            }
                        }
                    }

                }

                if (data.oneHourCurrent.length > 0) {
                    if (data.oneHourCurrent[data.oneHourCurrent.length - 1].position === "long") {

                        if (data.close[index].y < data.oneHourLong[data.oneHourLong.length - 1] - data.oneHourLong[data.oneHourLong.length - 1] * 0.005) {
                            data.oneHourShort.push(data.close[index])
                            data.oneHourCurrent.push({ position: 'short', details: data.close[index] })
                        }
                        if (data.trixUpDown[index - 1].y === 'up' && data.trixUpDown[index].y === 'down') {
                            //if (data.trixGap[index].y > 0.0 && data.trixGap[index].y < 0.02) {
                            data.oneHourShort.push(data.close[index])
                            data.oneHourCurrent.push({ position: 'short', details: data.close[index] })
                            //}
                        }

                    }
                }


            }
        }
    }

    // ## SOCKET DATA MAPPING AND FORMATTING

    const mapCachedData = (chartData) => {
        for (const key in chartData) {
            data.time.push(_.toNumber(key));
            data.open.push({ x: _.toNumber(key), y: _.toNumber(chartData[key].open) });
            data.high.push({ x: _.toNumber(key), y: _.toNumber(chartData[key].high) });
            data.low.push({ x: _.toNumber(key), y: _.toNumber(chartData[key].low) });
            data.close.push({ x: _.toNumber(key), y: _.toNumber(chartData[key].close) });
            data.volume.push({ x: _.toNumber(key), y: _.toNumber(chartData[key].volume) });
        }
        calcTRIX()
        calcMACD()
        calcTrixGap()
        calcMACDStrategy()
        calcProfit()
        // tf === '1h' ? calcTrixStrategy() : calcTrixStrategy()
        // tf === '1h' ? calcProfit() : calcProfit()
    }

    const mapHistoricalData = async (strategy) => {

        let historicalData = {
            time: [],
            open: [],
            high: [],
            low: [],
            close: [],
            volume: []
        };

        const stream = require("fs").createReadStream("historicalData/ETHUSDT-1m-2021-10--2021-01.csv")
        const reader = require("readline").createInterface({ input: stream })
        let arr = []
        await reader.on("line", (row) => { arr.push(row.split(",")) })

        await reader.on("close", () => {
            for (const key in arr) {
                if (key < arr.length && key > 300000) {
                    historicalData.time.push(_.toNumber(arr[key][0]));
                    historicalData.open.push({ x: _.toNumber(arr[key][0]), y: _.toNumber(arr[key][1]) });
                    historicalData.high.push({ x: _.toNumber(arr[key][0]), y: _.toNumber(arr[key][2]) });
                    historicalData.low.push({ x: _.toNumber(arr[key][0]), y: _.toNumber(arr[key][3]) });
                    historicalData.close.push({ x: _.toNumber(arr[key][0]), y: _.toNumber(arr[key][4]) });
                    historicalData.volume.push({ x: _.toNumber(arr[key][0]), y: _.toNumber(arr[key][5]) });
                }
                
            }

            if (strategy == 'macd') {
                calcMACDStrategy(historicalData)
                calcProfit(historicalData)
            } else if (strategy == 'trix') {
                calcTrixStrategy(historicalData)
                calcProfit(historicalData)
            }
            
            socket.emit(`${symbol}-${tf}`, historicalData);
            
        });
    }

    const handleCurrentAndFinalTick = (tick, timeStamp) => {
        if (skipFirstTick == true) {
            if (isFinal) {
                data.time.push(_.toNumber(timeStamp));
                data.open.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.open) });
                data.high.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.high) });
                data.low.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.low) });
                data.close.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.close) });
                data.volume.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.volume) });
                isFinal = false;
                calcTRIX()
                calcMACD()
                calcTrixGap()
                calcMACDStrategy()
                calcProfit()
                // tf === '1h' ? calcTrixStrategy() : calcTrixStrategy()
                // tf === '1h' ? calcProfit() : calcProfit()
                socket.emit(`${symbol}-${tf}`, data);
            } else {
                data.time.pop()
                data.open.pop()
                data.high.pop()
                data.low.pop()
                data.close.pop()
                data.volume.pop()
                data.time.push(_.toNumber(timeStamp));
                data.open.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.open) });
                data.high.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.high) });
                data.low.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.low) });
                data.close.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.close) });
                data.volume.push({ x: _.toNumber(timeStamp), y: _.toNumber(tick.volume) });
                calcProfit()
                // tf === '1h' ? calcProfit() : calcProfit()
                socket.emit(`${symbol}-${tf}`, data);
            }

            if (tick.hasOwnProperty('isFinal') === false) {
                isFinal = true;
            }
        }
        skipFirstTick = true;
    }

    // ## SOCKET

    const connectSocket = () => {
        binance.websockets.chart(pair, timeframe, (symbol, interval, chart) => {
            let tick = binance.last(chart);
            
            if (hasCachedDataExecuted === false) {
                
                //mapCachedData(chart)
                hasCachedDataExecuted = true;
            }

            //handleCurrentAndFinalTick(chart[tick], tick)
            //console.log(chart[tick])
        });
    }

    const connectStream = () => {
        binance.websockets.bookTickers( 'ETHUSDT', (res) => {
            console.log(res.bestBid)
            if (data.streamBid.length < 100) {
                data.streamBid.push({ x: Date.now(), y: _.toNumber(res.bestBid) })
                data.streamAsk.push({ x: Date.now(), y: _.toNumber(res.bestAsk) })
            } else {
                data.streamBid.unshift()
                data.streamAsk.unshift()
                data.streamBid.push({ x: Date.now(), y: _.toNumber(res.bestBid) })
                data.streamAsk.push({ x: Date.now(), y: _.toNumber(res.bestAsk) })
            }
            //socket.emit('STREAM', data);
            //console.log(data.stream[0])
        } ); 
    }

    return {
        connect: () => {
            connectSocket()
        },
        connectStream: () => {
            connectStream()
        },
        data: () => {
            return data;
        },
        startBacktest: (strategy) => {
            mapHistoricalData(strategy)
        }
    }
}


app.use(express.static('version4'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/version4/index.html');
});

io.on('connection', function (socket) {
    socket.on('botCommand', (cmd) => {
        console.log(cmd)
        if (cmd === 'START_BACKTEST') {
            Bot('ETHUSDT', '1m', socket).startBacktest('macd')
        }
    });
});

http.listen(port, function () {
    console.log('listening on V2 *:' + port);
}); 

const oneMinuteChart = new Bot('ETHUSDT', '1m').connect()
//const fiveMinuteChart = new Bot('ETHUSDT', '3m').connect()
// const streamChart = new Chart()
// streamChart.connectStream('ETHUSDT', 'stream')

// const getHistoricalData = () => {
//     axios({
//         method: 'get',
//         url: 'https://min-api.cryptocompare.com/data/v2/histominute?fsym=ETH&tsym=USD&aggregate=5&limit=2000&api_key=7120dce2a54f4c55f45f62789ed7e61ae456d70c956156e01555ca6c3e4b2148',
//     })
//     .then(function (res) {
//         console.log(res.data.Data[1])
//     });
// }
// getHistoricalData()


