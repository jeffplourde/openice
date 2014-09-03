"use strict";

function Polygon() {
	this.points = [];
}

Polygon.prototype.addPoint = function(x,y) {
	this.points.push([x,y]);
	return this;
};

Polygon.prototype.path = function(ctx) {
	ctx.beginPath();
	if(this.points.length > 0) {
		ctx.moveTo(this.points[0][0], this.points[0][1]);
		for(var i = 1; i < this.points.length; i++) {
			ctx.lineTo(this.points[i][0], this.points[i][1]);
		}
	}
	ctx.closePath();
	return this;
};

Polygon.prototype.fill = function(ctx) {
	this.path(ctx);
	ctx.fill();
	return this;
};

Polygon.prototype.stroke = function(ctx) {
	this.path(ctx);
	ctx.stroke();
	return this;
};

function drawLine(ctx, x1,y1,x2,y2) {
	ctx.beginPath();
	ctx.moveTo(x1,y1);
	ctx.lineTo(x2,y2);
	ctx.closePath();
	ctx.stroke();
}


var IDEAL_COLOR = "#0000FF"; // wanted opacity 0.8
var DATA_COLOR  = "#00FF00"; // 0.3
var WARN_DATA_COLOR = "#FFFF00"; // 0.5
var ALARM_DATA_COLOR = "#FF0000"; // 0.9
var WHITEN_COLOR = "#FFFFFF"; // 0.8


function renderVitalStatus(vitalSigns, canvas) {
    if (vitalSigns == null) {
        return;
    }
    var N = vitalSigns.vitals.length;
    var ctx = canvas.getContext("2d");

    var size = {width:canvas.scrollWidth,height:canvas.scrollHeight,toString:function(){return "["+this.width+","+this.height+"]";}};
    var center = {x:size.width/2.0,y:size.height/2.0,toString:function(){return "["+this.x+","+this.y+"]";}};

    ctx.fillStyle="#FFFFFF";	
    ctx.fillRect(0,0,size.width, size.height);

    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
	ctx.font = "12pt Arial";

    if (N < 3) {	 
        var s = "Please add at least three vital signs.";
        var width = ctx.measureText(s).width;
        var height = 12; //ctx.measureText(s).height;

        ctx.fillText(s, center.x - width / 2.0, center.y - height / 2.0 );
        return;
    }

    var radius = 0.8 * Math.min(center.x, center.y);
    var radiansPerArc = 2.0 * Math.PI / N;

    var chartArea = new Polygon();
    var dataArea = new Polygon();
    var idealArea = new Polygon();


    for (var v = 0; v < N; v++) {
    	var vital = vitalSigns.vitals[v];

        var r1 = v * radiansPerArc;
        var r2 = (v == (N - 1) ? 0 : (v + 1)) * radiansPerArc;

        var x1 = Math.round(center.x + radius * Math.cos(r1));
        var x2 = Math.round(center.x + radius * Math.cos(r2));
        var y1 = Math.round(center.y + radius * Math.sin(r1));
        var y2 = Math.round(center.y + radius * Math.sin(r2));

        var REVERSE_DIRECTION = y2 > y1;
        var VERTICAL = Math.abs(x2 - x1) <= 1;

        var minimum = REVERSE_DIRECTION ? vital.displayMaximum : vital.displayMinimum;
        var maximum = REVERSE_DIRECTION ? vital.displayMinimum : vital.displayMaximum;

        var minimumLabel = REVERSE_DIRECTION ? vital.labelMaximum : vital.labelMinimum;
        var maximumLabel = REVERSE_DIRECTION ? vital.labelMinimum : vital.labelMaximum;

        var warningLow = vital.warningLow;
        var warningHigh = vital.warningHigh;

        if (null == warningLow) {
            if (null == warningHigh) {
                warningLow = vital.minimum;
                warningHigh = vital.maximum;
            } else {
                warningLow = warningHigh - 2 * (warningHigh - vital.minimum);
            }
        } else {
            if (null == warningHigh) {
                warningHigh = warningLow + 2 * (vital.maximum - warningLow);
            } else {
            }
        }

        chartArea.addPoint(x1, y1);

        var slope = 1.0 * (y2 - y1) / (x2 - x1);
        var intercept = y1 - slope * x1;

        if (REVERSE_DIRECTION) {
            var proportion = 1.0 * (warningHigh - minimum) / (maximum - minimum);
            var x_ideal = proportion * (x2 - x1) + x1;
            var y_ideal = slope * x_ideal + intercept;
            if (VERTICAL) {
                x_ideal = x1;
                y_ideal = proportion * (y2 - y1) + y1;
            }
            idealArea.addPoint(x_ideal, y_ideal);

            proportion = 1.0 * (warningLow - minimum) / (maximum - minimum);
            x_ideal = proportion * (x2 - x1) + x1;
            y_ideal = slope * x_ideal + intercept;
            if (VERTICAL) {
                x_ideal = x1;
                y_ideal = proportion * (y2 - y1) + y1;
            }
            idealArea.addPoint(x_ideal, y_ideal);

        } else {
            var proportion = 1.0 * (warningLow - minimum) / (maximum - minimum);
            var x_ideal = proportion * (x2 - x1) + x1;
            var y_ideal = slope * x_ideal + intercept;
            if (VERTICAL) {
                x_ideal = x1;
                y_ideal = proportion * (y2 - y1) + y1;
            }

            idealArea.addPoint(x_ideal, y_ideal);

            proportion = 1.0 * (warningHigh - minimum) / (maximum - minimum);
            x_ideal = proportion * (x2 - x1) + x1;
            y_ideal = slope * x_ideal + intercept;
            if (VERTICAL) {
                x_ideal = x1;
                y_ideal = proportion * (y2 - y1) + y1;
            }

            idealArea.addPoint(x_ideal, y_ideal);
        }
        
        var length = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

        var x_ideal = 0.5 * (x2 - x1) + x1;
        var y_ideal = slope * x_ideal + intercept;
        if (VERTICAL) {
            x_ideal = x1;
            y_ideal = 0.5 * (y2 - y1) + y1;
        }

        // START OF TRANSFORM SECTION
        ctx.translate(x_ideal,y_ideal);
        var rotate = Math.atan2((y2 - y1), (x2 - x1));
        var FLIP = false;
        if (VERTICAL) {
            rotate -= Math.PI;
            FLIP = true;
        } else if (rotate > Math.PI / 2.0) {
            rotate -= Math.PI;
            FLIP = true;
        } else if (rotate < -Math.PI / 2.0) {
            rotate += Math.PI;
            FLIP = true;
        }
        var FLIP_SIGN = FLIP ? -1 : 1;

        ctx.rotate(rotate);
        var lbl = vital.label + " (" + vital.units + ")";
        // is there an HTML5 equivalent to g.getFontMetrics().getMaxDescent();
        var maxDescent = 3; 
        var tickSize = 5;
		// is there an equivalent? g.getFontMetrics().getHeight();
        var height = 12; 
        var str_w = ctx.measureText(lbl).width;
        if (FLIP) {
            ctx.fillText(lbl, -str_w / 2, 3 * height + maxDescent);
        } else {
            ctx.fillText(lbl, -str_w / 2, FLIP_SIGN * (-2 * height - maxDescent));
        }

        lbl = minimumLabel;
        str_w = ctx.measureText(lbl).width;
        if (FLIP) {
            ctx.fillText(lbl, length / 2 - str_w, maxDescent + height + 5);
            drawLine(ctx,length/2,0,length/2,tickSize);
        } else {
            ctx.fillText(lbl, -length / 2, -maxDescent - 5);
            drawLine(ctx, -length / 2, 0, -length / 2, -tickSize);
        }

        if (null != vital.warningLow) {
        	var c = ctx.fillStyle;
            ctx.fillStyle = IDEAL_COLOR;
            lbl = "" + warningLow;
            str_w = ctx.measureText(lbl).width;
            var proportion = 1.0 * (warningLow - minimum) / (maximum - minimum);
            proportion -= 0.5;
            var xloc = proportion * length;
            if (FLIP) {
                ctx.fillText(lbl, -xloc - str_w / 2, maxDescent + height + 5);
                drawLine(ctx, -xloc, 0, -xloc, tickSize);
            } else {
                ctx.fillText(lbl, xloc - str_w / 2, -maxDescent - 5);
                drawLine(ctx,xloc,0,xloc,-tickSize);
            }
            ctx.fillStyle = c;
        }

        lbl = maximumLabel;
        str_w = ctx.measureText(lbl).width;
        if (FLIP) {
            ctx.fillText(lbl, -length / 2, maxDescent + 5 + height);
            drawLine(ctx, -length / 2, 0, -length / 2, tickSize);
        } else {
            ctx.fillText(lbl, length / 2 - str_w, -maxDescent - 5);
            drawLine(ctx, length / 2, 0, length / 2, -tickSize);
        }

        if (null != vital.warningHigh) {
        	var c = ctx.fillStyle;
        	ctx.fillStyle = IDEAL_COLOR;
            lbl = ""+warningHigh;
            str_w = ctx.measureText(lbl).width;
            var proportion = 1.0 * (warningHigh - minimum) / (maximum - minimum);
            proportion -= 0.5;
            var xloc = proportion * length;
            if (FLIP) {
                ctx.fillText(lbl, -xloc - str_w / 2, maxDescent + height + 5);
                drawLine(ctx, -xloc, 0, -xloc, tickSize);
            } else {
                ctx.fillText(lbl, xloc - str_w / 2, -maxDescent - 5);
                drawLine(ctx, xloc, 0, xloc, -tickSize);
            }
            ctx.fillStyle = c;
        }
        lbl = ""+((maximum - minimum) / 2 + minimum);
        str_w = ctx.measureText(lbl).width;
        if (FLIP) {
            ctx.fillText(lbl, -str_w / 2, maxDescent + 5 + height);
            drawLine(ctx, 0, 0, 0, tickSize);
        } else {
            ctx.fillText(lbl, -str_w / 2, -maxDescent - 5);
            drawLine(ctx, 0, 0, 0, -tickSize);
        }

        ctx.setTransform(1,0,0,1,0,0);

        // END OF TRANSFORM SECTION

        if (vital.values.length > 0) {
        	var vital_values = [];

            for(var i = 0; i < vital.values.length; i++) {
            	if(!vital.values[i].isIgnore) {
            		vital_values.push(vital.values[i].numeric.value);
            	}
            }
            // use a numeric sort; default is lexical and undesirable
            vital_values = vital_values.sort(function(a,b) { return a-b; });

            if (REVERSE_DIRECTION && vital_values.length > 1) {
                for (var k = 0; k < vital_values.length / 2; k++) {
                    var tmp = vital_values[k];
                    vital_values[k] = vital_values[vital_values.length - 1 - k];
                    vital_values[vital_values.length - 1 - k] = tmp;
                }
            }

            for (var j = 0; j < vital_values.length; j++) {
                var f = vital_values[j];
                var proportion = 1.0 * (f - minimum) / (maximum - minimum);
                var x = Math.floor(proportion * (x2 - x1) + x1);
                var y = Math.floor(slope * x + intercept);

                if (VERTICAL) {
                    x = x1;
                    y = proportion * (y2 - y1) + y1;
                }
                dataArea.addPoint(x, y);
            }
        }
	}
	ctx.setTransform(1,0,0,1,0,0); 
	ctx.fillStyle = WHITEN_COLOR;
    chartArea.fill(ctx);
    ctx.fillStyle = ctx.strokeStyle = "#000000";
    chartArea.stroke(ctx);
    ctx.fillStyle  = ctx.strokeStyle = IDEAL_COLOR;
    idealArea.stroke(ctx);

    if("Alarm"==vitalSigns.state) {
        ctx.fillStyle = ctx.strokeStyle = ALARM_DATA_COLOR;
    } else if("Warning"==vitalSigns.state) {
        ctx.fillStyle = ctx.strokeStyle = WARN_DATA_COLOR;
    } else {
        ctx.fillStyle = ctx.strokeStyle = DATA_COLOR;
    }

    if (dataArea.points.length > 1) {
    	dataArea.fill(ctx);
    	ctx.stroke();
	}
}

module.exports.renderVitalStatus = renderVitalStatus;