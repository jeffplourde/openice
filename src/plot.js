var moment = require('moment');

var PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

createHiPPICanvas = function(w, h, ratio) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
}
makeHiPPICanvas = function(canvas, ratio) {
  var style = getComputedStyle(canvas);
  if(!canvas.styleWidthWhenComputed || style.width != canvas.styleWidthWhenComputed || style.height != canvas.styleHeightWhenComputed) {
    if (!ratio) { ratio = PIXEL_RATIO; }
    if(ratio != 1) {
      canvas.width = ratio * parseFloat(style.width);
      canvas.height = ratio * parseFloat(style.height);
    }
    canvas.styleWidthWhenComputed = style.width;
    canvas.styleHeightWhenComputed = style.height;
  }
  return canvas;
}


function isElementInViewport (el) {

    //special bonus for those using jQuery
    if (el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    // Changed from original to return true even if the element is clipped (not fully displayed)

    return (
        rect.top >= -el.height &&
        rect.left >= -el.width &&
        rect.bottom <= (el.height + (window.innerHeight || document.documentElement.clientHeight)) && /*or $(window).height() */
        rect.right <= (el.width + (window.innerWidth || document.documentElement.clientWidth)) /*or $(window).width() */
    );
}

function Renderer(args) {
  this.canvas = args.canvas;
  this.canvas = makeHiPPICanvas(this.canvas);
  this.row = args.row;
  this.continuousRescale = args.continuousRescale || false;
  this.overwrite = args.overwrite || false;	
  this.minY = Number.MAX_VALUE;
  this.maxY = Number.MIN_VALUE;
  this.gap_size = 0.05;
  this.background = args.background || "#FFFFFF";
  this.color = args.color || "#000000";
  this.textColor = args.textColor || "#000000";
  Object.defineProperty(this, "textFont", {
    get: function() {
      return this.__textFont;
    },
    set: function(value) {
      this.__textFont = value;
      this.__textFontSize = +value.match(/[0-9]+/);
    }
  });
  this.textFont = args.textFont || "20pt Arial";
  Object.defineProperty(this, "textFontSize", {
    get: function() {
      return this.__textFontSize;
    }
  });
  this.lineWidth = args.lineWidth || 1;
  this.borderWidth = args.borderWidth || 0;
  this.borderColor = args.borderColor || "#000000";
  this.fillArea = args.fillArea || false;
}

module.exports = exports = Renderer;

var DASHES = 21;

Renderer.prototype.render = function(t1, t2, s1, s2) {
  if(!isElementInViewport(this.canvas)) {
    return;
  }


  var ctx = this.canvas.getContext("2d");
  makeHiPPICanvas(this.canvas);
  ctx.save();
  var height = this.canvas.height;
  var width = this.canvas.width;

  ctx.fillStyle=this.background;
  ctx.fillRect(0,0,width,height);

  ctx.beginPath();

  if(this.continuousRescale) {
  	 this.minY = Number.MAX_VALUE;
  	 this.maxY = Number.MIN_VALUE;
  }

  var t0 = 0;
  if(this.overwrite) {
  	t0 = t2 - t2 % (t2 - t1);
  }

  if(true) {
    // draw timestamps
    s1 = s1 || moment(t1).format('HH:mm:ss');
    s2 = s2 || moment(t2).format('HH:mm:ss');
    ctx.font = this.textFont;
    ctx.fillStyle = this.textColor;

    if(this.overwrite) {
      var s0 = moment(t0).format('HH:mm:ss');
      ctx.fillText(s0, 0, height);
    } else {
      ctx.fillText(s1, 0, height);
      var smid = moment(t1+(t2-t1)/2).format('HH:mm:ss');
      ctx.moveTo(width/2, 0);
      for(var i = 0; i < DASHES; i++) {
        if(1==i%2) {
          ctx.lineTo(width/2,((i+1)/DASHES)*(height-this.textFontSize-5));
          ctx.stroke();  
        } else {
          ctx.moveTo(width/2,((i+1)/DASHES)*(height-this.textFontSize-5));
        }
      }
      ctx.fillText(smid, width/2 - ctx.measureText(smid).width / 2, height);
      ctx.fillText(s2, width - ctx.measureText(s2).width, height);
    }
    height -= this.textFontSize + 5; 
  }

  if(this.borderWidth > 0) {
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = PIXEL_RATIO * this.borderWidth;
    ctx.strokeRect(ctx.lineWidth/2,ctx.lineWidth/2,width-ctx.lineWidth,height-ctx.lineWidth);
    width -= 2 * ctx.lineWidth + 4;
    height -= 2 * ctx.lineWidth + 4;
    ctx.translate(ctx.lineWidth+2,ctx.lineWidth+2);
  }



  ctx.lineWidth = PIXEL_RATIO * this.lineWidth;
  ctx.strokeStyle = this.color;
  ctx.fillStyle = this.color;

  var aged_segment = true;
  var started = false;
  var msPerSample = 1000 / this.row.keyValues.frequency;
  var lastTime = null;
  var lastValue = 0;
  var lastX = 0, firstX = Number.NaN;

  for(var i = 0; i < this.row.samples.length; i++) {
  	var sample = this.row.samples[i];
    var sampleTime = sample.sourceTimestamp;
  	for(var j = 0; j < sample.data.values.length; j++) {
  	  var time = sampleTime - msPerSample * (sample.data.values.length - j);
  	  var value = sample.data.values[j];
  	  if(time>=t1&&time<t2) {
  	  	this.minY = Math.min(value, this.minY);
  	  	this.maxY = Math.max(value, this.maxY);
  	  	if(this.maxY == this.minY) {
  	  		this.maxY = this.minY + 0.01;
  	  	}
  	  } else {
        continue;
      }
      var x_prop = -1;
      if(this.overwrite) {
        var split_prop = 1 * (t2 - t0) / (t2 - t1);
        if(time >= t0 && time < t2) {
          // the newer data (left)
          if(aged_segment) {
            aged_segment = false;
            started = false;
          }
          x_prop = 1 * (time - t0) / (t2-t0);
          x_prop *= split_prop;
        } else if(time >= t1 && time < t0) {
          // the older data (right)
          x_prop = 1 * (time - t1) / (t0-t1);
          x_prop *= (1-split_prop);
          if(x_prop < this.gap_size) {
            x_prop = -1;
          } else {
            x_prop += split_prop;
          }
        } else {
          x_prop = -1;
        }
      } else {
        x_prop = 1 * (time - t1) / (t2-t1);
      }
        
      var y_prop = 1 * (value - this.minY) / (this.maxY-this.minY);
      
      var x = x_prop * width;
      var y = height - (y_prop * height);

      if(x_prop>=0&&x_prop<1&&y_prop>=0&&y_prop<1) {

        if(started) {
          lastX = x;
          if(isNaN(firstX)) {
            firstX = x;
          }
          // There is a gap in the data
          // TODO This won't work correctly with fill area!
          if(time > (lastTime + msPerSample+10)) {
            ctx.stroke();
            ctx.moveTo(x,y);
          } else {
            ctx.lineTo(x,y);
          }
        } else {
          if(this.fillArea) {
            ctx.moveTo(x, height - height * ((this.minY>0?this.minY:0) - this.minY) / (this.maxY - this.minY));
            ctx.lineTo(x,y);
          } else {
            ctx.moveTo(x,y);
          }
          started = true;
        }
      }
      lastTime = time;
      lastValue = value;
    }
  }

  if(this.fillArea) {
    ctx.lineTo(lastX, height - height * ((this.minY>0?this.minY:0) - this.minY) / (this.maxY - this.minY));
    ctx.lineTo(firstX, height - height * ((this.minY>0?this.minY:0) - this.minY) / (this.maxY - this.minY));
    ctx.fill();
  } else {
    ctx.stroke();
  }
  ctx.restore();
}

