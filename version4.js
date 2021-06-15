var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const _ = require('lodash');
var port = process.env.PORT || 3000;
let config = '';
if (port === 3000) {
    config = require('./config.json');
}
const Binance = require('node-binance-api');
const TRIX = require('technicalindicators').TRIX;

const binance = new Binance().options({
    APIKEY: process.env.bkey ? process.env.bkey : config.BINANCE_APIKEY,
    APISECRET: process.env.bsec ? process.env.bsec : config.BINANCE_APISECRET,
    test: true,
    reconnect: true
});
let globalData = []

function Chart(symbol, tf) {

    const pair = symbol;
    const timeframe = tf;
    let hasCachedDataExecuted = false;
    let isFinal = false;
    let skipFirstTick = false;

    let data = {
        open: [],
        high: [],
        low: [],
        close: [],
        volume: [],
        time: [],
        sma: [],
        mfi: [],
        fi: [],
        rsi: [],
        secondRSI: [],
        vwap: [],
        vwapCrossOver: [],
        long: [],
        short: [],
        positiveCashFlow: [],
        negativeCashFlow: [],
        obv: [],
        kst: [],
        kstSignal: [],
        kstCrossOver: [],
        adx: [],
        rsiCrossOver: [],
        liveOpenLongs: [],
        liveOpenShorts: [],
        kstGap: [],
        kstUpDown: [],
        kstSignalUpDown: [],
        currentPosition: [],
        trix: [],
        trixUpDown: [],
        doji: [],
        bullish: [],
        trixGap: [],
        trixGapUpDown: [],
        trixGapEntryExit: [],
        oneHourLong: [],
        oneHourShort: [],
        oneHourCurrent: []
    }

    const convertUnixToTimestamp = (unix) => {
        var d = new Date(unix).toLocaleString();
        return d;
    }

    const offsetPeriod = (period, data) => {
        for (let index = 0; index <= period; index++) {
            data.unshift(null)
        }
    }

    const calcTRIX = () => {
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
            if (data.trix[index].y !== null && data.trix[index - 1].y !== null) {
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

    const calcTrixGap = () => {
        let values = []
        let upDownValues = []

        for (let index = 0; index < data.trix.length; index++) {
            if (data.trix[index].y !== null && data.trix[index - 1].y !== null) {
                let gap = data.trix[index].y - data.trix[index - 1].y;
                if (gap < 0 ) {
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


    const handleExit = (lastPrice, lastPurchasePrice, time, takeProfit) => {
        //console.log(lastPrice, lastPurchasePrice.y + (lastPurchasePrice.y * 0.015))
        if (lastPrice > lastPurchasePrice.y + (lastPurchasePrice.y * takeProfit)) {
            data.short.push({ x: time, y: lastPrice })
            data.currentPosition.push({ position: 'short', price: lastPrice, time: time })
        }
    }

    const handleStopLoss = (lastPrice, lastPurchasePrice, time) => {
        if (lastPrice < lastPurchasePrice.y - lastPurchasePrice.y * 0.005) {
            data.short.push({ x: time, y: lastPrice })
            data.currentPosition.push({ position: 'short', price: lastPrice, time: time })
            return true;
        }
        return false;
    }

    const calcTrixStrategy = () => {
        data.long = [];
        data.short = []
        data.currentPosition = [];

        for (let index = 0; index < data.time.length; index++) {
            if (data.trixGapUpDown[index].y !==  null && data.trixGapUpDown[index - 1].y !== null) {
                if (data.trixGapUpDown[index].y === 'up' && data.trixGapUpDown[index - 1].y === 'down') {
                    if (data.trixGap[index].y < -0.0003 && data.trixGap[index].y > -0.0006) {

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
                        // let stopLoss = handleStopLoss(data.close[index].y, data.long[data.long.length - 1], data.time[index]);
                        if (data.close[index].y > data.long[data.long.length - 1].y + ( data.long[data.long.length - 1].y * 0.015)) {
                            data.short.push(data.close[index])
                            data.currentPosition.push({ position: 'short', details: data.close[index] })
                        }

                        // if (!stopLoss) {
                        //     if (data.trixUpDown[index - 1].y === 'up' && data.trixUpDown[index].y === 'down') {
                        //         //if (data.trixGap[index].y > 0.0 && data.trixGap[index].y < 0.02) {
                        //             data.short.push(data.close[index])
                        //             data.currentPosition.push({ position: 'short', details: data.close[index] })
                        //         //}
                        //     }
                        // }

                    }
                }
                

            }
        }

        // for (let index = 0; index < data.time.length; index++) {
        //     if (data.trixUpDown[index] !== null && data.trixUpDown[index - 1] !== null) {
        //         if (data.trixUpDown[index - 1].y === 'down' && (data.trixUpDown[index].y === "up" || data.trixUpDown[index].y === "flat")) {
        //             if (data.trix[index].y < -0.001) {
        //                 if (data.currentPosition.length === 0) {
        //                     data.long.push(data.close[index])
        //                     data.currentPosition.push({ position: 'long', details: data.close[index] })
        //                 } else {
        //                     if (data.currentPosition[data.currentPosition.length - 1].position === "short") {
        //                         data.long.push(data.close[index])
        //                         data.currentPosition.push({ position: 'long', details: data.close[index] })
        //                     }
        //                 }
        //             }
        //         }
        //         if (data.currentPosition.length > 0) {
        //             if (data.currentPosition[data.currentPosition.length - 1].position === "long") {
        //                 let stopLoss = handleStopLoss(data.close[index].y, data.long[data.long.length - 1], data.time[index]);

        //                 if (!stopLoss) {
        //                     if (data.trixUpDown[index - 1].y === "up" && (data.trixUpDown[index].y === 'flat' || data.trixUpDown[index].y === "down")) {
        //                         //console.log(new Date(masterDataObject.time[index]), masterDataObject.close[index])
        //                         data.short.push(data.close[index])
        //                         data.currentPosition.push({ position: 'short', details: data.close[index] })

        //                     }
        //                 }

        //             }
        //         }
        //     }
        // }
    }

    const calcProfit = () => {
        let longSum = 0;
        let shortSum = 0;
        for (let index = 0; index < data.long.length; index++) {
            longSum = data.long[index].y + longSum
        }
        for (let index = 0; index < data.short.length; index++) {
            shortSum = data.short[index].y + shortSum
        }

        console.log(longSum, shortSum)

        let gross = shortSum - longSum;
        let totalTradeAmount = shortSum + longSum;
        let fees = totalTradeAmount * 0.00075;
        let net = gross - fees;

        console.log('Gross: ', parseFloat(gross.toFixed(2)), 'Fees: ', parseFloat(fees.toFixed(2)), 'Net: ', parseFloat(net.toFixed(2)))

        io.emit(`${symbol}-${tf}-profit-log`, { gross: parseFloat(gross.toFixed(2)), fees: parseFloat(fees.toFixed(2)), net: parseFloat(net.toFixed(2)) });

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

        io.emit(`${symbol}-${tf}-profit-log`, { gross: parseFloat(gross.toFixed(2)), fees: parseFloat(fees.toFixed(2)), net: parseFloat(net.toFixed(2)) });

    }

    const calcOneHourStrategy = () => {
        data.oneHourCurrent = []
        data.oneHourLong = []
        data.oneHourShort = []

        for (let index = 0; index < data.time.length; index++) {
            if (data.trixGapUpDown[index].y !==  null && data.trixGapUpDown[index - 1].y !== null) {
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
                        //let stopLoss = handleStopLoss(data.close[index].y, data.long[data.long.length - 1], data.time[index]);
                        if (data.close[index].y > data.oneHourLong[data.oneHourLong.length - 1].y + ( data.oneHourLong[data.oneHourLong.length - 1].y * 0.05)) {
                            data.oneHourShort.push(data.close[index])
                            data.oneHourCurrent.push({ position: 'short', details: data.close[index] })
                        }

                        // if (!stopLoss) {
                        //     if (data.trixUpDown[index - 1].y === 'up' && data.trixUpDown[index].y === 'down') {
                        //         //if (data.trixGap[index].y > 0.0 && data.trixGap[index].y < 0.02) {
                        //             data.short.push(data.close[index])
                        //             data.currentPosition.push({ position: 'short', details: data.close[index] })
                        //         //}
                        //     }
                        // }

                    }
                }
                

            }
        }
    }

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
        calcTrixGap()
        tf === '1h' ? calcOneHourStrategy() : calcTrixStrategy()
        tf === '1h' ? calcOneHourProfit() : calcProfit()
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
                calcTrixGap()
                tf === '1h' ? calcOneHourStrategy() : calcTrixStrategy()
                tf === '1h' ? calcOneHourProfit() : calcProfit()
                io.emit(`${symbol}-${tf}`, data);
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
                tf === '1h' ? calcOneHourProfit() : calcProfit()
                io.emit(`${symbol}-${tf}`, data);
            }

            if (tick.hasOwnProperty('isFinal') === false) {
                isFinal = true;
            }
        }
        skipFirstTick = true;
    }

    const connectSocket = () => {
        binance.websockets.chart(pair, timeframe, (symbol, interval, chart) => {
            let tick = binance.last(chart);

            if (hasCachedDataExecuted === false) {
                mapCachedData(chart)
                hasCachedDataExecuted = true;
            }

            handleCurrentAndFinalTick(chart[tick], tick)
        });
    }

    return {
        connect: () => {
            connectSocket()
        },
        data: () => {
            return data;
        }
    }
}


app.use(express.static('version4'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/version4/index.html');
});

io.on('connection', function (socket) {
    //io.emit('CHART_DATA', globalData);
});

http.listen(port, function () {
    console.log('listening on V2 *:' + port);
});

const oneMinuteChart = new Chart('ETHUSDT', '5m')
oneMinuteChart.connect()
const fiveMinuteChart = new Chart('ETHUSDT', '1h')
fiveMinuteChart.connect()


