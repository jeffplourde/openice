
var OpenICE = require('./openice.js');
var prefs = require('./demopreferences.js');
var io = require('socket.io-client');
var moment = require('moment');
var jsmpg = require('./jsmpg.js');
var PartitionBox = require('./partition-box.js');
var Renderer = require('./plot.js');

var partition = ['MRN=55555'];

Date.now = Date.now || function() { return +new Date; }; 

if (typeof Array.prototype.forEach != 'function') {
  Array.prototype.forEach = function(callback){
    for (var i = 0; i < this.length; i++){
      callback.apply(this, [this[i], i, this]);
    } 
  };
}
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-51695046-1', 'auto');ga('send', 'pageview');




var openICE;
var mpegClients = [];
var demopreferences;


// We primarily use domain 15 for physiological data in the lab
var targetDomain = 15;

var expectedDelay = 2000;
var timeDomain = 10000;
var acceptableOutOfSync = 2000;
var PLOT_INTERVAL = 125;

var cssIllegal = /[^_a-zA-Z0-9-]/g;

var renderers = [];

function renderFunction() {
  if(renderers.length > 0) {
    var now = Date.now();
    var t1 = now - timeDomain - expectedDelay;
    var t2 = now - expectedDelay;
    
    var s1 = moment(t1).format('HH:mm:ss');
    var s2 = moment(t2).format('HH:mm:ss');

    for(var i = 0; i < renderers.length; i++) {
      var canvas = renderers[i].canvas;
      var row = renderers[i].row;

      if(canvas.startTime && canvas.endTime) {
        // Locked down time interval
        renderers[i].render(canvas.startTime, canvas.endTime, canvas.startTimeString, canvas.endTimeString);
      } else {
        // Adjustment factor in the case where data time is wildly out of sync with
        // the local clock
        var adjustTime = 0;

        var mostRecentData = row.latest_sample;
        if(mostRecentData) {
          adjustTime = mostRecentData - now;

          // Gross tolerance for latency / bad clock sync is +/- 2 seconds
          // When in excess of that adjust
          if(adjustTime >= acceptableOutOfSync) {
            adjustTime -= acceptableOutOfSync;
          } else if(adjustTime <= -acceptableOutOfSync) {
            adjustTime += acceptableOutOfSync;
          } else {
            adjustTime = 0;
          }

          // This adjustment needs some hysteresis or else it makes continuous adjustments
          // as data ages between samples
          // If there's a previous adjustment time and it's within 2s of the newly computed
          // adjustment then keep the previous
          if(row.adjustTime && Math.abs(adjustTime-row.adjustTime)<2000) {
            adjustTime = row.adjustTime;
          }
        }

        row.adjustTime = adjustTime;

        // TODO something slick with this information
        if(row.adjustTime < 0) {
        // local clock is in the future
        //row.messageIt.innerHTML = "Consider moving your clock back ~" + Math.round(-row.adjustTime/1000.0) + "s";
        } else if(row.adjustTime > 0) {
        // local clock is in the past
        //row.messageIt.innerHTML = "Consider moving your clock forward ~" + Math.round(row.adjustTime/1000.0) + "s";
        } else {
        //row.messageIt.innerHTML = "";
        }
        // TODO Poor clock sync might also be expiring samples
        renderers[i].render(t1, t2, s1, s2);
      }
    }
  } 
    
  setTimeout(renderFunction, PLOT_INTERVAL);
};

function connect_btn(text, button) {
  document.getElementById("connectionStateText").innerHTML = text;
  document.getElementById("connectionStateAlert").setAttribute("class", "alert alert-"+button);
}

function startCam(id, containerId, url, opts) {
  var canvas = document.getElementById(id);
  if(canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#444';
    ctx.font = "30px Arial";

    // Setup the connection and start the player
    if(window.jsmpeg) {
      ctx.fillText('Loading...', canvas.width/2-30, canvas.height/3);
      var client = new io(url, opts);
      var player = new jsmpeg(client, {canvas:canvas});
      mpegClients.push(client);
    } else {
      document.getElementById(containerId).style.display='none';
    }
  }
}

// Initializes the connection to the OpenICE server system
window.onload = function(e) {
  // Cache selectors outside callback for performance. 
  // http://stackoverflow.com/questions/2907367/have-a-div-cling-to-top-of-screen-if-scrolled-down-past-it
  var $window = $(window),
  $stickyEl = $('#connectionStateAlert'),
  elTop = $stickyEl.offset().top;

  $window.scroll(function() {
    $stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);
  });
  setTimeout(function() {$stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);}, 100);

  // If running from the local filesystem then communicate with MD PnP lab server named 'arvi'
  // Otherwise communicate with whatever server is hosting this page
  var port = window.location.port;
  // Internet Explorer does not populate port for default port 80
  port = port == '' ? '' : (':'+port);
  // Pages served over https can only utilize wss protocol
  var wsProtocol = window.location.protocol == 'https:' ? 'wss://' : 'ws://';
  var wsHost = window.location.protocol == 'file:' ? 'dev.openice.info' : window.location.host;
  var baseURL = wsProtocol + wsHost;

  startCam('videoCanvas-evita', 'webcam-evita', baseURL+'/evita');
  startCam('videoCanvas-ivy', 'webcam-ivy', baseURL+'/ivy');
 
  openICE = new OpenICE(baseURL);

  openICE.maxSamples = 500;

  function onRemove(evt) {
    var row = evt.row;
    // If the row is decorated with flot data, delete it
    if(row.renderer) {
      var idx = renderers.indexOf(row.renderer);
      renderers.splice(idx,1);
      delete row.renderer;
    }
    // If the row is decorated with a plot DOM object, delete it

    if(row.waveDiv && row.waveDivAdds) {
      while(row.waveDivAdds.length > 0) {
        row.waveDiv.removeChild(row.waveDivAdds.shift());
      }
      delete row.waveDiv;
      delete row.waveDivAdds;
    }

    if(row.numericDiv && row.numericDivAdds) {
      while(row.numericDivAdds.length > 0) {
        row.numericDiv.removeChild(row.numericDivAdds.shift());
      }
      delete row.numericDiv;
      delete row.numericDivAdds;
    }
  };

  function onNumericSample(e) {
    var cssClass = e.row.keyValues.unique_device_identifier+"-"+e.row.keyValues.metric_id;
    cssClass = cssClass.replace(cssIllegal, "_");
    $('.'+cssClass).html(e.sample.data.value);
  }

  function onSampleArraySample(e) {
    var table = e.table;
    var row = e.row;
    var sample = e.sample;
    // Track the observed range of values for the row through all time
    if(sample.data.values) {
      for(var i = 0; i < sample.data.values.length; i++) {
        var value = sample.data.values[i];
        if(!row.maxValue || value > row.maxValue) {
          row.maxValue = value;
        }
        if(!row.minValue || value < row.minValue) {
          row.minValue = value;
        }
      }
    }

    // If plot wasn't previously initialized AND
    // we've seen a range of data greater than 0
    // This filters out unattached sensors for convenience
    if(!row.renderer && row.maxValue > row.minValue) {
      // Fixed DIV declared in the HTML (don't add it or remove it)
      row.waveDiv = document.getElementById("flotit-"+prefs.getFlotName(row.keyValues.metric_id)+"-wave");
      row.numericDiv = document.getElementById("flotit-"+prefs.getFlotName(row.keyValues.metric_id)+"-numeric");

      // Record all the elements we add for easy removal later
      row.waveDivAdds = [];
      row.numericDivAdds = [];

      row.waveLabelSpan = document.createElement("span");

      // Translate from 11073-10101 metric id to something more colloquial
      row.waveLabelSpan.innerHTML = prefs.getCommonName(row.keyValues.metric_id);
      row.waveLabelSpan.setAttribute("class", "waveLabelSpan");
      row.waveLabelSpan.style.color = prefs.getPlotColor(row.keyValues.metric_id);
      row.waveDiv.appendChild(row.waveLabelSpan);
      row.waveDivAdds.push(row.waveLabelSpan);

      row.wavePlotDivWrapper = document.createElement("div");
      row.wavePlotDivWrapper.setAttribute("class", "graphWrapper");
      row.wavePlotDiv = document.createElement("canvas");
      row.wavePlotDiv.setAttribute("id", row.rowId);
      row.wavePlotDiv.setAttribute("class", "graph");
      row.wavePlotDivWrapper.appendChild(row.wavePlotDiv);
      row.waveDiv.appendChild(row.wavePlotDivWrapper);
      row.waveDivAdds.push(row.wavePlotDivWrapper);

      row.numericDivAdds = [];

      var relatedNumerics = prefs.getRelatedNumeric(row.keyValues.metric_id);
      for(i = 0; i < relatedNumerics.length; i++) {
        var labelSpan = document.createElement("span");
        var valueSpan = document.createElement("span");

        labelSpan.setAttribute("class", "numericLabelSpan");

        labelSpan.style.color = prefs.getPlotColor(row.keyValues.metric_id);
        valueSpan.style.color = prefs.getPlotColor(row.keyValues.metric_id);

        labelSpan.innerHTML = relatedNumerics[i].name;

        var cssClass = row.keyValues.unique_device_identifier+"-"+relatedNumerics[i].code;
        cssClass = cssClass.replace(cssIllegal, '_');
        valueSpan.setAttribute("class", cssClass+" valueSpan");
        var fontHeight = 85 / relatedNumerics.length;
        valueSpan.style.fontSize = fontHeight+"px";

        row.numericDiv.appendChild(labelSpan);
        row.numericDivAdds.push(labelSpan);
        row.numericDiv.appendChild(valueSpan);
        row.numericDivAdds.push(valueSpan);
      }
      
      row.renderer = new Renderer(
        {canvas:row.wavePlotDiv, 
         'row':row,
          background: '#000000',
          range: prefs.getRange(row.keyValues.metric_id),
          color: prefs.getPlotColor(row.keyValues.metric_id),
          textColor: prefs.getPlotColor(row.keyValues.metric_id),
          borderWidth: 2,
          borderColor: prefs.getPlotColor(row.keyValues.metric_id),
          fillArea: prefs.getFillArea(row.keyValues.metric_id)});
      renderers.push(row.renderer);
    }
  };

  var medicalDeviceData = document.getElementById('medicalDeviceData');

  medicalDeviceData.onclick = function() {
    if(partitionBox.style.display=='none') {
      partitionBox.style.display='inline';
    } else {
      partitionBox.style.display='none';
    }
  };
  var partitionBox = document.getElementById('partitionBox');
  
  var sampleArrayTable = null;
  var numericTable = null;

  function changePartition(partition) {
    if(null != sampleArrayTable) {
      openICE.destroyTable(sampleArrayTable);
    }
    if(null != numericTable) {
      openICE.destroyTable(numericTable);
    }
    sampleArrayTable = openICE.createTable({domain: targetDomain, 'partition': partition, topic:'SampleArray'});
    numericTable = openICE.createTable({domain: targetDomain, 'partition': partition, topic:'Numeric'});
    sampleArrayTable.on('afterremove', onRemove);
    numericTable.on('sample', onNumericSample);
    sampleArrayTable.on('sample', onSampleArraySample);
  }
  PartitionBox(openICE, partitionBox, targetDomain, changePartition, "MRN=55555");
  openICE.on('open', function(e) {
    connect_btn("Connected", "success");
    $("#connectionStateAlert").fadeOut(1500);
  });

  openICE.on('close', function(e) {
    connect_btn("Connecting...", "danger");
    $("#connectionStateAlert").fadeIn(1);
  });

  openICE.on('error', function(e) {
    connect_btn("Connecting...", "danger");
    $("#connectionStateAlert").fadeIn(1);
  });

  setTimeout(renderFunction, PLOT_INTERVAL);
}

