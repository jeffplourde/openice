
function isElementInViewport (el) {

    //special bonus for those using jQuery
    if (el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

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
}

module.exports = exports = Renderer;

Renderer.prototype.render = function(t1, t2) {
  if(!isElementInViewport(this.canvas)) {
    return;
  }
  var ctx = this.canvas.getContext("2d");
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

  var aged_segment = true;
  var started = false;

  for(var i = 0; i < this.row.samples.length; i++) {
  	var sample = this.row.samples[i];
  	for(var j = 0; j < sample.data.values.length; j++) {
  	  var time = Date.parse(sample.sourceTimestamp) - (1000 / this.row.keyValues.frequency) * (sample.data.values.length - j);
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
          ctx.lineTo(x,y);
        } else {
          ctx.moveTo(x,y);
          started = true;
        }
      }
    }
  }
  // ctx.closePath();
  ctx.stroke();
}

