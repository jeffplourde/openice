var openICE;
var demopreferences;

// in milliseconds
var maxFlotAge = 15000;

function metricValue(rows, metric_id) {
	var result = "";
	
	for(var i = 0; i < rows.length; i++) {
		if(rows[i].keyValues) {
			if(rows[i].keyValues.metric_id == metric_id) {

				if(rows[i].samples.length > 0) {
					result += " " + rows[i].samples[rows[i].samples.length-1].data.value;
				}
			}
		} else {
			console.log("No keyValues " + rows[i]);
		}
		
	}
	return result;
}

// called periodically to update plot information
var flotIt = function() {
	// var startOfFlotIt = Date.now();

	// TODO it would be bad if user's browser were badly out of clock sync wrt to server
	var d = Date.now();
	var d2 = Date.now();
	// The domain of the plot begins 12 seconds ago
	d -= 12000;
	// The domain of the plot ends 2 seconds ago 
	d2 -= 2000;
	
	if(openICE && openICE.tables) {
	
		Object.keys(openICE.tables).forEach(function (tableKey) { 
			var table = openICE.tables[tableKey];
			Object.keys(table.rows).forEach(function(rowKey) {
				var row = table.rows[rowKey];
				var plotColor = getPlotColor(row.keyValues.metric_id);
				
				if(row.rowId && row.flotData) {
					$.plot('#'+row.rowId, [row.flotData], options = {
						series: {
							lines: { show: true },
							points: { show: false },
							color: plotColor,
						},
						grid: {
							show: false,
							aboveData: true,
							color: "#FFFFFF",
							backgroundColor: "#000000"
						},
						xaxis: { show: false,
							mode: "time",
							min: d,
							max: d2,
							font: { color: "#FFF" }
						},
						yaxis: { show: false, font: { color: "#FFF" },
						min: row.minValue,
						max: row.maxValue }
					});
			    }
		    });
		    // iteration code
		});
		// console.log("Took " + (Date.now()-startOfFlotIt) + "ms to flot");
	}
	setTimeout(flotIt, 250);
}


if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

window.onload = function(e) {
	// If running from the local filesystem then communicate with MD PnP lab server named 'arvi'
	var url = 'ws://' + (window.location.protocol == 'file:' ? 'arvi.mgh.harvard.edu' : window.location.hostname) + '/DDS';
    openICE = new OpenICE(url);
    
	openICE.onafterremove = function(openICE, table, row) {
		if(row.flotData) {
			delete row.flotData;
		}
		if(row.flotDiv) {
			delete row.flotDiv;
		}
		
		if(row.outerDiv) {
			document.getElementById("flotit").removeChild(row.outerDiv);
			delete row.outerDiv;
		}
	};
	
	openICE.onsample = function(openICE, table, row, sample) {
		if(table.topic.endsWith('SampleArray')) {

			// Track the observed range of values for the row through all time
			for(var i = 0; i < sample.data.values.length; i++) {
				var value = sample.data.values[i];
				if(!row.maxValue || value > row.maxValue) {
					row.maxValue = value;
				}
				if(!row.minValue || value < row.minValue) {
					row.minValue = value;
				}
			}

			// These are SampleArray data
			if(!row.flotData && row.maxValue > row.minValue) {				
				row.flotData = [];

				var flotDiv = document.createElement("div");
				var outerDiv = document.createElement("div");
				var labelit = document.createElement("h5");
				

				outerDiv.appendChild(labelit);
				outerDiv.appendChild(flotDiv);
				outerDiv.setAttribute("class", "outerDiv col-md-6 col-xs-12");
				
				flotDiv.setAttribute("id", row.rowId);
				flotDiv.setAttribute("class", "graph col-xs-10");
				document.getElementById("flotit").appendChild(outerDiv);
				row.flotDiv = flotDiv;
				row.outerDiv = outerDiv;

				labelit.setAttribute("class", "labelit")
				labelit.setAttribute("id", sample.data.metric_id);
				labelit.innerText = getCommonName(sample.data.metric_id);
		    }
		    if(row.flotData) {
				row.millisecondsPerSample = sample.data.millisecondsPerSample;
				for(var i = 0; i < sample.data.values.length; i++) {
					var value = sample.data.values[i];
					row.flotData.push([sample.sourceTimestamp-sample.data.millisecondsPerSample*(sample.data.values.length-i), value]);
				}
				var maxAge = Date.now() - maxFlotAge;

				while(row.flotData.length>0&&row.flotData[0][0]<maxAge) {
					row.flotData.shift();
				}
			}
		}
	};
	openICE.open();
	setTimeout(function() { 
		var targetDomain = 15;
		openICE.createTable({domain: targetDomain, partition: [], topic:'SampleArray'});
		openICE.createTable({domain: targetDomain, partition: [], topic:'ice::SampleArray'});
	}, 500);
	setTimeout(flotIt, 750);
}

window.onbeforeunload = function(e) {
	openICE.close();
}
