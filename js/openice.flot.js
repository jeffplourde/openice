var openICE;
var demopreferences;


// fastest is usually 2ms... so for a 12 second window that's 12000/2
// Maximum number of samples to maintain in the flot data array for a particular 'row'
var maxFlotSamples = 8000;

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
	// TODO it would be bad if user's browser were badly out of clock sync wrt to server
	var d = new Date();
	var d2 = new Date();
	// The domain of the plot begins 12 seconds ago
	d.setSeconds(d.getSeconds() - 12);
	// The domain of the plot ends 2 seconds ago 
	d2.setSeconds(d2.getSeconds() - 2);
	
	if(openICE && openICE.tables) {
	
		Object.keys(openICE.tables).forEach(function (tableKey) { 
			var table = openICE.tables[tableKey];
			Object.keys(table.rows).forEach(function(rowKey) {
				var row = table.rows[rowKey];
				var plotColor = getPlotColor(row.keyValues.metric_id);
	
				if(row.deviceIdentity && row.deviceIdentity != null && !row.iconImg.src) {
					if(row.deviceIdentity.samples) {
						if(row.deviceIdentity.samples.length>0) {
							row.iconImg.src = "data:image/png;base64," + row.deviceIdentity.samples[row.deviceIdentity.samples.length-1].data.icon.raster;
						} else {
							
						}
					} else {
						
					}
				} else {
	//				console.log("row.deviceIdentity="+row.deviceIdentity);
	//				console.log("row.iconImg="+row.iconImg);
	//				console.log("row.deviceIdentity.samples="+row.deviceIdentity.samples);
				}
				
				if(row.relatedNumerics && row.bigNumber) {
					if(row.keyValues.metric_id == 'MDC_PULS_OXIM_PLETH') {
						row.bigNumber.innerHTML = "SpO\u2082" + metricValue(row.relatedNumerics, 'MDC_PULS_OXIM_SAT_O2') + "%<br/>";
						row.bigNumber.innerHTML += "PR " + metricValue(row.relatedNumerics, 'MDC_PULS_OXIM_PULS_RATE') + "bpm";
					} else if(row.keyValues.metric_id == 'MDC_CAPNOGRAPH') {
						row.bigNumber.innerHTML = "etCO\u2082" + metricValue(row.relatedNumerics, 'MDC_AWAY_CO2_EXP') + "<br/>";
						row.bigNumber.innerHTML += "RR " + metricValue(row.relatedNumerics, 'MDC_RESP_RATE') + "bpm";
					} else if(row.keyValues.metric_id == 'MDC_ECG_AMPL_ST_I') {
						row.bigNumber.innerHTML = "HR " + metricValue(row.relatedNumerics, 'MDC_ECG_CARD_BEAT_RATE') + "bpm";
					} else if(row.keyValues.metric_id == 'MDC_ECG_AMPL_ST_II') {
						row.bigNumber.innerHTML = "HR " + metricValue(row.relatedNumerics, 'MDC_ECG_CARD_BEAT_RATE') + "bpm";
					} else if(row.keyValues.metric_id == 'MDC_ECG_AMPL_ST_III') {
						row.bigNumber.innerHTML = "HR " + metricValue(row.relatedNumerics, 'MDC_ECG_CARD_BEAT_RATE') + "bpm";
					}
				}
				
				if(row.rowId && row.flotData) {
					$.plot('#'+row.rowId, [row.flotData], options = {
						series: {
							lines: { show: true },
							points: { show: false },
							color: plotColor,
						},
						grid: {
							show: true,
							aboveData: true,
							color: "#FFFFFF",
							backgroundColor: "#000000"
						},
						xaxis: { show: true,
							mode: "time",
							min: (d).getTime(),
							max: (d2).getTime(),
							font: { color: "#FFF" }
						},
						yaxis: { show: true, font: { color: "#FFF" } }
					});
			    }
				if(row.bigNumber) {
					// draw the appropriate numbers up in there
					
				}
		    });
		    // iteration code
		});
	}
	setTimeout(flotIt, 250);
}
setTimeout(flotIt, 250);

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

window.onload = function(e) {
	
//	openICE = new OpenICE('ws://'+window.location.hostname+':4848/DDS');
    openICE = new OpenICE('ws://'+'arvi.mgh.harvard.edu'+':4848/DDS');
    
	openICE.onschema = function(openICE, table) {
		//console.log("I see schema " +JSON.stringify(table.schema));
	};
	openICE.onafteradd = function(openICE, table, row) {

	//	console.log("I see a new row " + row);
	};
	openICE.onafterremove = function(openICE, table, row) {
		if(row.flotData) {
			delete row.flotData;
		}
		if(row.flotDiv) {
			delete row.flotDiv;
		}
		if(row.bigNumber) {
			delete row.bigNumber;
		}
		
		if(row.outerDiv) {
			document.getElementById("flotit").removeChild(row.outerDiv);
			delete row.outerDiv;
		}

	//	console.log("I see a deleted row " + row);
	};
	
	openICE.onafteradd = function(openICE, table, row) {
		if(table.topic.endsWith('Numeric')) {
			// For convenience link the new Numeric row to samplearrays from the same device
			var sampleArrayTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'SampleArray'});
			if(null == sampleArrayTable) {
				sampleArrayTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'ice::SampleArray'});
			}
			if(null != sampleArrayTable) {
				var sampleArrayRows = sampleArrayTable.getRows({unique_device_identifier:row.keyValues.unique_device_identifier});
				for(var i = 0; i < sampleArrayRows.length; i++) {
					if(!sampleArrayRows[i].relatedNumerics) {
						sampleArrayRows[i].relatedNumerics = [];
					}
					if(sampleArrayRows[i].relatedNumerics.indexOf(row)<0) {
//						console.log("Pushed a numeric related to samplearray "+row);
						sampleArrayRows[i].relatedNumerics.push(row);
					}
				}
			}
		} else if(table.topic.endsWith('DeviceIdentity')) {
//			console.log("Added row to DeviceIdentity there are now " + Object.keys(table.rows).length + " rows added udi="+row.keyValues.unique_device_identifier);
			
			
			// For convenience link the new DeviceIdentity to SampleArrays from the same device
			var sampleArrayTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'SampleArray'});
			if(null == sampleArrayTable) {
				sampleArrayTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'ice::SampleArray'});
			}
			if(null != sampleArrayTable) {
				var sampleArrayRows = sampleArrayTable.getRows({unique_device_identifier:row.keyValues.unique_device_identifier});
				for(var i = 0; i < sampleArrayRows.length; i++) {
//					console.log("Bound a deviceIdentity from DeviceIdentity sample update "+row);
					sampleArrayRows[i].deviceIdentity = row;
				}
			}
		} else if(table.topic.endsWith('SampleArray')) {
//			console.log("I SEE SAMPLE ARRAY");
			
			// Grabs the Numeric table from the same domain and partition as this sample array
			var numericTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'Numeric'});
			if(null == numericTable) {
				numericTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'ice::Numeric'});
			}
			if(null != numericTable) {
			
				row.relatedNumerics = [];
				
				// Create an association to all the numerics from the same device
				var numericRows = numericTable.getRows({unique_device_identifier:row.keyValues.unique_device_identifier});
				for(var i = 0; i  < numericRows.length; i++) {
//					console.log("Pushing on the row " + numericRows[i]);
					row.relatedNumerics.push(numericRows[i]);
				}
				
				
				for(var i = 0; i < numericRows.length; i++) {
//					console.log("Numeric Rows " + (i+1));
					if(!numericRows[i].relatedSampleArrays) {
						numericRows[i].relatedSampleArrays = [];
					}
//					console.log("mid iteration");
					if(numericRows[i].relatedSampleArrays.indexOf(row)<0) {
						numericRows[i].relatedSampleArrays.push(row);
//						console.log("push");
					}
//					console.log("end iteration");
				}
//				console.log("done for");
			}
//			console.log("I made it this far");
			// Look for extant device identity data
			var deviceIdentityTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'DeviceIdentity'});
			if(null == deviceIdentityTable) {
				deviceIdentityTable = openICE.getTable({domain:table.domain, partition:table.partition, topic:'ice::DeviceIdentity'});
			}
			if(null != deviceIdentityTable) {
				var deviceIdentityRows = deviceIdentityTable.getRows({unique_device_identifier:row.keyValues.unique_device_identifier});
				for(var i = 0; i < deviceIdentityRows.length; i++) {
//					console.log("Bound an existing DeviceIdentity from SampleArray sample update"); //  "+deviceIdentityRows[i]);
					row.deviceIdentity = deviceIdentityRows[i];
				}
//				console.log("There were " + deviceIdentityRows.length + " rows searched in the DeviceIdentity table for udi="+row.keyValues.unique_device_identifier);
			} else {
//				console.log("There is no DeviceIdentity table to search");
			}
		}
	}
	
	openICE.onsample = function(openICE, table, row, sample) {

		
		if(table.topic.endsWith('Numeric')) {

		} else if(table.topic.endsWith('SampleArray')) {
			
			// These are SampleArray data
			if(!row.flotData) {				
				row.flotData = [];

				var flotDiv = document.createElement("div");
				var outerDiv = document.createElement("div");
				var labelit = document.createElement("h5");
				var bigNumber = document.createElement("div");
				var iconImg = document.createElement("img");
				
				iconImg.setAttribute("class", "iconImg");

				outerDiv.appendChild(labelit);
				outerDiv.appendChild(iconImg);
				outerDiv.appendChild(flotDiv);
				outerDiv.appendChild(bigNumber);
				outerDiv.setAttribute("class", "outerDiv col-md-6 col-xs-12");
				
				flotDiv.setAttribute("id", row.rowId);
				flotDiv.setAttribute("class", "graph col-xs-10");
				document.getElementById("flotit").appendChild(outerDiv);
				row.flotDiv = flotDiv;
				row.outerDiv = outerDiv;
				row.iconImg = iconImg;

				labelit.setAttribute("class", "labelit")
				labelit.setAttribute("id", sample.data.metric_id);
				labelit.innerText = getCommonName(sample.data.metric_id);

				bigNumber.setAttribute("class", "bigNumber col-xs-2");
				bigNumber.innerText = "";
				row.bigNumber = bigNumber;
		    }
			row.millisecondsPerSample = sample.data.millisecondsPerSample;
			for(var i = 0; i < sample.data.values.length; i++) {
				row.flotData.push([sample.sourceTimestamp-sample.data.millisecondsPerSample*(sample.data.values.length-i), sample.data.values[i]]);
			}
			
			while(row.flotData.length>maxFlotSamples) {
				row.flotData.shift();
			}

		} else if(table.topic.endsWith('DeviceIdentity')) {
			//var bytes = $.base64.decode( sample.data.icon.raster );
//			var img = document.createElement("img");
//			img.src = "data:image/png;base64," + sample.data.icon.raster;
//			var x = document.getElementById("devicename");
//			x.appendChild(img);
		}
	//	if(sample.source_timestamp && sample.data && sample.data.values) {
	//		row.flotData.push([sample.source_timestamp])
	//	}
	};
	openICE.open();
	setTimeout(function() { 
		var targetDomain = 15;
		openICE.createTable({domain: targetDomain, partition: [], topic:'DeviceIdentity'});
		openICE.createTable({domain: targetDomain, partition: [], topic:'ice::DeviceIdentity'});
		openICE.createTable({domain: targetDomain, partition: [], topic:'SampleArray'});
		openICE.createTable({domain: targetDomain, partition: [], topic:'ice::SampleArray'});
		openICE.createTable({domain: targetDomain, partition: [], topic:'Numeric'});
		openICE.createTable({domain: targetDomain, partition: [], topic:'ice::Numeric'});
	}, 500);
	setTimeout(flotIt, 750);
}

window.onbeforeunload = function(e) {
	openICE.close();

}

