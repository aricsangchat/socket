var socket = io();
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

$(function () {
    $('form').submit(function(){
        socket.emit('botLog', $('#m').val());
        console.log($('#m').val())
        $('#m').val('');
        return false;
    });

    let mainChart = new CanvasJS.Chart("mainChartContainer", {
        //animationEnabled: true,
        //theme: "light", // "light1", "light2", "dark1", "dark2"
        backgroundColor: "transparent",
        colorSet: "seaShades",
        exportEnabled: true,
        zoomEnabled: true,
        title: {
            text: "ETHUSDT 5m Chart"
        },
        subtitles: [{
            text: "Binance Exchange - Spot Trading"
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
            itemclick: (e) => {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }
        },
        data: []
    });

    let trixChart = new CanvasJS.Chart("mainTrixChart", {
        //animationEnabled: true,
        // theme: "dark2", // "light1", "light2", "dark1", "dark2"
        backgroundColor: "transparent",
        colorSet: "candyShades",
        dataPointMinWidth: 1,
        exportEnabled: true,
        zoomEnabled: true,
        // dataPointWidth: 2,
        title: {
            text: "TRIX Chart"
        },
        subtitles: [{
            text: ""
        }],
        axisX: {
            valueFormatString: "MMM-DD hh:mm",
            //lineThickness: 1,
            lineThickness: 0,
            gridColor: "rgb(81, 81, 81, 1)",
            labelFontColor: "rgb(81, 81, 81, 1)",

        },
        axisY: {
            prefix: "",
            title: "",
            //lineThickness: 1,
            gridColor: "rgb(81, 81, 81, 0.2)",
            lineThickness: 0,
            labelPlacement:"inside",
            labelFontColor: "rgb(81, 81, 81, 1)",
        },
        toolTip: {
            shared: true
        },
        legend: {
            reversed: true,
            cursor: "pointer",
            itemclick: (e) => {
                console.log(e)
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }
        },
        data: []
    });

    socket.on('ETHUSDT-5m-profit-log', function(profit){
        $("#gross").html(profit.gross);
        $("#fees").html(profit.fees);
        $("#net").html(profit.net);

    });

    socket.on('ETHUSDT-5m', (data) => {
        //console.log(data)
        
        mainChart.set("data", [{
            type: "line",
            lineThickness: 1,
            xValueType: "dateTime",
            xValueFormatString: "MMM-DD hh:mm",
            showInLegend: true,
            name: "Close",
            axisYType: "primary",
            yValueFormatString: "",
            dataPoints: data.close
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
            dataPoints: data.long
        },
        {
            type: "line",
            lineColor: "transparent",
            markerType: "triangle",
            markerColor: "#d32c0a",
            markerSize: 10,
            //showInLegend: true,
            name: "Short",
            axisYType: "primary",
            yValueFormatString: "",
            xValueFormatString: "",
            dataPoints: data.short
        }])
        mainChart.render()

        trixChart.set("data", [{
            type: "line",
            lineThickness: 1,
            showInLegend: true,
            name: "Trix",
            axisYType: "primary",
            yValueFormatString: "",
            xValueFormatString: "MMM-DD hh:mm",
            xValueType: "dateTime",
            dataPoints: data.trix
        },{
            type: "column",
            lineThickness: 1,
            showInLegend: true,
            name: "Gap",
            axisYType: "primary",
            yValueFormatString: "",
            xValueFormatString: "MMM-DD hh:mm",
            xValueType: "dateTime",
            dataPoints: data.trixGap
        }])
        trixChart.render()

    });

});

$(function () {

    let secondChart = new CanvasJS.Chart("secondChartContainer", {
        //animationEnabled: true,
        //theme: "light", // "light1", "light2", "dark1", "dark2"
        backgroundColor: "transparent",
        colorSet: "seaShades",
        exportEnabled: true,
        zoomEnabled: true,
        title: {
            text: "ETHUSDT 1h Chart"
        },
        subtitles: [{
            text: "Binance Exchange - Spot Trading"
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
            itemclick: (e) => {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }
        },
        data: []
    });

    let secondTrixChart = new CanvasJS.Chart("secondTrixChart", {
        //animationEnabled: true,
        // theme: "dark2", // "light1", "light2", "dark1", "dark2"
        backgroundColor: "transparent",
        colorSet: "candyShades",
        dataPointMinWidth: 1,
        exportEnabled: true,
        zoomEnabled: true,
        // dataPointWidth: 2,
        title: {
            text: "TRIX Chart"
        },
        subtitles: [{
            text: ""
        }],
        axisX: {
            valueFormatString: "MMM-DD hh:mm",
            //lineThickness: 1,
            lineThickness: 0,
            gridColor: "rgb(81, 81, 81, 1)",
            labelFontColor: "rgb(81, 81, 81, 1)",

        },
        axisY: {
            prefix: "",
            title: "",
            //lineThickness: 1,
            gridColor: "rgb(81, 81, 81, 0.2)",
            lineThickness: 0,
            labelPlacement:"inside",
            labelFontColor: "rgb(81, 81, 81, 1)",
        },
        toolTip: {
            shared: true
        },
        legend: {
            reversed: true,
            cursor: "pointer",
            itemclick: (e) => {
                console.log(e)
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }
        },
        data: []
    });

    socket.on('ETHUSDT-1h-profit-log', function(profit){
        $("#secondGross").html(profit.gross);
        $("#secondFees").html(profit.fees);
        $("#secondNet").html(profit.net);

    });

    socket.on('ETHUSDT-1h', (data) => {
        //console.log(data)
        
        secondChart.set("data", [{
            type: "line",
            lineThickness: 1,
            xValueType: "dateTime",
            xValueFormatString: "MMM-DD hh:mm",
            showInLegend: true,
            name: "Close",
            axisYType: "primary",
            yValueFormatString: "",
            dataPoints: data.close
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
            dataPoints: data.long
        },
        {
            type: "line",
            lineColor: "transparent",
            markerType: "triangle",
            markerColor: "#d32c0a",
            markerSize: 10,
            //showInLegend: true,
            name: "Short",
            axisYType: "primary",
            yValueFormatString: "",
            xValueFormatString: "",
            dataPoints: data.short
        }])
        secondChart.render()

        secondTrixChart.set("data", [{
            type: "line",
            lineThickness: 1,
            showInLegend: true,
            name: "Trix",
            axisYType: "primary",
            yValueFormatString: "",
            xValueFormatString: "MMM-DD hh:mm",
            xValueType: "dateTime",
            dataPoints: data.trix
        },{
            type: "column",
            lineThickness: 1,
            showInLegend: true,
            name: "Gap",
            axisYType: "primary",
            yValueFormatString: "",
            xValueFormatString: "MMM-DD hh:mm",
            xValueType: "dateTime",
            dataPoints: data.trixGap
        }])
        secondTrixChart.render()

    });

});

$(function () {
    
    let streamChart = new CanvasJS.Chart("streamChartContainer", {
        //animationEnabled: true,
        //theme: "light", // "light1", "light2", "dark1", "dark2"
        backgroundColor: "transparent",
        colorSet: "greenShades",
        exportEnabled: true,
        zoomEnabled: true,
        title: {
            text: "ETHUSDT 1h Chart"
        },
        subtitles: [{
            text: "Binance Exchange - Spot Trading"
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
            itemclick: (e) => {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }
        },
        data: []
    });

    socket.on('STREAM', (data) => {
        //console.log('ran',data)
        
        streamChart.set("data", [{
            type: "line",
            lineThickness: 1,
            xValueType: "dateTime",
            xValueFormatString: "MMM-DD hh:mm",
            showInLegend: true,
            name: "Bid",
            axisYType: "primary",
            yValueFormatString: "",
            dataPoints: data.streamBid
        },
        {
            type: "line",
            lineThickness: 1,
            xValueType: "dateTime",
            xValueFormatString: "MMM-DD hh:mm",
            showInLegend: true,
            name: "Ask",
            axisYType: "primary",
            yValueFormatString: "",
            dataPoints: data.streamAsk
        }])
        streamChart.render()

    });

});
