let data = [];

$(function () {
  var socket = io();
  $('form').submit(function(){
    socket.emit('botLog', $('#m').val());
    $('#m').val('');
    return false;
  });

  socket.on('botLog', function(msg){
    $('#messages').append($('<li>').text(msg));
    if ($("#messages li").length >= 10) {
      $("#messages li:first").remove();
    }
  });

  socket.on('chart', function(closeData, chartName){
    const chartLayout = { 
      title: chartName,
      aspectmode: 'cube'
    };
    if (!document.getElementById(chartName)) {
      console.log(closeData, chartName);
      let div = document.createElement('div');
      div.setAttribute("id", chartName);
      document.getElementById("charts").appendChild(div);
    }
    Plotly.newPlot(chartName, closeData, chartLayout);
  });
});