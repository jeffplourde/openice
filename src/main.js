var OpenICE = require('./openice.js');
var VitalSigns = require('./vitals.js');
var VitalMonitor = require('./vital-monitor.js');
var PartitionBox = require('./partition-box.js');

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

	PartitionBox(openICE, document.getElementById('partition'), DOMAINID);

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
