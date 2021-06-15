
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
const sound = require("sound-play");
const path = require("path");
const buyMp3 = path.join(__dirname, "buy.mp3");
const sellMp3 = path.join(__dirname, "sell.mp3");
const Binance = require('node-binance-api');
const { toNumber } = require('lodash');
const SMA = require('technicalindicators').SMA;
const MFI = require('technicalindicators').MFI;
const ForceIndex = require('technicalindicators').ForceIndex;
const RSI = require('technicalindicators').RSI;
const VWAP = require('technicalindicators').VWAP;
const CrossUp = require('technicalindicators').CrossUp;
const OBV = require('technicalindicators').OBV;
const KST = require('technicalindicators').KST;
const ADX = require('technicalindicators').ADX;
const EMA = require('technicalindicators').EMA
const TRIX = require('technicalindicators').TRIX;
const doji = require('technicalindicators').doji;
var bullish = require('technicalindicators').bullish;


// const as = async () => {
//     const today = new Date();

//     function formatDate(date, format) {
//         const map = {
//             mm: date.getMonth() + 1,
//             dd: date.getDate(),
//             yy: date.getFullYear().toString().slice(-2),
//             yyyy: date.getFullYear()
//         }

//         return format.replace(/mm|dd|yy|yyy/gi, matched => map[matched])
//     }
//     let end = formatDate(today, 'yyyy-mm-dd');
//     console.log(end)
//     const history = await publicClient.getProductHistoricRates(
//         'ETH-USD',
//         { granularity: 3600, start: end},

//         // (res) => {
//         //     console.log(res.body)
//         // }
//       );
//       console.log(history)
// }
// as()

const binance = new Binance().options({
    APIKEY: process.env.bkey ? process.env.bkey : config.BINANCE_APIKEY,
    APISECRET: process.env.bsec ? process.env.bsec : config.BINANCE_APISECRET,
    test: true,
    reconnect: true
});

const pair = 'ETHUSDT';
const timeframe = '5m';
let masterDataObject = {
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
    currentPosition: [{ position: null, price: null, time: null }],
    trix: [],
    trixUpDown: [],
    doji: [],
    bullish: [],
    trixGap: []
}

app.use(express.static('version2'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/version2/index.html');
});

// app.get('/api/get-all-tickers', function(req, res){
//   bot.allTickers();
// });

io.on('connection', function (socket) {
    // io.emit('CHART_DATA', time, open, high, low, close, volume, sma, mfi, fi, rsi, vwap, entry, positiveCashFlow, negativeCashFlow);
    io.emit('CHART_DATA', masterDataObject);
    setInterval(() => {
        io.emit('CHART_DATA', masterDataObject);
    }, 60000);

});

http.listen(port, function () {
    console.log('listening on V2 *:' + port);
});

const convertUnixToTimestamp = (unix) => {
    var utcSeconds = unix;
    var d = new Date(unix);
    return d;
}

const connectChart = (setupIndicatorsCallback) => {
    let hasExecuted = false;
    let skipFirstTick = false;
    let isFinal = false;
    let hasCalcEntryExecuted = false;
    let hasMFStretchExecuted = false;
    let hasCalcShortExecuted = false;

    const mapCachedData = (data) => {


        for (const key in data) {
            //console.log(`${key}: ${data[key]}`);
            masterDataObject.time.push(convertUnixToTimestamp(toNumber(key)));
            masterDataObject.open.push(toNumber(data[key].open));
            masterDataObject.high.push(toNumber(data[key].high));
            masterDataObject.low.push(toNumber(data[key].low));
            masterDataObject.close.push(toNumber(data[key].close));
            masterDataObject.volume.push(toNumber(data[key].volume));
        }
        //console.log(time[time.length - 1])
        //console.log(close)

    }

    const handleCurrentAndFinalTick = (tick, timeStamp) => {
        //console.log(masterDataObject.close.length, masterDataObject.close[masterDataObject.close.length - 2], masterDataObject.close[masterDataObject.close.length - 1], isFinal)
        if (skipFirstTick == true) {
            //console.log(tick.hasOwnProperty('isFinal'));
            //console.log(tick, time)
            if (isFinal) {
                //console.log('new',tick);
                masterDataObject.time.push(convertUnixToTimestamp(toNumber(timeStamp)));
                masterDataObject.open.push(toNumber(tick.open));
                masterDataObject.high.push(toNumber(tick.high));
                masterDataObject.low.push(toNumber(tick.low));
                masterDataObject.close.push(toNumber(tick.close));
                masterDataObject.volume.push(toNumber(tick.volume));
                isFinal = false;
            } else {
                masterDataObject.time.pop()
                masterDataObject.open.pop()
                masterDataObject.high.pop()
                masterDataObject.low.pop()
                masterDataObject.close.pop()
                masterDataObject.volume.pop()
                masterDataObject.time.push(convertUnixToTimestamp(toNumber(timeStamp)));
                masterDataObject.open.push(toNumber(tick.open));
                masterDataObject.high.push(toNumber(tick.high));
                masterDataObject.low.push(toNumber(tick.low));
                masterDataObject.close.push(toNumber(tick.close));
                masterDataObject.volume.push(toNumber(tick.volume));
            }

            if (tick.hasOwnProperty('isFinal') === false) {
                isFinal = true;
            }
        }
        skipFirstTick = true;
    }

    const calcSMA = () => {
        let period = 8;
        masterDataObject.sma = SMA.calculate({ period: period, values: masterDataObject.close })
        //console.log(sma[sma.length - 1], sma[sma.length - 2]) 
    }

    const offsetPeriod = (period, data) => {
        for (let index = 0; index <= period; index++) {
            data.unshift(null)
        }
    }

    const calcMFI = () => {
        let input = {
            high: masterDataObject.high,
            low: masterDataObject.low,
            close: masterDataObject.close,
            volume: masterDataObject.volume,
            period: 14 // default 14
        }
        masterDataObject.mfi = MFI.calculate(input)
        masterDataObject.mfi = SMA.calculate({ period: 23, values: masterDataObject.mfi }) // 21
        offsetPeriod(36, masterDataObject.mfi)
        //console.log(masterDataObject.mfi.length)
    }

    const calcFi = () => {
        let input = {
            open: masterDataObject.open,
            high: masterDataObject.high,
            low: masterDataObject.low,
            close: masterDataObject.close,
            volume: masterDataObject.volume,
            period: 90 // default 1
        }
        masterDataObject.fi = ForceIndex.calculate(input)
        masterDataObject.fi = SMA.calculate({ period: 8, values: masterDataObject.fi })
        offsetPeriod(96, masterDataObject.fi)
        //console.log(masterDataObject.fi.length)
    }

    const calcRSI = () => {
        let inputRSI = {
            values: masterDataObject.close,
            period: 21 // 21
        };
        let secondRSI = {
            values: masterDataObject.close,
            period: 5 // 5
        }
        masterDataObject.rsi = RSI.calculate(inputRSI)
        masterDataObject.rsi = SMA.calculate({ period: 21, values: masterDataObject.rsi }) // 21
        masterDataObject.secondRSI = RSI.calculate(secondRSI);
        masterDataObject.secondRSI = SMA.calculate({ period: 21, values: masterDataObject.secondRSI }) //21

        offsetPeriod(40, masterDataObject.rsi) // 40
        offsetPeriod(24, masterDataObject.secondRSI) // 14
        //console.log(masterDataObject.rsi.length, masterDataObject.secondRSI.length)
    }

    const calcVWAP = () => {
        let input = {
            open: [],
            high: masterDataObject.high,
            low: masterDataObject.low,
            close: masterDataObject.close,
            volume: masterDataObject.volume
        }
        masterDataObject.vwap = VWAP.calculate(input).map((val) => toNumber(val.toFixed(2)))

        //console.log(vwap.length)
    }

    const calcEntry = () => {
        masterDataObject.long = []
        masterDataObject.short = []
        masterDataObject.currentPosition = []
        masterDataObject.kstCrossOver = []
        masterDataObject.rsiCrossOver = []

        const overVWAPEntry = () => {
            for (let index = 0; index < masterDataObject.time.length; index++) {
                if (masterDataObject.kstUpDown[index] === 'up' && (masterDataObject.kstUpDown[index - 1] === "down" || masterDataObject.kstUpDown[index - 1] === "flat")) {
                    if (masterDataObject.vwap[index] < masterDataObject.low[index]) {
                        masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                        masterDataObject.currentPosition.push({ position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                    } else if (masterDataObject.vwap[index] > masterDataObject.low[index]) {
                        if (masterDataObject.kst[index] < -12) {
                            masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                            masterDataObject.currentPosition.push({ position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })

                        }
                    }

                }
                if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].position === "long") {
                    if (masterDataObject.vwap[index] < masterDataObject.low[index]) {
                        if (masterDataObject.kstUpDown[index] === 'down' && masterDataObject.kstUpDown[index - 1] === "up") {
                            masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                            masterDataObject.currentPosition.push({ position: 'short', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                        } else if (masterDataObject.kstSignalUpDown[index] === 'down' && masterDataObject.kstSignalUpDown[index - 1] === "up") {
                            masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                            masterDataObject.currentPosition.push({ position: 'short', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })

                        }
                    } else if (masterDataObject.vwap[index] > masterDataObject.low[index]) {
                        if (masterDataObject.kstSignalUpDown[index] === 'down' && masterDataObject.kstSignalUpDown[index - 1] === "up") {
                            masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                            masterDataObject.currentPosition.push({ position: 'short', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                        }
                    }




                    handleExit(masterDataObject.close[index], masterDataObject.long[masterDataObject.long.length - 1], masterDataObject.time[index])
                    //handleStopLoss(masterDataObject.close[index], masterDataObject.long[masterDataObject.long.length - 1], masterDataObject.time[index])

                }



            }
        }

        const handleExit = (lastPrice, lastPurchasePrice, time) => {
            //console.log(lastPrice, lastPurchasePrice.y + (lastPurchasePrice.y * 0.015))
            if (lastPrice > lastPurchasePrice.y + (lastPurchasePrice.y * 0.015)) {
                masterDataObject.short.push({ x: new Date(time), y: lastPrice })
                masterDataObject.currentPosition.push({ position: 'short', price: lastPrice, time: time })
            }
        }

        const handleStopLoss = (lastPrice, lastPurchasePrice, time) => {
            //console.log(lastPrice, lastPurchasePrice.y - (lastPurchasePrice.y * 0.005))
            // if (masterDataObject.short[masterDataObject.short.length - 1].y) {

            // }
            if (lastPrice < lastPurchasePrice.y - lastPurchasePrice.y * 0.005) {
                masterDataObject.short.push({ x: new Date(time), y: lastPrice })
                masterDataObject.currentPosition.push({ position: 'short', price: lastPrice, time: time })
                return true;
            }
            return false;
        }

        const calKSTCrossover = () => {
            for (let index = 0; index < masterDataObject.time.length; index++) {
                // Calc KST CrossOver
                if (masterDataObject.kst[index] < masterDataObject.kstSignal[index]) {
                    masterDataObject.kstCrossOver.push(true)
                } else {
                    masterDataObject.kstCrossOver.push(false)
                }
                // Calc secondRSI & MFI CrossOver

                if (masterDataObject.rsi[index] > masterDataObject.secondRSI[index]) {
                    masterDataObject.rsiCrossOver.push(true)
                } else {
                    masterDataObject.rsiCrossOver.push(false)
                }
            }
        }

        const soundAlarm = () => {
            // /console.log(masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1], masterDataObject.time[masterDataObject.time.length - 1])
            if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].time === masterDataObject.time[masterDataObject.time.length - 1]) {
                if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].position === "long") {
                    console.log('sound buy')
                    sound.play(buyMp3);
                } else {
                    console.log('sound sell')
                    sound.play(sellMp3);
                }
            }
        }

        const trixStrategy = () => {
            for (let index = 0; index < masterDataObject.time.length; index++) {

                //console.log(new Date(masterDataObject.time[index]), masterDataObject.trixUpDown.length)

                if (masterDataObject.trixUpDown[index - 1] === 'down' && (masterDataObject.trixUpDown[index] === "up" || masterDataObject.trixUpDown[index] === "flat")) {
                    // if (masterDataObject.vwap[index] < masterDataObject.low[index] ) {
                        if (masterDataObject.currentPosition.length === 0) {
                            masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                            masterDataObject.currentPosition.push({ position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                        } else {
                            
                            //console.log(masterDataObject.currentPosition)
                            if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].position === "short") {
                                masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                                masterDataObject.currentPosition.push({ position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                            }
                        }

                    // } else if (masterDataObject.vwap[index] > masterDataObject.low[index]) {
                    // if (masterDataObject.kst[index] < -12) {
                    //     masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                    //     masterDataObject.currentPosition.push({position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })

                    // }
                    // }

                }
                if (masterDataObject.currentPosition.length > 0) {
                    if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].position === "long") {
                        let stopLoss = handleStopLoss(masterDataObject.close[index], masterDataObject.long[masterDataObject.long.length - 1], masterDataObject.time[index]);
                        console.log(stopLoss)
                        if (!stopLoss) {
                            if (masterDataObject.trixUpDown[index - 1] === "up" && (masterDataObject.trixUpDown[index] === 'flat' || masterDataObject.trixUpDown[index] === "down")) {
                                //console.log(new Date(masterDataObject.time[index]), masterDataObject.close[index])
                                masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                                masterDataObject.currentPosition.push({ position: 'short', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
    
                            }
                        }
                        
                        //handleExit(masterDataObject.close[index], masterDataObject.long[masterDataObject.long.length - 1], masterDataObject.time[index])
                        
                    }
                }

            }
        }

        const trixGapStrategy = () => {
            let trixGapUpDown = []
            for (let index = 0; index < masterDataObject.time.length; index++) {
                if (masterDataObject.trixGap[index] > masterDataObject.trixGap[index - 1]) {
                    trixGapUpDown.push('up')
                } else if (masterDataObject.trixGap[index] === masterDataObject.trixGap[index - 1]) {
                    trixGapUpDown.push('flat')
                } else if (masterDataObject.trixGap[index] < masterDataObject.trixGap[index - 1]) {
                    trixGapUpDown.push('down')
                }
            }
            offsetPeriod(1, trixGapUpDown)
            //console.log(trixGapUpDown.length, masterDataObject.trixGap)
            
            for (let index = 0; index < masterDataObject.time.length; index++) {
                
                // if (trixGapUpDown[index - 1] === 'down' && (trixGapUpDown[index] === "up" || trixGapUpDown[index] === "flat")) {
                //     if (masterDataObject.trixGap[index] < 0 && masterDataObject.kst[index] > masterDataObject.kstSignal[index]) {
                //         masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                //         masterDataObject.currentPosition.push({ position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                //     }
                   
                // }
                
                if (masterDataObject.trixUpDown[index - 1] === 'down' && (masterDataObject.trixUpDown[index] === "up" || masterDataObject.trixUpDown[index] === "flat")) {
                    // if (masterDataObject.vwap[index] < masterDataObject.low[index] ) {
                    
                    if (masterDataObject.currentPosition.length === 0) {
                        masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                        masterDataObject.currentPosition.push({ position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                    } else {
                        
                        //console.log(masterDataObject.currentPosition)
                        if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].position === "short") {
                            masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                            masterDataObject.currentPosition.push({ position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                        }
                    }
                    

                    // } else if (masterDataObject.vwap[index] > masterDataObject.low[index]) {
                    // if (masterDataObject.kst[index] < -12) {
                    //     masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                    //     masterDataObject.currentPosition.push({position: 'long', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })

                    // }
                    // }

                }
                // if (masterDataObject.currentPosition.length > 0) {
                //     if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].position === "long") {
                //         if (masterDataObject.trixUpDown[index - 1] === "up" && (masterDataObject.trixUpDown[index] === 'flat' || masterDataObject.trixUpDown[index] === "down")) {
                //             //console.log(new Date(masterDataObject.time[index]), masterDataObject.close[index])
                //             masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                //             masterDataObject.currentPosition.push({ position: 'short', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })

                //         }
                //         //handleExit(masterDataObject.close[index], masterDataObject.long[masterDataObject.long.length - 1], masterDataObject.time[index])
                //         //handleStopLoss(masterDataObject.close[index], masterDataObject.long[masterDataObject.long.length - 1], masterDataObject.time[index])
                //     }
                //}
                if (masterDataObject.currentPosition.length > 0) {
                    if (masterDataObject.currentPosition[masterDataObject.currentPosition.length - 1].position === "long") {
                        if (trixGapUpDown[index - 1] === "up" && (trixGapUpDown[index] === 'flat' || trixGapUpDown[index] === "down")) {
                            let stopLoss = handleStopLoss(masterDataObject.close[index], masterDataObject.long[masterDataObject.long.length - 1], masterDataObject.time[index]);
                            console.log(stopLoss)
                            if (!stopLoss) {
                                if (masterDataObject.trixGap[index] > 0.001) {
                                    //console.log(new Date(masterDataObject.time[index]), masterDataObject.close[index])
                                    masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                                    masterDataObject.currentPosition.push({ position: 'short', price: masterDataObject.close[index], time: new Date(masterDataObject.time[index]) })
                                }
                            }
                        }
                    }
                }
            }
            //console.log(trixGapUpDown)
        }

        return {
            trixStrategy: () => {
                trixStrategy()
                soundAlarm()
            },
            trixGapStrategy: () => {
                trixGapStrategy()
            }
        }
    }
    const calcShort = () => {

        if (masterDataObject.long.length > 0 && hasCalcShortExecuted === false) {
            for (let index = 0; index < masterDataObject.time.length; index++) {
                // Calc KST CrossOver
                if (masterDataObject.secondRSI[index] < masterDataObject.mfi[index]) {
                    masterDataObject.rsiCrossOver.push(false)
                } else {
                    masterDataObject.rsiCrossOver.push(true)
                }
                //console.log(masterDataObject.kstCrossOver, masterDataObject.time[index])
            }
            for (let index = 60; index < masterDataObject.time.length; index++) {
                if (masterDataObject.rsiCrossOver[index] === false && masterDataObject.rsiCrossOver[index - 1] === true) {
                    // console.log(masterDataObject.long.length,  masterDataObject.short.length)
                    // if (masterDataObject.long.length >= masterDataObject.short.length) {
                    //masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                    //masterDataObject.long = []; 
                    //}
                }
            }
            hasCalcShortExecuted = true;
        }

    }

    const calcRSIEntry = () => {
        let hasRSIExecuted = false;

        if (hasRSIExecuted === false) {
            for (let index = 0; index < time.length; index++) {

            }
        }
    }

    const calcMoneyFlowStretch = () => {

        // console.log(mfi)
        if (hasMFStretchExecuted === false) {
            // console.log(mfi,  mfi[35], mfi[34], (mfi[34] - mfi[35]))
            for (let index = 1; index < masterDataObject.time.length; index++) {

                let stretch = masterDataObject.mfi[index - 1] - masterDataObject.mfi[index]
                //let negStretch = mfi[index - 1] - mfi[index]
                //console.log(stretch)
                //positiveCashFlow.push(parseFloat(stretch))
                //negativeCashFlow.push(parseFloat(negStretch))
                if (stretch >= 0) {
                    let ns = masterDataObject.negativeCashFlow[index] + stretch;
                    masterDataObject.positiveCashFlow.push(stretch)
                    masterDataObject.negativeCashFlow.push(0)
                } else {
                    //console.log((negativeCashFlow, stretch))
                    let ps = masterDataObject.positiveCashFlow[index] - stretch;
                    masterDataObject.negativeCashFlow.push(stretch)
                    masterDataObject.positiveCashFlow.push(0)
                }

            }
            //console.log(positiveCashFlow, negativeCashFlow)

            let period = 33;
            //let psma = SMA.calculate({period : period, values : positiveCashFlow}) 
            //let nsma = SMA.calculate({period : period, values : negativeCashFlow}) 

            //positiveCashFlow = psma;
            //negativeCashFlow = nsma;

            //offsetPeriod(period, positiveCashFlow)
            //offsetPeriod(period, negativeCashFlow)

            //console.log(positiveCashFlow, negativeCashFlow)

            hasMFStretchExecuted = true;
        }

    }

    const calcOBV = () => {
        let input = {
            close: masterDataObject.close,
            volume: masterDataObject.volume
        }

        masterDataObject.obv = OBV.calculate(input);
    }

    const calcKst = () => {
        let input = {
            values: masterDataObject.close,
            ROCPer1: 10, // 10
            ROCPer2: 15,
            ROCPer3: 20,
            ROCPer4: 30,
            SMAROCPer1: 10,
            SMAROCPer2: 10,
            SMAROCPer3: 10,
            SMAROCPer4: 15,
            signalPeriod: 11 // 3, 8
        };

        function getRandomIntInclusive(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
        }

        let res = KST.calculate(input);
        //console.log(res)
        masterDataObject.kst = []
        masterDataObject.kstSignal = []
        for (let index = 0; index < res.length; index++) {
            //console.log(res[index].signal)
            masterDataObject.kst.push(res[index].kst)
            masterDataObject.kstSignal.push(res[index].signal)
        }
        masterDataObject.kstSignal = _.compact(masterDataObject.kstSignal);
        //masterDataObject.kst = SMA.calculate({period: 21, values: masterDataObject.kst}) // 9
        // masterDataObject.kstSignal = SMA.calculate({period: 9, values: masterDataObject.kstSignal}) // 9
        // for (let index = 0; index < 10; index++) {
        //     // masterDataObject.kst.push(Math.random(getRandomIntInclusive(masterDataObject.kst[masterDataObject.kst.length - 1], masterDataObject.kst[masterDataObject.kst.length - 1] + 0.55)))
        //     masterDataObject.kstSignal.pop()
        // }
        masterDataObject.kstGap = []
        // for (let index = 0; index < masterDataObject.kstSignal.length; index++) {
        //     //console.log(masterDataObject.kstSignal[index - 1] + masterDataObject.kst[index - 1],masterDataObject.kstSignal[index] + masterDataObject.kst[index])
        //     if (masterDataObject.kstSignal[index - 1] + masterDataObject.kst[index - 1] > masterDataObject.kstSignal[index] + masterDataObject.kst[index]) {
        //         masterDataObject.kstGap.push(true)
        //     } {
        //         masterDataObject.kstGap.push(false)
        //     }


        // }
        //console.log(masterDataObject.kstGap)
        offsetPeriod(43, masterDataObject.kst);
        offsetPeriod(53, masterDataObject.kstSignal);

        masterDataObject.kstUpDown = []
        masterDataObject.kstSignalUpDown = []
        for (let index = 0; index < masterDataObject.kst.length; index++) {
            if (masterDataObject.kst[index] > masterDataObject.kst[index - 1]) {
                masterDataObject.kstUpDown.push("up")
            } else if (masterDataObject.kst[index] === masterDataObject.kst[index - 1]) {
                masterDataObject.kstUpDown.push("flat")
            } else if (masterDataObject.kst[index] < masterDataObject.kst[index - 1]) {
                masterDataObject.kstUpDown.push("down")
            }
            if (masterDataObject.kstSignal[index] > masterDataObject.kstSignal[index - 1]) {
                masterDataObject.kstSignalUpDown.push("up")
            } else if (masterDataObject.kstSignal[index] === masterDataObject.kstSignal[index - 1]) {
                masterDataObject.kstSignalUpDown.push("flat")
            } else if (masterDataObject.kstSignal[index] < masterDataObject.kstSignal[index - 1]) {
                masterDataObject.kstSignalUpDown.push("down")
            }

        }
        offsetPeriod(0, masterDataObject.kstUpDown);
        //console.log(masterDataObject.kst.length, masterDataObject.kstSignal.length, masterDataObject.kstUpDown.length)

        //console.log(masterDataObject.kst.length, masterDataObject.kstSignal.length)

    }

    const calcADX = () => {
        let input = {
            close: masterDataObject.close,
            high: masterDataObject.high,
            low: masterDataObject.low,
            period: 31
        }

        masterDataObject.adx = ADX.calculate(input);
        offsetPeriod(60, masterDataObject.adx)
        //console.log(masterDataObject.adx.length)
    }

    const handleLiveSpotTrading = () => {
        //console.log(masterDataObject.kst[masterDataObject.kst.length - 1], masterDataObject.kstSignal[masterDataObject.kstSignal.length - 1])
        //console.log(masterDataObject.time.length, masterDataObject.kstCrossOver.length)
        if (masterDataObject.time.length > masterDataObject.kstCrossOver.length) {
            // Calc KST CrossOver
            if (masterDataObject.kst[masterDataObject.kst.length - 1] < masterDataObject.kstSignal[masterDataObject.kstSignal.length - 1]) {
                masterDataObject.kstCrossOver.push(false)
            } else {
                masterDataObject.kstCrossOver.push(true)
            }
            // Calc secondRSI & MFI CrossOver
            if (masterDataObject.secondRSI[masterDataObject.secondRSI.length] < masterDataObject.mfi[masterDataObject.mfi.length]) {
                masterDataObject.rsiCrossOver.push(false)
            } else {
                masterDataObject.rsiCrossOver.push(true)
            }
        }

        //if (masterDataObject.liveOpenLongs.length === 0) {
        if (masterDataObject.kstCrossOver[masterDataObject.kstCrossOver.length - 1] === true && (masterDataObject.kstCrossOver[masterDataObject.kstCrossOver - 2] === false && masterDataObject.rsiCrossOver[masterDataObject.rsiCrossOver.length - 1] === true)) {
            if (masterDataObject.kst[masterDataObject.kst.length - 1] < -8) {
                masterDataObject.liveOpenLongs.push({ x: new Date(masterDataObject.time[masterDataObject.time.length - 1]), y: masterDataObject.close[masterDataObject.close.length - 1] })
            }
            console.log(masterDataObject.liveOpenLongs)
        }
        //} else {
        if (masterDataObject.rsiCrossOver[masterDataObject.rsiCrossOver.length - 1] === false && masterDataObject.rsiCrossOver[masterDataObject.rsiCrossOver.length - 2] === true) {
            masterDataObject.liveOpenShorts.push({ x: new Date(masterDataObject.time[masterDataObject.time.length - 1]), y: masterDataObject.close[masterDataObject.close.length - 1] })
        }
        //}
    }

    const calcEMA = (period, values) => {
        EMA.calculate({ period: period, values: values })
    }

    const calcTRIX = () => {
        var close = masterDataObject.close;

        let input = {
            values: masterDataObject.close,
            period: 18
        };

        masterDataObject.trix = TRIX.calculate(input);
        offsetPeriod(51, masterDataObject.trix)

        masterDataObject.trixUpDown = []
        for (let index = 0; index < masterDataObject.trix.length; index++) {
            if (masterDataObject.trix[index] > masterDataObject.trix[index - 1]) {
                masterDataObject.trixUpDown.push("up")
            } else if (masterDataObject.trix[index] === masterDataObject.trix[index - 1]) {
                masterDataObject.trixUpDown.push("flat")
            } else if (masterDataObject.trix[index] < masterDataObject.trix[index - 1]) {
                masterDataObject.trixUpDown.push("down")
            }
        }
        offsetPeriod(0, masterDataObject.trixUpDown)
        //console.log(masterDataObject.trix.length, masterDataObject.trixUpDown.length)
    }

    const calcProfit = () => {
        console.log(masterDataObject.long.length, masterDataObject.short.length, masterDataObject.currentPosition)
        let longSum = 0;
        let shortSum = 0;
        for (let index = 0; index < masterDataObject.long.length; index++) {
            // console.log(index, masterDataObject.short[index])
            //if (typeof masterDataObject.short[index] !== 'undefined') {
                longSum = masterDataObject.long[index].y + longSum
                //console.log(masterDataObject.short[index].y - masterDataObject.long[index].y)
            //}
        }
        for (let index = 0; index < masterDataObject.short.length; index++) {
            shortSum = masterDataObject.short[index].y + shortSum
        }

        console.log(longSum, shortSum)


        let gross = shortSum - longSum;
        let totalTradeAmount = shortSum + longSum;
        let fees = totalTradeAmount * 0.00075;
        let net = gross - fees;
        let shortProfit = (longSum - shortSum) * -1;


        console.log('Gross: ', parseFloat(gross.toFixed(2)), 'Fees: ', parseFloat(fees.toFixed(2)), 'Net: ', parseFloat(net.toFixed(2)))

        io.emit('PROFIT_LOG', { gross: parseFloat(gross.toFixed(2)), fees: parseFloat(fees.toFixed(2)), net: parseFloat(net.toFixed(2)) });

    }

    const calcDoji = () => {

        for (let index = 0; index < masterDataObject.time.length; index++) {
            let singleInput = {
                open: [masterDataObject.open[index]],
                high: [masterDataObject.high[index]],
                close: [masterDataObject.close[index]],
                low: [masterDataObject.low[index]],
            }
            var result = doji(singleInput);
            //console.log('Is Doji Pattern? :' + result, masterDataObject.time[index]);
            if (result) {
                masterDataObject.doji.push({close: masterDataObject.close[index], time: masterDataObject.time[index]})

            }
        }
    }

    const calcBullish = () => {
        var threewhitesoldiers =require('technicalindicators').threewhitesoldiers;
        for (let index = 5; index < masterDataObject.time.length; index++) {
            const twoDayBullishInput = {
                open: [masterDataObject.open[index - 4], masterDataObject.open[index - 3], masterDataObject.open[index - 2], masterDataObject.open[index - 1], masterDataObject.open[index]],
                high: [masterDataObject.high[index - 4], masterDataObject.high[index - 3], masterDataObject.high[index - 2], masterDataObject.high[index - 1], masterDataObject.high[index]],
                close: [masterDataObject.close[index - 4], masterDataObject.close[index - 3], masterDataObject.close[index - 2], masterDataObject.close[index - 1], masterDataObject.close[index]],
                low: [masterDataObject.low[index - 4], masterDataObject.low[index - 3], masterDataObject.low[index - 2], masterDataObject.low[index - 1], masterDataObject.low[index]],
            }
            //console.log(threewhitesoldiers(twoDayBullishInput), masterDataObject.time[index])
            if (threewhitesoldiers(twoDayBullishInput)) {
                masterDataObject.bullish.push({time: masterDataObject.time[index], close:  masterDataObject.close[index] - 10})
            }
        }        
    }

    const calcTrixGap = () => {
        for (let index = 1; index < masterDataObject.trix.length; index++) {
            //console.log(masterDataObject.trix[index], masterDataObject.trix[index - 1], masterDataObject.trix[index]- masterDataObject.trix[index - 1])
            let gap = masterDataObject.trix[index] - masterDataObject.trix[index - 1];
            if (gap < 0 ) {
                masterDataObject.trixGap.push(gap)
            } else {
                masterDataObject.trixGap.push(gap)
            }
        }
        offsetPeriod(0, masterDataObject.trixGap)
        console.log(masterDataObject.trixGap.length)
    }

    binance.websockets.chart(pair, timeframe, (symbol, interval, chart) => {
        let tick = binance.last(chart);
        //const last = chart[tick].close;
        //console.info(chart);
        // Optionally convert 'chart' object to array:
        //let ohlc = binance.ohlc(chart);
        //console.info(symbol, ohlc.close[ohlc.close.length - 1]);
        //console.info(symbol+" last price: "+last)

        if (hasExecuted === false) {
            mapCachedData(chart)

            calcSMA()
            calcMFI()
            calcFi()
            calcRSI()
            calcVWAP()
            calcMoneyFlowStretch()
            calcOBV()
            calcKst()
            calcADX()
            //calcEMA()
            calcTRIX()
            calcDoji()
            calcBullish()
            calcTrixGap()

            // Entry runs last
            calcEntry().trixStrategy()
            //calcShort()
            calcProfit()


            //handleLiveSpotTrading()
            setInterval(() => {
                calcSMA()
                calcMFI()
                calcFi()
                calcRSI()
                calcVWAP()
                calcMoneyFlowStretch()
                calcOBV()
                calcKst()
                calcADX()
                //calcEMA()
                calcTRIX()

                // Entry runs last
                if (isFinal) {
                    calcEntry().trixStrategy()
                    //calcShort()
                    calcProfit()
                    //handleLiveSpotTrading()
                }
                calcProfit()

            }, 2000);


            hasExecuted = true;
        }

        handleCurrentAndFinalTick(chart[tick], tick)
        //console.log(close[close.length - 2], open[open.length - 2])
        //console.log(close[close.length - 1], open[open.length - 1])

        //console.log(masterDataObject.short, masterDataObject.long)
    });
}
connectChart()