
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const _ = require('lodash');
var port = process.env.PORT || 3000;
const config = require('./config.json');
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
const CoinbasePro = require('coinbase-pro');
const publicClient = new CoinbasePro.PublicClient();

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
    APIKEY: config.BINANCE_APIKEY,
    APISECRET: config.BINANCE_APISECRET,
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
    kstGap: []
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

    setInterval(() => {
        io.emit('CHART_DATA', masterDataObject);
    }, 2000);
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
            data.unshift(0)
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
        console.log(masterDataObject.rsi.length, masterDataObject.secondRSI.length)
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
        
        
        
        if ( masterDataObject.long.length === 0 && hasCalcEntryExecuted === false ) {
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
            console.log(masterDataObject.rsiCrossOver)

            for (let index = 60; index < masterDataObject.time.length; index++) {
                //console.log(masterDataObject.kstGap[index], masterDataObject.kstGap[index - 1])
                // if (masterDataObject.kstGap[index] === true && (masterDataObject.kstGap[index - 1] === false && masterDataObject.kstSignal[index] < -16.5)) {
                //     //masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                // }
                if (masterDataObject.rsiCrossOver[index] === true && masterDataObject.rsiCrossOver[index - 1] === false) {
                    
                    if (masterDataObject.secondRSI[index] < 40) {
                        masterDataObject.long.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                   }
                }
                if (masterDataObject.rsiCrossOver[index] === false && masterDataObject.rsiCrossOver[index - 1] === true) {
                    masterDataObject.short.push({ x: new Date(masterDataObject.time[index]), y: masterDataObject.close[index] })
                }
            }
            hasCalcEntryExecuted = true;
        }

    }
    const calcShort = () => {
        
        if ( masterDataObject.long.length > 0 && hasCalcShortExecuted === false ) {
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
            signalPeriod: 35 // 3, 8
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
            masterDataObject.kstSignal.push( res[index].signal)
        }
        masterDataObject.kstSignal = _.compact(masterDataObject.kstSignal);
        masterDataObject.kst = SMA.calculate({period: 21, values: masterDataObject.kst}) // 9
        // masterDataObject.kstSignal = SMA.calculate({period: 9, values: masterDataObject.kstSignal}) // 9
        // for (let index = 0; index < 10; index++) {
        //     // masterDataObject.kst.push(Math.random(getRandomIntInclusive(masterDataObject.kst[masterDataObject.kst.length - 1], masterDataObject.kst[masterDataObject.kst.length - 1] + 0.55)))
        //     masterDataObject.kstSignal.pop()
        // }

        for (let index = 0; index < masterDataObject.kstSignal.length; index++) {
            //console.log(masterDataObject.kstSignal[index - 1] + masterDataObject.kst[index - 1],masterDataObject.kstSignal[index] + masterDataObject.kst[index])
            if (masterDataObject.kstSignal[index - 1] + masterDataObject.kst[index - 1] > masterDataObject.kstSignal[index] + masterDataObject.kst[index]) {
                masterDataObject.kstGap.push(true)
            } {
                masterDataObject.kstGap.push(false)
            }
            
            
        }
        //console.log(masterDataObject.kstGap)
        offsetPeriod(63, masterDataObject.kst);
        offsetPeriod(77, masterDataObject.kstSignal);
        
        //console.log( masterDataObject.kst.length, masterDataObject.kstSignal.length)

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
            if (masterDataObject.kstCrossOver[masterDataObject.kstCrossOver.length - 1] === true && ( masterDataObject.kstCrossOver[masterDataObject.kstCrossOver - 2] === false && masterDataObject.rsiCrossOver[masterDataObject.rsiCrossOver.length - 1] === true)) {
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

            // Entry runs last
            calcEntry()
            calcShort()

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

                // Entry runs last
                calcEntry()
                calcShort()
                //handleLiveSpotTrading()
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