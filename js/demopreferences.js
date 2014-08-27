var plotColors = {
	"MDC_PRESS_AWAY": "#00FFFF",
	"MDC_PRESS_BLD": "#FF0000",
	"MDC_CONC_AWAY_CO2_ET": "#FF00FF",
	"MDC_ECG_AMPL_ST_I": "#00FF00",
	"MDC_ECG_AMPL_ST_II": "#00FF00",
	"MDC_ECG_AMPL_ST_III": "#00FF00",
	"MDC_ECG_AMPL_ST_V": "#00FF00",
	"MDC_PULS_OXIM_PLETH": "#CC00FF",
	"MDC_FLOW_AWAY": "#0000FF",
	"MDC_CAPNOGRAPH": "#FFFF00"
};

var commonNames = {
	"MDC_PRESS_AWAY": "Airway Pressure",
	"MDC_PRESS_BLD": "Invasive BP",
	"MDC_CONC_AWAY_CO2_ET": "Capnogram",
	"MDC_ECG_AMPL_ST_I": "ECG - I",
	"MDC_ECG_AMPL_ST_II": "ECG - II",
	"MDC_ECG_AMPL_ST_III": "ECG - III",
	"MDC_ECG_AMPL_ST_V": "ECG - V",
	"MDC_PULS_OXIM_PLETH": "Pulse Oximetry",
	"MDC_FLOW_AWAY": "Airway Flow",
	"MDC_CAPNOGRAPH": "Respiration",
	"MDC_ECG_AMPL_ST_V2": "ECG - V2",
	"MDC_PRESS_BLD_ART_ABP": "Arterial BP",
	"MDC_ECG_AMPL_ST_AVR": "ECG - aVR",
	"MDC_PRESS_BLD_ART": "ART"
};

var flotNames = {
	"MDC_PRESS_AWAY": "vent-PEEP",
	"MDC_PRESS_BLD": "monitor-press",
	"MDC_CONC_AWAY_CO2_ET": "monitor",
	"MDC_ECG_AMPL_ST_I": "monitor-HR",
	"MDC_ECG_AMPL_ST_II": "monitor-HR",
	"MDC_ECG_AMPL_ST_III": "monitor-HR",
	"MDC_PULS_OXIM_PLETH": "monitor-spo2",
	"MDC_FLOW_AWAY": "vent-RR",
	"MDC_CAPNOGRAPH": "monitor-RR",
	"MDC_ECG_AMPL_ST_V2": "monitor",
	"MDC_PRESS_BLD_ART_ABP": "monitor",
	"MDC_ECG_AMPL_ST_AVR": "monitor",
	"MDC_PRESS_BLD_ART": "monitor"
};

var relatedNumeric = {
	"MDC_PRESS_AWAY": [{code:"MDC_PRESS_AWAY",name:"PEEP"}],
	"MDC_PRESS_BLD": [{code:"MDC_PRESS_BLD_SYS",name:"Systolic"},{code:"MDC_PRESS_BLD_DIA",name:"Diastolic"}],
	"MDC_CONC_AWAY_CO2_ET": [],
	"MDC_ECG_AMPL_ST_I": [{code:"MDC_ECG_CARD_BEAT_RATE",name:"HR"}],
	"MDC_ECG_AMPL_ST_II": [{code:"MDC_ECG_CARD_BEAT_RATE",name:"HR"}],
	"MDC_ECG_AMPL_ST_III": [{code:"MDC_ECG_CARD_BEAT_RATE",name:"HR"}],
	"MDC_PULS_OXIM_PLETH": [{code:"MDC_PULS_OXIM_SAT_O2", name:"SpO\u2082%"}, {code:"MDC_PULS_OXIM_PULS_RATE",name:"PR"}],
	"MDC_FLOW_AWAY": [{code:"MDC_RESP_RATE",name:"RR"}],
	"MDC_CAPNOGRAPH": [{code:"MDC_RESP_RATE",name:"RR"}],
	"MDC_ECG_AMPL_ST_V2": [],
	"MDC_PRESS_BLD_ART_ABP": [],
	"MDC_ECG_AMPL_ST_AVR": [],
	"MDC_PRESS_BLD_ART": []
};


function getPlotColor(metric_id) {
	return plotColors[metric_id] || "#FFFFFF";
}

function getCommonName (metric_id) {
	return commonNames[metric_id] || metric_id;
}

function getFlotName(metric_id) {
	return flotNames[metric_id] || "monitor";
}

function getRelatedNumeric(metric_id) {
	return relatedNumeric[metric_id] || [];
}
