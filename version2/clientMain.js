var socket = io();

$(function () {
    let candlestickData = [];
    let vwapData = [];
    let longData = [];
    let shortData = [];
    let closeData = [];
    let lowData = [];
    let highData = [];
    let rsiData = [];
    let mfiData = [];
    let fiData = [];
    let obvData = [];
    let kstData = [];
    let kstSignalData = [];
    let adxData = [];
    let pdiData = [];
    let mdiData = [];
    let secondRSIData = [];

    let hasChartExecuted = false;
    let chartsLoaded = false;
    let ohlcChartInstance = '';
    let rsiChartInstance = '';
    let fiChartInstance = '';
    let obvChartInstance = '';
    let kstChartInstance = '';
    let adxChartInstance = '';

    CanvasJS.addColorSet("greenShades",
        [
            "#2F4F4F",
            "#008080",
            "#2E8B57",
            "#3CB371",
            "#90EE90",
            "#4661EE",
            "#EC5657"
        ]);
    CanvasJS.addColorSet("kstColorSet",
        [
            "rgba(0,75,141,0.7)",
            "rgba(40,175,101,0.6)",
        ]);
    CanvasJS.addColorSet("candyShades",
        [
            "#FD49A0",
            "#A16AE8",
            "#B4FEE7",
            "#603F8B",
        ]
    );
    CanvasJS.addColorSet("seaShades",
        [
            "#4E4F50",
            "#4E4F50",
            "#E2DED0",
            "#647C90",
        ]
    );

    const mapData = (masterObject) => {
        candlestickData = [];
        vwapData = [];
        longData = [];
        shortData = [];
        closeData = [];
        lowData = [];
        highData = [];
        rsiData = [];
        mfiData = [];
        fiData = [];
        obvData = [];
        kstData = [];
        kstSignalData = [];
        adxData = [];
        pdiData = [];
        mdiData = [];
        secondRSIData = [];
        //console.log(masterObject.adx)
        for (let index = 0; index < masterObject.time.length; index++) {
            //console.log(masterObject.adx.length)
            candlestickData.push({ x: new Date(masterObject.time[index]), y: [masterObject.open[index], masterObject.high[index], masterObject.low[index], masterObject.close[index]] })
            vwapData.push({ x: new Date(masterObject.time[index]), y: masterObject.vwap[index] })
            closeData.push({ x: new Date(masterObject.time[index]), y: masterObject.close[index] })
            lowData.push({ x: new Date(masterObject.time[index]), y: masterObject.low[index] })
            highData.push({ x: new Date(masterObject.time[index]), y: masterObject.high[index] })
            rsiData.push({ x: new Date(masterObject.time[index]), y: masterObject.rsi[index] })
            
            fiData.push({ x: new Date(masterObject.time[index]), y: masterObject.fi[index] })
            obvData.push({ x: new Date(masterObject.time[index]), y: masterObject.obv[index] })
            
            
            
            adxData.push({ x: new Date(masterObject.time[index]), y: masterObject.adx[index] == 0 ? 0 : masterObject.adx[index].adx })
            pdiData.push({ x: new Date(masterObject.time[index]), y: masterObject.adx[index] == 0 ? 0 : masterObject.adx[index].pdi })
            mdiData.push({ x: new Date(masterObject.time[index]), y: masterObject.adx[index] == 0 ? 0 : masterObject.adx[index].mdi })
        }
        for (let index = 0; index < masterObject.mfi.length; index++) {
            //console.log(index, masterObject.kst.length)
            mfiData.push({ x: new Date(masterObject.time[index]), y: masterObject.mfi[index] })

        }
        for (let index = 0; index < masterObject.secondRSI.length; index++) {
            //console.log(index, masterObject.secondRSI.length)
            secondRSIData.push({ x: new Date(masterObject.time[index]), y: masterObject.secondRSI[index] })
        }
        for (let index = 0; index < masterObject.kst.length; index++) {
            console.log(index, masterObject.kst.length)
            kstData.push({ x: new Date(masterObject.time[index]), y: masterObject.kst[index] })
        }
        for (let index = 0; index < masterObject.kstSignal.length; index++) {
            //console.log(index, masterObject.kstSignal.length)
            kstSignalData.push({ x: new Date(masterObject.time[index]), y: masterObject.kstSignal[index] })
        }
        for (let index = 0; index < masterObject.long.length; index++) {
            longData.push({ x: new Date(masterObject.long[index].x), y: masterObject.long[index].y })
        }
        for (let index = 0; index < masterObject.short.length; index++) {
            shortData.push({ x: new Date(masterObject.short[index].x), y: masterObject.short[index].y })
        }
        //console.log(kstData, obvData)
    }

    const updateData = (masterObject) => {
        
        //console.log(closeData.length, masterObject.close.length)
        if (closeData.length !== masterObject.close.length) {
            vwapData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.vwap[masterObject.vwap.length - 1] })
            closeData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.close[masterObject.close.length - 1] })
            lowData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.low[masterObject.low.length - 1] })
            highData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.high[masterObject.high.length - 1] })
            rsiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.rsi[masterObject.rsi.length - 1] })

            secondRSIData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.secondRSI[masterObject.secondRSI.length - 1] })

            mfiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.mfi[masterObject.mfi.length - 1] })

            fiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.fi[masterObject.fi.length - 1] })
            obvData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.obv[masterObject.obv.length - 1] })
            
            kstData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.kst[masterObject.kst.length - 1] })
            kstSignalData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.kstSignal[masterObject.kstSignal.length - 1] })

            longData.push({ x: new Date(masterObject.long[masterObject.long.length - 1].x), y: masterObject.long[masterObject.long.length - 1].y })
            shortData.push({ x: new Date(masterObject.short[masterObject.short.length - 1].x), y: masterObject.short[masterObject.short.length - 1].y })

            adxData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.adx[masterObject.adx.length - 1] === 0 ? 0 : masterObject.adx[masterObject.adx.length - 1].adx })
            pdiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.adx[masterObject.adx.length - 1] === 0 ? 0 : masterObject.adx[masterObject.adx.length - 1].pdi })
            mdiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.adx[masterObject.adx.length - 1] === 0 ? 0 : masterObject.adx[masterObject.adx.length - 1].mdi })

        } else {
            //console.log(masterObject.close[masterObject.close.length - 1], closeData[closeData.length - 2], closeData[closeData.length - 1])
            
            vwapData.pop()
            closeData.pop()
            lowData.pop()
            highData.pop()
            rsiData.pop()
            secondRSIData.pop()
            mfiData.pop()
            fiData.pop()
            obvData.pop()
            kstData.pop()
            kstSignalData.pop()
            longData.pop()
            shortData.pop()
            adxData.pop()
            pdiData.pop()
            mdiData.pop()
            longData.push({ x: new Date(masterObject.long[masterObject.long.length - 1].x), y: masterObject.long[masterObject.long.length - 1].y })
            shortData.push({ x: new Date(masterObject.short[masterObject.short.length - 1].x), y: masterObject.short[masterObject.short.length - 1].y })


            vwapData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.vwap[masterObject.vwap.length - 1] })
            closeData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.close[masterObject.close.length - 1] })
            lowData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.low[masterObject.low.length - 1] })
            highData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.high[masterObject.high.length - 1] })
            rsiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.rsi[masterObject.rsi.length - 1] })

            //console.log(secondRSIData[secondRSIData.length - 1], new Date(masterObject.time[masterObject.time.length - 23]), masterObject.secondRSI[masterObject.secondRSI.length - 2])


            secondRSIData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.secondRSI[masterObject.secondRSI.length - 1] })

            mfiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.mfi[masterObject.mfi.length - 1] })

            fiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.fi[masterObject.fi.length - 1] })
            obvData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.obv[masterObject.obv.length - 1] })

            kstData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.kst[masterObject.kst.length - 1] })
            kstSignalData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.kstSignal[masterObject.kstSignal.length - 1] })
            adxData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.adx[masterObject.adx.length - 1] === 0 ? 0 : masterObject.adx[masterObject.adx.length - 1].adx })
            
            pdiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.adx[masterObject.adx.length - 1] === 0 ? 0 : masterObject.adx[masterObject.adx.length - 1].pdi })
            
            mdiData.push({ x: new Date(masterObject.time[masterObject.time.length - 1]), y: masterObject.adx[masterObject.adx.length - 1] === 0 ? 0 : masterObject.adx[masterObject.adx.length - 1].mdi })
            ohlcChartInstance.render();
            rsiChartInstance.render()
            fiChartInstance.render()
            obvChartInstance.render()
            kstChartInstance.render()
            // adxChartInstance.render();
        }
    }

    const renderCharts = () => {
        ohlcChart()
        rsiChart()
        fiChart()
        obvChart()
        kstChart()
        adxChart()
        // createLineChart({
        //     idSelector: "obvChart",
        //     name: 'OBV Chart',
        //     data: [obvData],
        //     dataType: 'line',
        //     colorSet: "candyShades"
        // })
        // createLineChart({
        //     idSelector: "kstChart",
        //     name: 'KST Chart',
        //     data: [kstData, kstSignalData],
        //     dataType: 'area',
        //     colorSet: "kstColorSet"
        // })
    }

    const ohlcChart = () => {
        // if (hasChartExecuted === false) {
            ohlcChartInstance = new CanvasJS.Chart("chartContainer", {
                //animationEnabled: true,
                //theme: "light", // "light1", "light2", "dark1", "dark2"
                backgroundColor: "transparent",
                colorSet: "seaShades",
                exportEnabled: true,
                zoomEnabled: true,
                title: {
                    text: "ETHUSDT Visual Chart"
                },
                subtitles: [{
                    text: "Binance Exchance Spot Trading"
                }],
                axisX: {
                    valueFormatString: "MMM-DD hh:mm",
                    // gridColor: "rgb(47, 243, 224, 0.3)",
                    lineThickness: 0,
                    //lineColor: "green"
                    labelFontColor: "rgb(81, 81, 81, 1)",
                    gridThickness: 0
                },
                axisY: {
                    prefix: "$",
                    //gridColor: "rgb(81, 81, 81, 0.3)",
                    lineThickness: 0,
                    labelPlacement:"inside",
                    labelFontColor: "rgb(81, 81, 81, 1)",
                    gridThickness: 0
                    //valueFormatString: "##",
                    //lineColor: "green"
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    reversed: true,
                    cursor: "pointer",
                    itemclick: toggleDataSeries
                },
                data: [
                    {
                        type: "line",
                        lineThickness: 1,
                        //showInLegend: true,
                        name: "VWAP",
                        axisYType: "primary",
                        yValueFormatString: "",
                        xValueFormatString: "MMM-DD hh:mm",
                        dataPoints: vwapData
                    },
                    {
                        type: "line",
                        lineColor: "transparent",
                        markerType: "triangle",
                        markerColor: "#36EEE0",
                        markerSize: 10,
                        //showInLegend: true,
                        name: "Long",
                        axisYType: "primary",
                        yValueFormatString: "",
                        xValueFormatString: "",
                        dataPoints: longData
                    },
                    {
                        type: "line",
                        lineColor: "transparent",
                        markerType: "triangle",
                        markerColor: "#F51720",
                        markerSize: 10,
                        //showInLegend: true,
                        name: "Short",
                        axisYType: "primary",
                        yValueFormatString: "",
                        xValueFormatString: "",
                        dataPoints: shortData
                    },
                    {
                        type: "line",
                        lineThickness: 1,
                        // lineColor: "green",
                        //showInLegend: true,
                        name: "Close",
                        axisYType: "primary",
                        yValueFormatString: "",
                        xValueFormatString: "",
                        dataPoints: closeData
                    },
                    {
                        type: "line",
                        lineThickness: 1,
                        // lineColor: "pink",
                        //showInLegend: true,
                        name: "Low",
                        axisYType: "primary",
                        yValueFormatString: "",
                        xValueFormatString: "",
                        dataPoints: lowData
                    },
                    {
                        type: "line",
                        lineThickness: 1,
                        // lineColor: "blue",
                        //showInLegend: true,
                        name: "High",
                        axisYType: "primary",
                        yValueFormatString: "",
                        xValueFormatString: "",
                        dataPoints: highData
                    }
                ]
            });

            // for (let index = 0; index < time.length; index++) {
            //     candlestickData.push({ x: new Date(time[index]), y: [open[index], high[index], low[index], close[index]] })
            //     vwapData.push({ x: new Date(time[index]), y: vwap[index] })
            //     closeData.push({ x: new Date(time[index]), y: close[index] })
            //     lowData.push({ x: new Date(time[index]), y: low[index] })
            //     highData.push({ x: new Date(time[index]), y: high[index] })

            // }

            // for (let index = 0; index < entry.length; index++) {
            //     entryData.push({ x: new Date(entry[index].x), y: entry[index].y })
            // }
        //     hasChartExecuted = true;
        // } else {
        //     vwapData.pop()
        //     closeData.pop()
        //     lowData.pop()
        //     highData.pop()
        //     vwapData.push({ x: new Date(time[time.length - 1]), y: vwap[vwap.lenght - 1] })
        //     closeData.push({ x: new Date(time[time.length - 1]), y: close[close.length - 1] })
        //     lowData.push({ x: new Date(time[time.length - 1]), y: low[low.length - 1] })
        //     highData.push({ x: new Date(time[time.length - 1]), y: high[high.length - 1] })
        // }

        ohlcChartInstance.render();

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.ohlcChartInstance.render();
        }

    }

    const rsiChart = () => {
        // for (let index = 0; index < time.length; index++) {
        //     rsiData.push({ x: new Date(time[index]), y: rsi[index] })
        //     mfiData.push({ x: new Date(time[index]), y: mfi[index] })
        // }

        rsiChartInstance = new CanvasJS.Chart("chartContainerTwo", {
            //animationEnabled: true,
            // theme: "dark2", // "light1", "light2", "dark1", "dark2"
            backgroundColor: "transparent",
            colorSet: "candyShades",
            dataPointMinWidth: 1,
            exportEnabled: true,
            zoomEnabled: true,
            // dataPointWidth: 2,
            title: {
                text: "Indicator Chart"
            },
            subtitles: [{
                text: ""
            }],
            axisX: {
                valueFormatString: "MMM-DD hh:mm",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",
                gridThickness: 0

            },
            axisY: {
                prefix: "",
                title: "",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",
                gridThickness: 0

            },
            toolTip: {
                shared: true
            },
            legend: {
                reversed: true,
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: [
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "blue",
                    showInLegend: true,
                    name: "RSI 21",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: rsiData
                },
                
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "red",
                    showInLegend: true,
                    name: "MFI",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: mfiData
                },
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "red",
                    showInLegend: true,
                    name: "RSI 8",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: secondRSIData
                },
            ]
        });
        rsiChartInstance.render();

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.rsiChartInstance.render();
        }
    }

    const fiChart = () => {
        // for (let index = 0; index < time.length; index++) {
        //     fiData.push({ x: new Date(time[index]), y: fi[index] })
        // }

        fiChartInstance = new CanvasJS.Chart("chartContainerThree", {
            //animationEnabled: true,
            // theme: "dark2", // "light1", "light2", "dark1", "dark2"
            backgroundColor: "transparent",
            colorSet: "candyShades",
            dataPointMinWidth: 1,
            exportEnabled: true,
            zoomEnabled: true,
            // dataPointWidth: 2,
            title: {
                text: "FI Chart"
            },
            subtitles: [{
                text: ""
            }],
            axisX: {
                valueFormatString: "MMM-DD hh:mm",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",

            },
            axisY: {
                prefix: "",
                title: "",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",
                labelPlacement:"inside",

            },
            toolTip: {
                shared: true
            },
            legend: {
                reversed: true,
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: [
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "blue",
                    showInLegend: true,
                    name: "Force Index",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: fiData
                },
            ]
        });
        fiChartInstance.render();

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.fiChartInstance.render();
        }
    }

    const adxChart = () => {
        // for (let index = 0; index < time.length; index++) {
        //     fiData.push({ x: new Date(time[index]), y: fi[index] })
        // }

        adxChartInstance = new CanvasJS.Chart("adxChartContainer", {
            //animationEnabled: true,
            // theme: "dark2", // "light1", "light2", "dark1", "dark2"
            backgroundColor: "transparent",
            colorSet: "candyShades",
            dataPointMinWidth: 1,
            exportEnabled: true,
            zoomEnabled: true,
            // dataPointWidth: 2,
            title: {
                text: "ADX Chart"
            },
            subtitles: [{
                text: ""
            }],
            axisX: {
                valueFormatString: "MMM-DD hh:mm",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",

            },
            axisY: {
                prefix: "",
                title: "",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",
                labelPlacement:"inside",

            },
            toolTip: {
                shared: true
            },
            legend: {
                reversed: true,
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: [
                
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "red",
                    showInLegend: true,
                    name: "ADX",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: adxData
                },
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "red",
                    showInLegend: true,
                    name: "PDI",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: pdiData
                },
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "red",
                    showInLegend: true,
                    name: "MDI",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: mdiData
                }
            ]
        });
        adxChartInstance.render();

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.adxChartInstance.render();
        }
    }

    // const moneyFlowStretch = (time, positiveStretch, negativeStretch) => {
    //     let positiveData = [];
    //     let negativeData = [];
    //     CanvasJS.addColorSet("candyShades",
    //         [
    //             "#FD49A0",
    //             "#A16AE8",
    //             "#B4FEE7",
    //             "#603F8B",
    //         ]
    //     );

    //     console.log(positiveStretch, negativeStretch)

    //     for (let index = 0; index < time.length; index++) {
    //         positiveData.push({ x: new Date(time[index]), y: positiveStretch[index] })
    //         negativeData.push({ x: new Date(time[index]), y: negativeStretch[index] })
    //     }

    //     var chart = new CanvasJS.Chart("chartContainerFour", {
    //         //animationEnabled: true,
    //         // theme: "dark2", // "light1", "light2", "dark1", "dark2"
    //         backgroundColor: "transparent",
    //         colorSet: "candyShades",
    //         dataPointMinWidth: 1,
    //         exportEnabled: true,
    //         zoomEnabled: true,
    //         // dataPointWidth: 2,
    //         title: {
    //             text: "Money Flow Stretch Chart"
    //         },
    //         subtitles: [{
    //             text: ""
    //         }],
    //         axisX: {
    //             valueFormatString: "MMM-DD hh:mm",
    //             //lineThickness: 1,
    //             gridColor: "#4C5270",
    //             lineThickness: 0,
    //             gridColor: "rgb(47, 243, 224, 0.03)",

    //         },
    //         axisY: {
    //             prefix: "",
    //             title: "",
    //             //lineThickness: 1,
    //             gridColor: "#4C5270",
    //             lineThickness: 0,
    //             gridColor: "rgb(47, 243, 224, 0.03)",

    //         },
    //         toolTip: {
    //             shared: true
    //         },
    //         legend: {
    //             reversed: true,
    //             cursor: "pointer",
    //             itemclick: toggleDataSeries
    //         },
    //         data: [
    //             {
    //                 type: "column",
    //                 lineThickness: 1,
    //                 //lineColor: "blue",
    //                 showInLegend: true,
    //                 name: "Positive",
    //                 axisYType: "primary",
    //                 yValueFormatString: "",
    //                 xValueFormatString: "MMM-DD hh:mm",
    //                 dataPoints: positiveData
    //             },
    //             {
    //                 type: "column",
    //                 lineThickness: 1,
    //                 //lineColor: "blue",
    //                 showInLegend: true,
    //                 name: "Negative",
    //                 axisYType: "primary",
    //                 yValueFormatString: "",
    //                 xValueFormatString: "",
    //                 dataPoints: negativeData
    //             },
    //         ]
    //     });
    //     chart.render();

    //     function toggleDataSeries(e) {
    //         if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
    //             e.dataSeries.visible = false;
    //         } else {
    //             e.dataSeries.visible = true;
    //         }
    //         e.chart.render();
    //     }
    // }

    const obvChart = (options) => {

        const addDataSets = () => {
            let dataSet = [];

            for (let index = 0; index < options.data.length; index++) {
                dataSet.push({
                    type: options.dataType,
                    lineThickness: 1,
                    //lineColor: "blue",
                    showInLegend: true,
                    name: options.name,
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: options.data[index]
                })
            }
            //console.log(dataSet)
            return dataSet;
        }

        obvChartInstance = new CanvasJS.Chart("obvChart", {
            //animationEnabled: true,
            // theme: "dark2", // "light1", "light2", "dark1", "dark2"
            backgroundColor: "transparent",
            colorSet: "candyShades",
            dataPointMinWidth: 1,
            exportEnabled: true,
            zoomEnabled: true,
            // dataPointWidth: 2,
            title: {
                text: "OBV Chart"
            },
            subtitles: [{
                text: ""
            }],
            axisX: {
                valueFormatString: "MMM-DD hh:mm",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",

            },
            axisY: {
                prefix: "",
                title: "",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(47, 243, 224, 0.03)",
                labelPlacement:"inside",
            },
            toolTip: {
                shared: true
            },
            legend: {
                reversed: true,
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: [{
                type: "line",
                lineThickness: 1,
                //lineColor: "blue",
                showInLegend: true,
                name: "OBV",
                axisYType: "primary",
                yValueFormatString: "",
                xValueFormatString: "MMM-DD hh:mm",
                dataPoints: obvData
            }]
        });
        obvChartInstance.render();

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.obvChartInstance.render();
        }
    }

    const kstChart = (options) => {

        const addDataSets = () => {
            let dataSet = [];

            for (let index = 0; index < options.data.length; index++) {
                dataSet.push({
                    type: options.dataType,
                    lineThickness: 1,
                    //lineColor: "blue",
                    showInLegend: true,
                    name: options.name,
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: options.data[index]
                })
            }
            //console.log(dataSet)
            return dataSet;
        }

        kstChartInstance = new CanvasJS.Chart("kstChart", {
            //animationEnabled: true,
            // theme: "dark2", // "light1", "light2", "dark1", "dark2"
            backgroundColor: "transparent",
            colorSet: "kstColorSet",
            dataPointMinWidth: 1,
            exportEnabled: true,
            zoomEnabled: true,
            // dataPointWidth: 2,
            title: {
                text: "KST Chart"
            },
            subtitles: [{
                text: ""
            }],
            axisX: {
                valueFormatString: "MMM-DD hh:mm",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(81, 81, 81, 0.1)",
                labelFontColor: "rgb(81, 81, 81, 1)",


            },
            axisY: {
                prefix: "",
                title: "",
                //lineThickness: 1,
                gridColor: "#4C5270",
                lineThickness: 0,
                gridColor: "rgb(81, 81, 81, 0.1)",
                labelFontColor: "rgb(81, 81, 81, 1)",
                labelPlacement:"inside",


            },
            toolTip: {
                shared: true
            },
            legend: {
                reversed: true,
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: [
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "blue",
                    showInLegend: true,
                    name: "KST",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: kstData
                },
                {
                    type: "line",
                    lineThickness: 1,
                    //lineColor: "blue",
                    showInLegend: true,
                    name: "Signal",
                    axisYType: "primary",
                    yValueFormatString: "",
                    xValueFormatString: "MMM-DD hh:mm",
                    dataPoints: kstSignalData
                },
                // {
                //     type: "line",
                //     lineThickness: 1,
                //     //lineColor: "blue",
                //     showInLegend: true,
                //     name: "Force Index",
                //     axisYType: "primary",
                //     yValueFormatString: "",
                //     xValueFormatString: "MMM-DD hh:mm",
                //     dataPoints: fiData
                // },
            ]
        });
        kstChartInstance.render();

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.kstChartInstance.render();
        }
    }

    socket.on('CHART_DATA', (masterObject) => {
        console.log(masterObject.liveOpenLongs, masterObject.liveOpenShorts)
        if (chartsLoaded === false) {
            mapData(masterObject)
            renderCharts()
            
            chartsLoaded = true
        } else {
            updateData(masterObject)
        }


    });


});
