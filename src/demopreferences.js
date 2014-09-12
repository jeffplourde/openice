var plotColors = {
	"MDC_PRESS_AWAY": "#00FFFF",
	"MDC_PRESS_BLD": "#FF0000",
	"MDC_PRESS_BLD_ART_ABP": "#FF0000",
	"MDC_CONC_AWAY_CO2_ET": "#FF00FF",
	"MDC_ECG_LEAD_I": "#00FF00",
	"MDC_ECG_LEAD_II": "#00FF00",
	"MDC_ECG_LEAD_III": "#00FF00",
	"MDC_ECG_LEAD_V1": "#00FF00",
	"MDC_ECG_LEAD_V2": "#00FF00",
	"MDC_PULS_OXIM_PLETH": "#CC00FF",
	"MDC_FLOW_AWAY": "#0000FF",
	"MDC_AWAY_CO2": "#FFFF00",
	"MDC_IMPED_TTHOR": "#FFFF00"
};

var commonNames = {
	"MDC_PRESS_AWAY": "Airway Pressure",
	"MDC_PRESS_BLD": "Invasive BP",
	"MDC_CONC_AWAY_CO2_ET": "Capnogram",
	"MDC_ECG_LEAD_I": "ECG - I",
	"MDC_ECG_LEAD_II": "ECG - II",
	"MDC_ECG_LEAD_III": "ECG - III",
	"MDC_ECG_LEAD_V1": "ECG - V1",
	"MDC_PULS_OXIM_PLETH": "Pulse Oximetry",
	"MDC_FLOW_AWAY": "Airway Flow",
	"MDC_IMP": "Respiration",
	"MDC_ECG_LEAD_V2": "ECG - V2",
	"MDC_PRESS_BLD_ART_ABP": "Arterial BP",
	"MDC_ECG_LEAD_AVR": "ECG - aVR",
	"MDC_PRESS_BLD_ART": "ART",
	"MDC_AWAY_CO2": "Capnogram",
	"MDC_IMPED_TTHOR": "Transthoracic Impedance"
};

var flotNames = {
	"MDC_PRESS_AWAY": "vent-PEEP",
	"MDC_PRESS_BLD": "monitor-press",
	"MDC_PRESS_BLD_ART_ABP": "monitor-press",
	"MDC_CONC_AWAY_CO2_ET": "monitor",
	"MDC_ECG_LEAD_I": "monitor-HR",
	"MDC_ECG_LEAD_II": "monitor-HR",
	"MDC_ECG_LEAD_III": "monitor-HR",
	"MDC_PULS_OXIM_PLETH": "monitor-spo2",
	"MDC_FLOW_AWAY": "vent-RR",
	"MDC_RESP_RATE": "monitor-RR",
	"MDC_IMPED_TTHOR": "monitor-RR",
	"MDC_ECG_LEAD_V2": "monitor",
	"MDC_ECG_LEAD_V1": "monitor",
	"MDC_PRESS_BLD_ART_ABP": "monitor",
	"MDC_ECG_LEAD_AVR": "monitor",
	"MDC_PRESS_BLD_ART": "monitor"
};

var relatedNumeric = {
	"MDC_PRESS_AWAY": [{code:"MDC_PRESS_AWAY",name:"PEEP"}],
	"MDC_PRESS_BLD": [{code:"MDC_PRESS_BLD_SYS",name:"Systolic"},{code:"MDC_PRESS_BLD_DIA",name:"Diastolic"}],
	"MDC_CONC_AWAY_CO2_ET": [],
	"MDC_ECG_LEAD_I": [],
	"MDC_ECG_LEAD_II": [{code:"MDC_ECG_HEART_RATE",name:"HR"}],
	"MDC_ECG_LEAD_III": [],
	"MDC_PULS_OXIM_PLETH": [{code:"MDC_PULS_OXIM_SAT_O2", name:"SpO\u2082%"}, {code:"MDC_PULS_OXIM_PULS_RATE",name:"PR"}],
	"MDC_FLOW_AWAY": [{code:"MDC_RESP_RATE",name:"RR"}],
	"MDC_AWAY_CO2": [{code:"MDC_CO2_RESP_RATE",name:"RR"}],
	"MDC_ECG_LEAD_V2": [],
	"MDC_ECG_LEAD_V1": [],
	"MDC_PRESS_BLD_ART_ABP": [],
	"MDC_ECG_LEAD_AVR": [],
	"MDC_PRESS_BLD_ART": [],
	"MDC_IMPED_TTHOR": [{code:"MDC_TTHOR_RESP_RATE",name:"RR"}],
};


exports.getPlotColor = function(metric_id) {
	return plotColors[metric_id] || "#FFFFFF";
}

exports.getCommonName = function(metric_id) {
	return commonNames[metric_id] || metric_id;
}

exports.getFlotName = function(metric_id) {
	return flotNames[metric_id] || "monitor";
}

exports.getRelatedNumeric = function(metric_id) {
	return relatedNumeric[metric_id] || [];
}

