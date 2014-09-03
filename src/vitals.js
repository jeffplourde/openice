"use strict";

var moment = require('moment');

var OpenICE = require('./openice.js');


var Emitter = require('component-emitter');
Emitter(Vital.prototype);

function Value(args) {
	this.valueMsBelowLow = 0;
	this.valueMsAboveHigh = 0;
	this.sourceTimestamp = null;
	this.numeric = null;

	Object.defineProperty(this, "uniqueDeviceIdentifier", {
		writable: false,
		value: args.uniqueDeviceIdentifier
	});
	Object.defineProperty(this, "metricId", {
		writable: false,
		value: args.metricId
	});
	Object.defineProperty(this, "instanceId", {
		writable: false,
		value: args.instanceId
	});
	Object.defineProperty(this, "parent", {
		writable: false,
		value: args.parent
	});
	Object.defineProperty(this, "isIgnore", {
		get: function() {
			return this.parent.ignoreZero && (0 == this.numeric.value);
		}
	});
	Object.defineProperty(this, "isAtOrAboveHigh", {
		get: function() {
        	return (this.isIgnore || null == this.parent.warningHigh) ? false : (this.numeric.value >= this.parent.warningHigh);
		}
	});
	Object.defineProperty(this, "isAtOrBelowLow", {
		get: function() {
			return (this.isIgnore || null == this.parent.warningLow) ? false : (this.parent.warningLow >= this.numeric.value);
		}
	});
	Object.defineProperty(this, "isAtOrOutsideOfBounds", {
		get: function() {
			return this.isAtOrAboveHigh || this.isAtOrBelowLow;
		}
	});
	Object.defineProperty(this, "isAtOrAboveCriticalHigh", {
		get: function() {
			return (this.isIgnore || null == this.parent.criticalHigh) ? false : (this.numeric.value >= this.parent.criticalHigh);
		}
	});
	Object.defineProperty(this, "isAtOrBelowCriticalLow", {
		get: function() {
			return (this.isIgnore || null == this.parent.criticalLow) ? false : (this.parent.criticalLow >= this.numeric.value);
		}
	});
	Object.defineProperty(this, "isAtOrOutsideOfCriticalBounds", {
		get: function() {
			return this.isAtOrBelowCriticalLow || this.isAtOrAboveCriticalHigh;
		}
	});
}

Value.prototype.updateFrom = function(numeric, sourceTimestamp) {
	        // characterize the previous sample
        var wasBelow = this.numeric == null ? false : this.isAtOrBelowLow;
        var wasAbove = this.numeric == null ? false : this.isAtOrAboveHigh;
        var wasValue = this.numeric == null ? null : this.numeric.value;
        var wasTime = this.sourceTimestamp == null ? null : this.sourceTimestamp.sec * 1000 + this.sourceTimestamp.nanosec / 1000000;

		// update the sample info
        this.numeric = numeric;
        this.sourceTimestamp = sourceTimestamp;

        // characterize the new sample
        var isAbove = this.isAtOrAboveHigh;
        var isBelow = this.isAtOrBelowLow;
        var isValue = this.numeric.value;
        var isTime = this.sourceTimestamp.sec * 1000 + this.sourceTimestamp.nanosec / 1000000;


        // Integrate
        if (isAbove) {
            if (wasAbove) {
                // persisting above the bound ...
                this.valueMsAboveHigh += ((isTime - wasTime) * (wasValue - parent.warningHigh));
            } else {
                // above the bound but it wasn't previously ... so restart at
                // zero
                this.valueMsAboveHigh = 0;
            }
        } else {
            this.valueMsAboveHigh = 0;
        }

        if (isBelow) {
            if (wasBelow) {
                // persisting below the bound ...
                this.valueMsBelowLow += ((isTime - wasTime) * (parent.warningLow - wasValue));
            } else {
                this.valueMsBelowLow = 0;
            }
        } else {
            this.valueMsBelowLow = 0;
        }
};

Value.prototype.toString = function() {
	return "[udi=" + this.uniqueDeviceIdentifier + ",numeric.value=" + this.numeric.value + ",sourceTimestamp=" + this.sourceTimestamp + "]";
}



function Vital(args) {
	var valueMsWarningLow = args.valueMsWarningLow || null;
	var valueMsWarningHigh = args.valueMsWarningHigh || null;
	var warningLow = args.warningLow || null;
	var warningHigh = args.warningHigh || null;
	var noValueWarning = args.noValueWarning || false;
	var warningAgeBecomesAlarm = args.warningAgeBecomesAlarm || Number.MAX_VALUE;
	var criticalHigh = args.criticalHigh || null;
	var criticalLow = args.criticalLow || null;
	var parent = args.parent || null;
	var ignoreZero = true;
	this.values = [];

	Object.defineProperty(this, "label", {
		get: function() {
			return args.label;
		}
	});
	Object.defineProperty(this, "units", {
		get: function() {
			return args.units;
		}
	});
	Object.defineProperty(this, "metricIds", {
		get: function() {
			return args.metricIds;
		}
	});
	Object.defineProperty(this, "minimum", {
		get: function() {
			return args.minimum;
		}
	});
	Object.defineProperty(this, "maximum", {
		get: function() {
			return args.maximum;
		}
	});
	Object.defineProperty(this, "valueMsWarningLow", {
		get: function() {
			return valueMsWarningLow;
		},
		set: function(value) {
			this.valueMsWarningLow = value;
			this.emit('change', this);
		}
	});
	Object.defineProperty(this, "valueMsWarningHigh", {
		get: function() {
			return valueMsWarningHigh;
		},
		set: function(value) {
			this.valueMsWarningHigh = value;
			this.emit('change', this);
		}
	});
	Object.defineProperty(this, "warningLow", {
		get: function() {
			return warningLow;
		},
		set: function(low) {
			if (null != low) {
            	if (criticalLow != null && low < criticalLow) {
                	low = criticalLow;
            	} else if (warningHigh != null && low > warningHigh) {
                	low = warningHigh;
                }
            }
            this.warningLow = low;
            this.emit('change', this);
		}
	});
	Object.defineProperty(this, "warningHigh", {
		get: function() {
			return warningHigh;
		},
		set: function(high) {
        	if (null != high) {
            	if (criticalHigh != null && high > criticalHigh) {
                	high = criticalHigh;
            	} else if (warningLow != null && high < warningLow) {
                	high = warningLow;
            	}
        	}
        	warningHigh = high;
        	this.emit('change', this);
		}
	});
	Object.defineProperty(this, "criticalLow", {
		get: function() {
			return criticalLow;
		},
		set: function(low) {
	        if (null != low) {
	            if (low < minimum) {
	                low = minimum;
	            } else if (warningLow != null && low > warningLow) {
	                low = warningLow;
	            }
	        }
	        criticalLow = low;
	        //writeCriticalLimits();  
	        this.emit('change', this);
		}
	});
	Object.defineProperty(this, "criticalHigh", {
		get: function() {
			return criticalHigh;
		},
		set: function(high) {
	        if (null != high) {
	            if (high > maximum) {
	                high = maximum;
	            } else if (warningHigh != null && high < warningHigh) {
	                high = warningHigh;
	            }
	        }
	        criticalHigh = high;
	        //writeCriticalLimits();
	        this.emit('change', this);
		}
	});
	Object.defineProperty(this, "displayMaximum", {
		get: function() {
			if (null == this.warningHigh) {
            	if (null == this.warningLow) {
                	return this.maximum + this.maximum - this.minimum;
            	} else {
                	return this.maximum + 2 * (this.maximum - this.warningLow);
            	}
        	} else {
            	if (null == this.warningLow) {
                	return this.warningHigh + (this.warningHigh - this.minimum);
            	} else {
                	return 1.5 * this.warningHigh - 0.5 * this.warningLow;
            	}
        	}
		}
	});
	Object.defineProperty(this, "displayMinimum", {
		get: function() {
			if (null == this.warningHigh) {
            	if (null == this.warningLow) {
                	return this.minimum - this.minimum + this.maximum;
            	} else {
                	return this.warningLow - (this.maximum - this.warningLow);
            	}
        	} else {
	            if (null == this.warningLow) {
                	return this.warningHigh - 3 * (this.warningHigh - this.minimum);
            	} else {
	                return 1.5 * this.warningLow - 0.5 * this.warningHigh;
            	}
        	}
		}
	});
	Object.defineProperty(this, "labelMaximum", {
		get: function() {
			if(this.displayMaximum > this.maximum) {
				return "";
			} else {
				return ""+Math.round(this.displayMaximum);
			}
		}
	});
	Object.defineProperty(this, "labelMinimum", {
		get: function() {
			if(this.minimum > this.displayMinimum) {
				return "";
			} else {
				return ""+Math.round(this.displayMinimum);
			}
		}
	});
	Object.defineProperty(this, "noValueWarning", {
		get: function() {
			return noValueWarning;
		},
		set: function(value) {
	        if (noValueWarning ^ value) {
	            noValueWarning = value;
	            this.emit('change', this);
	        }
		}
	});
	Object.defineProperty(this, "warningAgeBecomesAlarm", {
		get: function() {
			return warningAgeBecomesAlarm;
		},
		set: function(value) {
			warningAgeBecomesAlarm = value;
			this.emit('change', this);
		}
	});
	Object.defineProperty(this, "parent", {
		get: function() {
			return parent;
		}
	});
	Object.defineProperty(this, "countOutOfBounds", {
		get: function() {
			var cnt = 0;
			for(var i = 0; i < this.values.length; i++) {
				cnt += this.values[i].isAtOrAboveHigh ? 1 : 0;
				cnt += this.values[i].isAtOrBelowLow ? 1 : 0;
			}
			return cnt;
		}
	});
	Object.defineProperty(this, "anyOutOfBounds", {
		get: function() {
			return this.countOutOfBounds > 0;
		}
	});
	Object.defineProperty(this, "ignoreZero", {
		get: function() {
			return ignoreZero;
		},
		set: function(value) {
			if (ignoreZero ^ value) {
            	ignoreZero = value;
            	this.emit('change', this);
        	}
		}
	});
};

Vital.prototype.toString = function() {
	return "[label=" + this.label + ",names=[" + this.metricIds + "],minimum=" + this.minimum + ",maximum=" + this.maximum + 
			",warningLow=" + this.warningLow + ",warningHigh=" + this.warningHigh + 
			",criticalLow="+ this.criticalLow+",criticalHigh="+this.criticalHigh+",values=" + this.values + "]";
}


Emitter(VitalSigns.prototype);

function VitalSigns() {
	var vitals = [];
	Object.defineProperty(this, "vitals", {
		writable: false,
		value: vitals
	});
	var countWarningsBecomeAlarm = 2;
	Object.defineProperty(this, "countWarningsBecomeAlarm", {
		get: function() {
			return countWarningsBecomeAlarm;
		},
		set: function(value) {
			if(countWarningsBecomeAlarm != value) {
				countWarningsBecomeAlarm = value;
				this.emit('vitalchanged', this, null);
			}
		}
	});
	this.warningText = "";

	this.on('vitalchanged', this.updateState.bind(this));

};

VitalSigns.prototype.setTable = function(numericsTable) {
	// TODO Reset the state of this model (clear values)

	numericsTable.on('sample', this.onSample.bind(this));
	numericsTable.on('afteradd', this.onInsert.bind(this));
	numericsTable.on('beforeremove', this.onRemove.bind(this));
	for(var i = 0; i < numericsTable.rows.length; i++) {
		this.onInsert(numericsTable, numericsTable.rows[i]);
	}
}


VitalSigns.prototype.onSample = function(table, row, sample) {
	for(var i = 0; i < this.vitals.length; i++) {
		var v = this.vitals[i];
        if (v != null) {
        	for(var j = 0; j < v.metricIds.length; j++) {
                if (v.metricIds[j] == row.keyValues.metric_id) {
                    var updated = false;
                    for(var k = 0; k < v.values.length; k++) {
                    	var va = v.values[k];
                        if (va.instanceId == row.keyValues.instance_id && va.metricId==row.keyValues.metric_id
                                && va.uniqueDeviceIdentifier==row.keyValues.unique_device_identifier) {
                            va.updateFrom(sample.data, sample.sourceTimestamp);
                            updated = true;
                        }
                    }
                    if (!updated) {
                    	var va = new Value({uniqueDeviceIdentifier:row.keyValues.unique_device_identifier, 
                    		metricId:row.keyValues.metric_id, instanceId: row.keyValues.instance_id,
                    		parent: v});
                        va.updateFrom(sample.data, sample.sourceTimestamp);
                        v.values.push(va);
                    }
                    this.emit('vitalchanged', this, v);
                }
            }
        }
    }
};
VitalSigns.prototype.onInsert = function(table, row) {

};
VitalSigns.prototype.onRemove = function(table, row) {
	for(var i = 0; i < this.vitals.length; i++) {
		var updated = false;
		var v = this.vitals[i];
		if(v != null) {
			for(var j = 0; j < v.metricIds.length; j++) {
				if(row.keyValues.metric_id == v.metricIds[j]) {
					for(var k = 0; k < v.values.length; k++) {
						var value = v.values[k];
						if(value.uniqueDeviceIdentifier == row.keyValues.unique_device_identifier && value.instanceId == row.keyValues.instance_id) {

							v.values.splice(k, 1);
							updated = true;
						}
					}
				}
			}
		}
		if(updated) {
			this.emit('vitalchanged', v);
		}
	}
};
VitalSigns.prototype.addVital = function(args) {
	args.parent = this;
	var vital = new Vital(args);
	this.vitals.push(vital);
	this.emit('vitaladded', this, vital);
};

VitalSigns.prototype.removeVital = function(vital) {
	for(var i = 0; i < this.vitals.length; i++) {
		if(this.vitals[i] === vital) {
			this.vitals.splice(i, 1);
			this.emit('vitalremoved', this, vital);
		}
	}
};

VitalSigns.prototype.updateState = function() {
    var N = this.vitals.length;
    var advisories = [];

    var time = moment().format("HH:mm:ss");

    var countWarnings = 0;

    for (var i = 0; i < N; i++) {
        var vital = this.vitals[i];
        
        if (vital.isNoValueWarning && vital.values.length==0) {
            countWarnings++;
            advisories.push("- no source of " + vital.label + "\r\n");
        } else {
            for (var j = 0; j < vital.values.length; j++) {
            	var val = vital.values[j];
                if (val.isAtOrBelowLow) {
                    countWarnings++;
                    advisories.push("- low " + vital.label + " " + val.numeric.value + " " + vital.units + "\r\n");
                }
                if (val.isAtOrAboveHigh) {
                    countWarnings++;
                    advisories.push("- high " + vital.label + " " + val.numeric.value + " " + vital.units + "\r\n");
                }
            }
        }
    }
    // Advisory processing
    if (countWarnings > 0) {
    	var warningTextBuilder = "";
        for (var i = 0; i < advisories.length; i++) {
        	warningTextBuilder += advisories[i];
        }
        warningTextBuilder += "at ";
        warningTextBuilder += time;
        this.warningText = warningTextBuilder;
        this.state = "Warning";
    } else {
        this.warningText = "";
        this.state = "Normal";
    }
    if (countWarnings >= this.countWarningsBecomeAlarm) {
        this.state = "Alarm";
        //stopInfusion("Pump Stopped\r\n" + warningText + "\r\nnurse alerted");
    } else {
        for (var i = 0; i < N; i++) {
            var vital = this.vitals[i];
            for (var j = 0; j < vital.values.length; j++) {
            	var val = vital.values[j];
                if (val.isAtOrBelowCriticalLow) {
                    this.state = "Alarm";
                    // stopInfusion("Pump Stopped\r\n- low " + vital.getLabel() + " " + val.getNumeric().value + " " + vital.getUnits() + "\r\nat "
                    //         + time + "\r\nnurse alerted");
                    break;
                } else if (val.isAtOrAboveCriticalHigh) {
                    this.state = "Alarm";
                    // stopInfusion("Pump Stopped\r\n- high " + vital.getLabel() + " " + +val.getNumeric().value + " " + vital.getUnits()
                    //         + "\r\nat " + time + "\r\nnurse alerted");
                    break;
                }
            }
        }
    }
};

module.exports = exports = VitalSigns;

