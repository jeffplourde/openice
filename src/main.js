var OpenICE = require('./openice.js');
var VitalSigns = require('./vitals.js');
var VitalMonitor = require('./vital-monitor.js');

var DOMAINID = 15;

window.onload = function(e) {
  	var port = window.location.port;
  	// Internet Explorer does not populate port for default port 80
  	port = port == '' ? '' : (':'+port);
  	// Pages served over https can only utilize wss protocol
  	var wsProtocol = window.location.protocol == 'https:' ? 'wss://' : 'ws://';
  	var wsHost = window.location.protocol == 'file:' ? 'openice.info' : window.location.host;
  	var baseURL = wsProtocol + wsHost;
	var openICE = new OpenICE(baseURL);
	var rebuildSelect = function(e) {
		var table = e.table, row = e.row;
		var names = {};
		var select = document.getElementById('partition');
		while(select.options.length>0) {
			select.remove(0);
		}
		var rowKeys = Object.keys(table.rows);
		for(var i = 0; i < rowKeys.length; i++) {
			var row = table.rows[rowKeys[i]];
			var name = row.samples[row.samples.length-1].data.partition.name;
			if(typeof name === 'undefined' || null == name || name.length==0) {
				names["<default>"] = "";
			} else {
				for(var j = 0; j < name.length; j++) {
					if(name[j]=="") {
						names["<default>"] = "";
					} else {
						names[name[j]] = name[j];
					}
				}
			}
		}
		delete names["<default>"];
		var partKeys = Object.keys(names);
		var opt = document.createElement("option");
		opt.text = "<default>";
		opt.value = "";
		select.add(opt);
		

		for(var i = 0; i < partKeys.length; i++) {
			var opt = document.createElement("option");
			opt.text = partKeys[i];
			opt.value = names[partKeys[i]];
			select.add(opt);
		}		
	};

	var publicationsTable = openICE.createTable({domain:DOMAINID, partition:[], topic:'DCPSPublication'});
	publicationsTable.on('sample', function(e) {
		rebuildSelect(e);
	});
	publicationsTable.on('afterremove', function(e) {
		rebuildSelect(e);
	});

	vitalSigns = new VitalSigns(openICE, DOMAINID, [], 'Numeric');
	vitalSigns.addVital({label:'Heart Rate', units:'bpm', metricIds:['MDC_PULS_OXIM_PULS_RATE','MDC_ECG_HEART_RATE'],
	                     warningLow: 40, warningHigh: 140, criticalLow: 20, criticalHigh: 160, minimum: 0, maximum: 250,
	                     valueMsWarningLow: 5000, valueMsWarningHigh: 5000});
	vitalSigns.addVital({label:'SpO\u2082', units:'%', metricIds:['MDC_PULS_OXIM_SAT_O2'],
	                     warningLow: 95, warningHigh: null, criticalLow: 85, criticalHigh: null, minimum: 50, maximum: 100,
	                     valueMsWarningLow: 5000, valueMsWarningHigh: 5000});
	vitalSigns.addVital({label:'Resp Rate', units:'bpm', metricIds:['MDC_RESP_RATE','MDC_CO2_RESP_RATE','MDC_TTHOR_RESP_RATE'],
	                     warningLow: 10, warningHigh: 18, criticalLow: 4, criticalHigh: 35, minimum: 0, maximum: 40,
	                     valueMsWarningLow: 5000, valueMsWarningHigh: 5000});

	function bound() {
		VitalMonitor.renderVitalStatus(vitalSigns, document.getElementById("mycanvas"));
		document.getElementById("mytext").innerHTML = vitalSigns.warningText;
	}

	setInterval(bound, 500);

	var previousTable = null;

	var vitalSignsSetup = function(partition) {
		if(null != previousTable) {
			openICE.destroyTable(previousTable, true);
		}
		previousTable = openICE.createTable({domain:DOMAINID,partition:partition,topic:'Numeric'});
		vitalSigns.setTable(previousTable);
	};

	document.getElementById('partition').onchange = function(e) {
		var select = document.getElementById('partition');
		vitalSignsSetup([select.options[select.selectedIndex].value]);
	};
	vitalSignsSetup([]);
};
