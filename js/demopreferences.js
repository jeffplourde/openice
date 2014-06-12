function getPlotColor(metric_id) {
	var plotColor = null;

	if("MDC_PRESS_AWAY" == metric_id) {
		plotColor = "#00FFFF";
	} else if("MDC_PRESS_BLD" == metric_id) {
		plotColor = "#FF0000";
	} else if("MDC_CONC_AWAY_CO2_ET" == metric_id) {
		plotColor = "#FFFF00";
	} else if("MDC_ECG_AMPL_ST_I" == metric_id) {
		plotColor = "#00FF00";
	} else if("MDC_ECG_AMPL_ST_II" == metric_id) {
		plotColor = "#00FF00";
	} else if("MDC_ECG_AMPL_ST_III" == metric_id) {
		plotColor = "#00FF00";
	} else if("MDC_PULS_OXIM_PLETH" == metric_id) {
		plotColor = "#FF9900";
	} else if("MDC_FLOW_AWAY" == metric_id) {
		plotColor = "#0000FF";
	} else if("MDC_CAPNOGRAPH" == metric_id) {
		plotColor = "#FF00FF";
	} else {
		plotColor = "#FFFFFF";
	}
	
	return plotColor
}

function getCommonName (metric_id) {
	var name = null;

	if("MDC_PRESS_AWAY" == metric_id) {
		name = "Airway Pressure";
	} else if("MDC_PRESS_BLD" == metric_id) {
		name = "IBP";
	} else if("MDC_CONC_AWAY_CO2_ET" == metric_id) {
		name = "Capnogram";
	} else if("MDC_ECG_AMPL_ST_I" == metric_id) {
		name = "ECG - I";
	} else if("MDC_ECG_AMPL_ST_II" == metric_id) {
		name = "ECG - II";
	} else if("MDC_ECG_AMPL_ST_III" == metric_id) {
		name = "ECG - III";
	} else if("MDC_PULS_OXIM_PLETH" == metric_id) {
		name = "Pleth";
	} else if("MDC_FLOW_AWAY" == metric_id) {
		name = "Airway Flow";
	} else if("MDC_CAPNOGRAPH" == metric_id) {
		name = "Capnogram";
	} else if("MDC_ECG_AMPL_ST_V2" == metric_id) {
		name = "ECG - V2";
	} else if("MDC_PRESS_BLD_ART_ABP" == metric_id) {
		name = "ABP";
	} else if("MDC_ECG_AMPL_ST_AVR" == metric_id) {
		name = "ECG - aVR";
	} else if("MDC_PRESS_BLD_ART" == metric_id) {
		name = "ART";
	} else {
		name = "unknown waveform";
	}
	
	return name
}


