var moment = require('moment');


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
  this.textFont = args.textFont || "8pt Arial";
  Object.defineProperty(this, "textFontSize", {
    get: function() {
      return this.__textFontSize;
    }
  });
  this.lineWidth = args.lineWidth || 1;
}

module.exports = exports = Renderer;

Renderer.prototype.render = function(t1, t2, s1, s2) {
  if(!isElementInViewport(this.canvas)) {
    return;
  }
  var ctx = this.canvas.getContext("2d");
  ctx.lineWidth = this.lineWidth;
  ctx.strokeStyle = this.color;
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
      ctx.fillText(s2, width - ctx.measureText(s2).width, height);
    }
    height -= this.textFontSize + 5; 
  }

  var aged_segment = true;
  var started = false;
  var msPerSample = 1000 / this.row.keyValues.frequency;
  var lastTime = null;

  for(var i = 0; i < this.row.samples.length; i++) {
  	var sample = this.row.samples[i];
    var sampleTime = Date.parse(sample.sourceTimestamp);
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
          if(time > (lastTime + msPerSample+10)) {
            ctx.stroke();
            ctx.moveTo(x,y);
          } else {
            ctx.lineTo(x,y);
          }
        } else {
          ctx.moveTo(x,y);
          started = true;
        }
      }
      lastTime = time;
    }
  }
  // ctx.closePath();
  ctx.stroke();
}

