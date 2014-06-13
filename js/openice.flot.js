var openICE;
var demopreferences;

/** maximum age for data stored for plotting (in milliseconds) */
var maxFlotAge = 15000;

// We primarily use domain 15 for physiological data in the lab
var targetDomain = 15;


/** called periodically to update plot information */
var flotIt = function() {
	// fixed starting time 
	var startOfFlotIt = Date.now();

	// TODO it would be bad if user's browser were badly out of clock sync wrt to server

	// The domain of the plot begins 12 seconds ago
	var d = startOfFlotIt - 12000;

	// The domain of the plot ends 2 seconds ago 
	var d2 = startOfFlotIt - 2000;

	// Check that the openICE object has been initialized (and its tables property)
	if(openICE && openICE.tables) {
		// Iterate over each table
		Object.keys(openICE.tables).forEach(function (tableKey) { 
			var table = openICE.tables[tableKey];
			// Iterate over each row
			Object.keys(table.rows).forEach(function(rowKey) {
				var row = table.rows[rowKey];
				
				// Ensure that the row exists and has been decorated with plotting information
				if(row && row.rowId && row.flotData && row.flotPlot) {
					// Reset the range to the global data min/max
					row.flotPlot.getAxes().yaxis.options.min = row.minValue;
					row.flotPlot.getAxes().yaxis.options.max = row.maxValue;
					// Reset the domain to the recent time interval
					row.flotPlot.getAxes().xaxis.options.min = d;
					row.flotPlot.getAxes().xaxis.options.max = d2;
					// Reset the data .. is this necessary?
					row.flotPlot.setData(row.flotData);
					// Redraws the plot decorations, etc.
					row.flotPlot.setupGrid();
					// Draw the actual data!
					row.flotPlot.draw();
			    }
		    });
		    // iteration code
		});
		// console.log("Took " + (Date.now()-startOfFlotIt) + "ms to flot");
	}
}

// Initializes the connection to the OpenICE server system
window.onload = function(e) {
	// If running from the local filesystem then communicate with MD PnP lab server named 'arvi'
	// Otherwise communicate with whatever server is hosting this page
	var port = window.location.port;
	// Internet Explorer does not populate port for default port 80
	port = port == '' ? '' : (':'+port);
	var url = 'ws://' + (window.location.protocol == 'file:' ? 'arvi.mgh.harvard.edu' : (window.location.hostname+port)) + '/DDS';

    openICE = new OpenICE(url);
    
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
			document.getElementById("flotit").removeChild(row.outerDiv);
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
				

				outerDiv.appendChild(labelit);
				outerDiv.appendChild(flotDiv);
				outerDiv.setAttribute("class", "outerDiv col-md-6 col-xs-12");
				
				flotDiv.setAttribute("id", row.rowId);
				flotDiv.setAttribute("class", "graph col-xs-12");
				document.getElementById("flotit").appendChild(outerDiv);
				row.flotDiv = flotDiv;
				row.outerDiv = outerDiv;
				row.labelit = labelit;

				labelit.setAttribute("class", "labelit")

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
							aboveData: true,
							color: "#FFFFFF",
							backgroundColor: "#000000"
						},
						xaxis: { show: true,
							mode: "time",
							font: { color: "#FFF" },
							timezone: "browser"
						},
						yaxis: { show: true, font: { color: "#FFF" }}
					});

		    }

		    // For every new data sample add it to the data series to be plotted
		    if(row.flotData && sample.data && sample.data.values && sample.data.millisecondsPerSample) {
				row.millisecondsPerSample = sample.data.millisecondsPerSample;
				for(var i = 0; i < sample.data.values.length; i++) {
					var value = sample.data.values[i];
					row.flotData[0].push([sample.sourceTimestamp-sample.data.millisecondsPerSample*(sample.data.values.length-i), value]);
				}
				var maxAge = Date.now() - maxFlotAge;

				while(row.flotData[0].length>0&&row.flotData[0][0][0]<maxAge) {
					row.flotData[0].shift();
				}
			}
		}
	};

	openICE.onopen = function(openICE) {
		document.getElementById("connectionStateText").innerHTML = "Connected";
		document.getElementById("connectionStateLightning").style.display = 'inline';
		document.getElementById("connectionStateRemove").style.display = 'none';
		document.getElementById("connectionStateButton").setAttribute("class", "btn btn-success");
		// This example utilizes SampleArray (Waveform) data
		this.createTable({domain: targetDomain, partition: [], topic:'SampleArray'});
	};

	openICE.onclose = function(openICE) {
		document.getElementById("connectionStateText").innerHTML = "Disconnected";
		document.getElementById("connectionStateLightning").style.display = 'none';
		document.getElementById("connectionStateRemove").style.display = 'inline';
		document.getElementById("connectionStateButton").setAttribute("class", "btn btn-danger");
	};

	openICE.onerror = function(openICE) {
		document.getElementById("connectionStateText").innerHTML = "Connection Error";
		document.getElementById("connectionStateLightning").style.display = 'none';
		document.getElementById("connectionStateRemove").style.display = 'none';
		document.getElementById("connectionStateButton").setAttribute("class", "btn btn-warning");
	};

	document.getElementById("connectionStateButton").onclick = function(e) {
		if(openICE.connection.readyState==WebSocket.OPEN) {
			openICE.close();
		} else if(openICE.connection.readyState==WebSocket.CLOSED) {
			openICE.open();
		}
	};

	// Initiate the connection to the OpenICE server
	openICE.open();

	// Plot five times per second
	setInterval(flotIt, 200);
}

window.onbeforeunload = function(e) {
	// Try to shut down the connection before the page unloads
	openICE.close();
}
