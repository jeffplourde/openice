var OpenICE = require('./openice.js');
var VitalSigns = require('./vitals.js');
var VitalMonitor = require('./vital-monitor.js');


window.onload = function(e) {
	var openICE = new OpenICE('http://localhost:3000');
	var vitalSigns = new VitalSigns(openICE, 15, [], 'Numeric');
	vitalSigns.addVital({label:'Heart Rate', units:'bpm', metricIds:['MDC_PULS_OXIM_PULS_RATE','MDC_ECG_HEART_RATE'],
	                     warningLow: 40, warningHigh: 140, criticalLow: 20, criticalHigh: 160, minimum: 0, maximum: 250,
	                     valueMsWarningLow: 5000, valueMsWarningHigh: 5000});
	vitalSigns.addVital({label:'SpO\u2082', units:'%', metricIds:['MDC_PULS_OXIM_SAT_O2'],
	                     warningLow: 95, warningHigh: null, criticalLow: 85, criticalHigh: null, minimum: 50, maximum: 100,
	                     valueMsWarningLow: 5000, valueMsWarningHigh: 5000});
	vitalSigns.addVital({label:'Resp Rate', units:'bpm', metricIds:['MDC_RESP_RATE','MDC_CO2_RESP_RATE','MDC_TTHOR_RESP_RATE'],
	                     warningLow: 10, warningHigh: 18, criticalLow: 4, criticalHigh: 35, minimum: 0, maximum: 40,
	                     valueMsWarningLow: 5000, valueMsWarningHigh: 5000});

	//vitalSigns.on('vitalchanged', function(vitalSigns, vital) {
		// console.log("Change to " + vital);
	//});

	function bound() {
		VitalMonitor.renderVitalStatus(vitalSigns, document.getElementById("mycanvas"));
	}


	setInterval(bound, 500);
};