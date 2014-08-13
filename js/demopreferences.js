var plotColors = {
	"MDC_PRESS_AWAY": "#00FFFF",
	"MDC_PRESS_BLD": "#FF0000",
	"MDC_CONC_AWAY_CO2_ET": "#FFFF00",
	"MDC_ECG_AMPL_ST_I": "#00FF00",
	"MDC_ECG_AMPL_ST_II": "#00FF00",
	"MDC_ECG_AMPL_ST_III": "#00FF00",
	"MDC_PULS_OXIM_PLETH": "#CC00FF",
	"MDC_FLOW_AWAY": "#0000FF",
	"MDC_CAPNOGRAPH": "#FF00FF"
};

var commonNames = {
	"MDC_PRESS_AWAY": "Airway Pressure",
	"MDC_PRESS_BLD": "Invasive BP",
	"MDC_CONC_AWAY_CO2_ET": "Capnogram",
	"MDC_ECG_AMPL_ST_I": "ECG - I",
	"MDC_ECG_AMPL_ST_II": "ECG - II",
	"MDC_ECG_AMPL_ST_III": "ECG - III",
	"MDC_PULS_OXIM_PLETH": "Pulse Oximetry",
	"MDC_FLOW_AWAY": "Airway Flow",
	"MDC_CAPNOGRAPH": "Capnogram",
	"MDC_ECG_AMPL_ST_V2": "ECG - V2",
	"MDC_PRESS_BLD_ART_ABP": "Arterial BP",
	"MDC_ECG_AMPL_ST_AVR": "ECG - aVR",
	"MDC_PRESS_BLD_ART": "ART"
};

var flotNames = {
	"MDC_PRESS_AWAY": "evita-0",
	"MDC_PRESS_BLD": "ivy-2",
	"MDC_CONC_AWAY_CO2_ET": "ivy",
	"MDC_ECG_AMPL_ST_I": "ivy",
	"MDC_ECG_AMPL_ST_II": "ivy-0",
	"MDC_ECG_AMPL_ST_III": "ivy",
	"MDC_PULS_OXIM_PLETH": "ivy-1",
	"MDC_FLOW_AWAY": "evita-1",
	"MDC_CAPNOGRAPH": "ivy",
	"MDC_ECG_AMPL_ST_V2": "ivy",
	"MDC_PRESS_BLD_ART_ABP": "ivy",
	"MDC_ECG_AMPL_ST_AVR": "ivy",
	"MDC_PRESS_BLD_ART": "ivy"
};


function getPlotColor(metric_id) {
	return plotColors[metric_id] || "#FFFFFF";
}

function getCommonName (metric_id) {
	return commonNames[metric_id] || "";
}

function getFlotName(metric_id) {
	return flotNames[metric_id] || "";
}
