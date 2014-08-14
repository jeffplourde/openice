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

/** maximum age for data stored for plotting (in milliseconds) */
var maxFlotAge = 15000;

// We primarily use domain 15 for physiological data in the lab
var targetDomain = 15;

var expectedDelay = 1000;
var timeDomain = 10000;
var acceptableOutOfSync = 2000;
var FLOT_INTERVAL = 200;

var flotDraw = function() {
	if(openICE && openICE.tables) {
		iterate(openICE.tables, function (tableKey, tableValue) {
			var table = openICE.tables[tableKey];
			iterate(table.rows, function(rowKey, rowValue) {
				var row = table.rows[rowKey];
				if(row.flotData && row.flotPlot) {
					row.flotPlot.draw();
				}
			});
		});
	}
}

function iterate(obj, cb) {
	var keys = Object.keys(obj);
	for(var i = 0; i < keys.length; i++) {
		cb(keys[i], obj[keys[i]]);
	}
};

var flotSetupGrid = function() { 
	if(openICE && openICE.tables) {
		iterate(openICE.tables, function (tableKey, tableValue) {
			var table = openICE.tables[tableKey];
			iterate(table.rows, function(rowKey, rowValue) {
				var row = table.rows[rowKey];
				if(row.flotData && row.flotPlot) {
					row.flotPlot.setupGrid();
				}
			});
		});
	}
	setTimeout(flotDraw, 0);
}

var flotSetData = function() {
	if(openICE && openICE.tables) {
		iterate(openICE.tables, function (tableKey, tableValue) {
			var table = openICE.tables[tableKey];
			iterate(table.rows, function(rowKey, rowValue) {
				var row = table.rows[rowKey];
				if(row.flotData && row.flotPlot) {
					row.flotPlot.setData(row.flotData);
				}
			});
		});
	}
	setTimeout(flotSetupGrid, 0);
}

/** called periodically to update plot information */
var flotIt = function() {
	// fixed starting time 
	var startOfFlotIt = Date.now();

	// TODO it would be bad if user's browser were badly out of clock sync wrt to server


	// The domain of the plot begins 12 seconds ago
	var d = startOfFlotIt - timeDomain - expectedDelay;

	// The domain of the plot ends 2 seconds ago 
	var d2 = startOfFlotIt - expectedDelay;

	var midd = d+timeDomain/2;

	// Check that the openICE object has been initialized (and its tables property)
	if(openICE && openICE.tables) {
		// Iterate over each table
		iterate(openICE.tables, function (tableKey, tableValue) {
		// Object.keys(openICE.tables).forEach(function (tableKey) { 
			var table = openICE.tables[tableKey];
			var count = 0;

			// Iterate over each row
			iterate(table.rows, function(rowKey, rowValue) {
				count++;
			// Object.keys(table.rows).forEach(function(rowKey) {
				var row = table.rows[rowKey];
				
				// Ensure that the row exists and has been decorated with plotting information
				if(row && row.rowId && row.flotData && row.flotPlot) {
					// Adjustment factor in the case where data time is wildly out of sync with
					// the local clock
					var adjustTime = 0;
					// Are there available data samples
					if(row.flotData[0].length > 0) {
						// Timestamp of the most recent data
						var mostRecentData = row.flotData[0][row.flotData[0].length-1][0];
						adjustTime = mostRecentData - startOfFlotIt;

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

					if(row.messageIt) {
						if(row.adjustTime < 0) {
							// local clock is in the future
							row.messageIt.innerHTML = "Consider moving your clock back ~" + Math.round(-row.adjustTime/1000.0) + "s";
						} else if(row.adjustTime > 0) {
							// local clock is in the past
							row.messageIt.innerHTML = "Consider moving your clock forward ~" + Math.round(row.adjustTime/1000.0) + "s";
						} else {
							row.messageIt.innerHTML = "";
						}
					}


					// Expire samples based upon an adjusted clock
					var maxAge = startOfFlotIt + row.adjustTime - maxFlotAge;

					while(row.flotData[0].length>0&&row.flotData[0][0][0]<maxAge) {
						row.flotData[0].shift();
					}

					row.flotPlot.getAxes().xaxis.options.min = d + row.adjustTime;
					row.flotPlot.getAxes().xaxis.options.max = d2 + row.adjustTime;

					row.flotPlot.getAxes().xaxis.options.ticks = 
						[[d+row.adjustTime, moment(d+row.adjustTime).format('HH:mm:ss')],
						[midd+row.adjustTime, moment(midd+row.adjustTime).format('HH:mm:ss')],
						[d2+row.adjustTime, moment(d2+row.adjustTime).format('HH:mm:ss')]];
			    }
		    });
		});
	}
	setTimeout(flotSetData, 0);
	setTimeout(flotIt, FLOT_INTERVAL);
}

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
	// If running from the local filesystem then communicate with MD PnP lab server named 'arvi'
	// Otherwise communicate with whatever server is hosting this page
	var port = window.location.port;
	// Internet Explorer does not populate port for default port 80
	port = port == '' ? '' : (':'+port);
	// Pages served over https can only utilize wss protocol
	var wsProtocol = window.location.protocol == 'https:' ? 'wss://' : 'ws://';
	var wsHost = window.location.protocol == 'file:' ? 'www.openice.info' : window.location.host;
	var baseURL = wsProtocol + wsHost;

	startCam('videoCanvas-evita', 'webcam-evita', baseURL+'/evita');
	startCam('videoCanvas-ivy', 'webcam-ivy', baseURL+'/ivy');

    openICE = new OpenICE(baseURL);
    
	openICE.onafterremove = function(openICE, table, row) {
		// If the row is decorated with flot data, delete it
		if(row.flotData) {
			delete row.flotData;
		}
		// If the row is decorated with a flot DOM object, delete it
		if(row.flotDiv) {
			delete row.flotDiv;
		}
		
		// If the containing div element exists, remove it from the DOM and delete it 
		if(row.outerDiv) {
			document.getElementById("flotit-"+getFlotName(row.keyValues.metric_id)).removeChild(row.outerDiv);
			delete row.outerDiv;
		}
	};
	
	openICE.onsample = function(openICE, table, row, sample) {

		if(table.topic=='SampleArray') {
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

			// If flotData wasn't previously initialized AND
			// we've seen a range of data greater than 0
			// This filters out unattached sensors for convenience
			if(!row.flotData && row.maxValue > row.minValue) {	
				// The set of data series we will plot			
				row.flotData = [[]];

				// div onto which data will be plotted
				var flotDiv = document.createElement("div");

				// container div for plot information and labelling
				var outerDiv = document.createElement("div");

				// label element for this waveform
				var labelit = document.createElement("span");

				// message element for this waveform
				var messageIt = document.createElement("span");
				

				outerDiv.appendChild(labelit);
				outerDiv.appendChild(flotDiv);
				outerDiv.appendChild(messageIt);
				outerDiv.setAttribute("class", "outerDiv");
				
				flotDiv.setAttribute("id", row.rowId);
				flotDiv.setAttribute("class", "graph");
				document.getElementById("flotit-"+getFlotName(row.keyValues.metric_id)).appendChild(outerDiv);
				row.flotDiv = flotDiv;
				row.outerDiv = outerDiv;
				row.labelit = labelit;
				row.messageIt = messageIt;

				labelit.setAttribute("class", "labelit");
				messageIt.setAttribute("class", "messageIt");

				// Translate from 11073-10101 metric id to something more colloquial
				labelit.innerHTML = getCommonName(row.keyValues.metric_id);

				// Set up the actual plot
				row.flotPlot = $.plot('#'+row.rowId, row.flotData, options = {
						series: {
							lines: { show: true },
							shadowSize: 0,
							points: { show: false },
							color: getPlotColor(row.keyValues.metric_id),
						},
						grid: {
							show: true,
							aboveData: false,
							color: "#FFFFFF",
							backgroundColor: "#000000"
						},
						xaxis: { show: true,
							mode: "time",
							font: { color: "#FFF" },
							timezone: "browser"
						},
						yaxis: { show: false, font: { color: "#FFF" }}
					});
				row.reflot = function() {
					this.flotPlot.setData(this.flotData);
					// Redraws the plot decorations, etc.
					 this.flotPlot.setupGrid();
					// Draw the actual data!
					this.flotPlot.draw();
				};
		    }

		    // For every new data sample add it to the data series to be plotted
		    if(row.flotData && sample.data && sample.data.values && sample.data.millisecondsPerSample) {
				row.millisecondsPerSample = sample.data.millisecondsPerSample;
				for(var i = 0; i < sample.data.values.length; i++) {
					var value = sample.data.values[i];
					// This could be some downsampling if it becomes necessary
					// if(0==(i%1)) {
						row.flotData[0].push([moment(sample.sourceTimestamp).valueOf()-sample.data.millisecondsPerSample*(sample.data.values.length-i), value]);
					// }
				}
			}
		}
	};
	$("#connectionStateAlert").fadeIn(1200);
	openICE.onopen = function(openICE) {
		connect_btn("Connected", "success");
		$("#connectionStateAlert").fadeOut(1200);
		this.createTable({domain: targetDomain, partition: [], topic:'SampleArray'});
	};

	openICE.onclose = function(openICE) {

		connect_btn("Connecting...", "danger");
		$("#connectionStateAlert").fadeIn(1200);
	};

	openICE.onerror = function(openICE) {
		connect_btn("Connecting...", "danger");
		$("#connectionStateAlert").fadeIn(1200);
	};

	// Plot five times per second
	setTimeout(flotIt, FLOT_INTERVAL);
}

window.onbeforeunload = function(e) {
	// Try to shut down the connection before the page unloads
	if(openICE) {
		openICE.close();
	}
	for(var i = 0; i < mpegClients.length; i++) {
		if(mpegClients[i]) {
			mpegClients[i].disconnect();
		}
	}
}
