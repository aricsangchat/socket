module.exports = class Chart {
  constructor() {
    this.settings = require('../settings.js');
    this._ = require('lodash');
    this.helpers = require('./helpers.js');

    this.closetrace1 = {
      x: [],
      y: [],
      mode: 'markers',
      name: 'Cost'
    };
    this.closetrace2 = {
      x: [],
      y: [],
      mode: 'lines',
      name: 'EMA-7'
    };
    this.closetrace3 = {
      x: [],
      y: [],
      mode: 'lines',
      name: 'EMA-25'
    };
    this.closetrace4 = {
      x: [],
      y: [],
      mode: 'lines',
      name: 'EMA-99'
    };
    this.closetrace5 = {
      x: [],
      y: [],
      mode: 'markers',
      name: 'Buy'
    };
    this.closetrace6 = {
      x: [],
      y: [],
      mode: 'markers',
      name: 'Sell'
    };
    this.percentageTrace2Trace3 = {
      x: [],
      y: [],
      mode: 'markers',
      name: 'Percentage-7/25'
    };
    this.percentageTrace2Trace4 = {
      x: [],
      y: [],
      mode: 'markers',
      name: 'Percentage-7/99'
    };
    this.percentageTrace3Trace4 = {
      x: [],
      y: [],
      mode: 'markers',
      name: 'Percentage-25/99'
    };
    this.openOrders99 = [];
    this.openOrders97 = [];
    this.openOrders95 = [];
    this.timeout;
  }
  
  getSocketChartData(ticker, interval, chartName, io) {
    const binance = require('node-binance-api');

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
        this.graphEma(parseFloat(chart[tick].close), Date.now(), io, chartName, last);
      }
      //console.log(symbol+" last price: "+last);
      io.emit('botLog', 'Engage: '+ this.settings.engage);
      io.emit('botLog', 'Speed: '+ this.settings.tradeSpeed);
    });
    
    let that = this;
    this.timeOut = setTimeout(function(){
      Object.keys(chartData).map(function(key) {
        
        that.graphEma(parseFloat(chartData[key].close), parseFloat(key), io, chartName);
        
        //return [{[key]: chartData[key]}];
      });
    }, 4000);
  }

  graphEma(close, time, io, chartName, last) {
    let closeData = [ this.closetrace1, this.closetrace2, this.closetrace3, this.closetrace4, this.closetrace5, this.closetrace6 ];
    if (this.closetrace1.x.length > 2) {
      this.closetrace1.x.push(time);
      this.closetrace1.y.push(parseFloat(parseFloat(close).toFixed(this.settings.decimalPlace)));
      this.closetrace2.x.push(time);
      this.closetrace2.y.push(this.helpers.calculateMovingAverage(close,this.closetrace2.y[this.closetrace2.y.length - 1], 7));
      this.closetrace3.x.push(time);
      this.closetrace3.y.push(this.helpers.calculateMovingAverage(close,this.closetrace3.y[this.closetrace3.y.length - 1], 25));
      this.closetrace4.x.push(time);
      this.closetrace4.y.push(this.helpers.calculateMovingAverage(close,this.closetrace4.y[this.closetrace4.y.length - 1], 99));
      this.mapPercentage(this.closetrace1.y, this.closetrace2.y, this.closetrace3.y, this.closetrace4.y, this.closetrace5.y, this.closetrace6.y, time, close, io, chartName);
      this.declareTrend(this.closetrace1.y, this.closetrace2.y, this.closetrace3.y, this.closetrace4.y, this.closetrace5.y, this.closetrace6.y, time, close );
    } else {
      this.closetrace1.x.push(time);
      this.closetrace1.y.push(parseFloat(parseFloat(close).toFixed(this.settings.decimalPlace)));
      this.closetrace2.x.push(time);
      this.closetrace2.y.push(parseFloat(parseFloat(close).toFixed(this.settings.decimalPlace)));
      this.closetrace3.x.push(time);
      this.closetrace3.y.push(parseFloat(parseFloat(close).toFixed(this.settings.decimalPlace)));
      this.closetrace4.x.push(time);
      this.closetrace4.y.push(parseFloat(parseFloat(close).toFixed(this.settings.decimalPlace)));
      this.mapPercentage(this.closetrace1.y, this.closetrace2.y, this.closetrace3.y, this.closetrace4.y, this.closetrace5.y, this.closetrace6.y, time, close, io, chartName);
      this.declareTrend(this.closetrace1.y, this.closetrace2.y, this.closetrace3.y, this.closetrace4.y, this.closetrace5.y, this.closetrace6.y, time, close );
    }
    //handleBuySell(time, close, last);
    //handleUpDownBuySell(time, close, last);
    
    //console.log('sum5:', this._.sum(this.closetrace5.y));
    //console.log('sum6:', this._.sum(this.closetrace6.y));
    //console.log('profit:', parseFloat(this._.sum(this.closetrace6.y)) - parseFloat(this._.sum(this.closetrace5.y)));
    io.emit('chart', closeData, chartName);
  }

  declareTrend(trace1, trace2, trace3, trace4, trace5, trace6, time, close) {
    if (trace2[trace2.length - 1] > trace3[trace3.length - 1] && trace3[trace3.length - 1] > trace4[trace4.length - 1]) {
      this.settings.trend.push('up');
    } else if (trace2[trace2.length - 1] < trace3[trace3.length - 1] && trace3[trace3.length - 1] < trace4[trace4.length - 1]) {
      this.settings.trend.push('down');
    }
    
    if (this.settings.trend.length > 5) {
      this.settings.trend.shift();
    }
  }
  
  mapPercentage(trace1, trace2, trace3, trace4, trace5, trace6, time, close, io, chartName) {
    
    let percentageData = [ this.percentageTrace2Trace3, this.percentageTrace2Trace4, this.percentageTrace3Trace4 ];
    this.percentageTrace2Trace3.x.push(time);
    this.percentageTrace2Trace3.y.push(parseFloat(trace2[trace2.length - 1])/parseFloat(trace3[trace3.length - 1]) * 100);
    this.percentageTrace2Trace4.x.push(time);
    this.percentageTrace2Trace4.y.push(parseFloat(trace2[trace2.length - 1])/parseFloat(trace4[trace4.length - 1]) * 100);
    this.percentageTrace3Trace4.x.push(time - 0);
    this.percentageTrace3Trace4.y.push(parseFloat(trace3[trace3.length - 1])/parseFloat(trace4[trace4.length - 1]) * 100);
    this.declarePercentageTrend(this.percentageTrace2Trace3.y, this.settings.bluePercentageTrend);
    this.declarePercentageTrend(this.percentageTrace2Trace4.y, this.settings.orangePercentageTrend);
    this.declarePercentageTrend(this.percentageTrace3Trace4.y, this.settings.greenPercentageTrend);
    io.emit('chart', percentageData, `${chartName}Percentage`);
  }
  
  declarePercentageTrend(trace, trend) {
    if (trace[trace.length - 1] > trace[trace.length - 2]) {
      trend.push('up');
    } else {
      trend.push('down');
    }
    if (trend.length > 60) {
      trend.shift();
    }
  }
}