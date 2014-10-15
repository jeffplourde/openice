var OpenICE = require('./openice.js');
var Renderer = require('./plot.js');
var complex_array  = require('./complex_array.js');
var jsfft = require('./fft.js');
var dsp = require('./dsp.js');

var alldata = [];
var renderer1, renderer2;

var metric_id_filter = 'MDC_PRESS_BLD';
var instance_id_filter = 1; 
var udi_filter;

var N = 1024;
var wdw = new dsp.WindowFunction(dsp.DSP.HANN, 1);
var filter;
// var arr = new complex_array.ComplexArray(N);
var arr;

window.addEventListener('load', function(e) {
	var openICE = new OpenICE('http://dev.openice.info');
	var table = openICE.createTable({partition:["MDPNP|004"], domain:15, topic:'SampleArray'});
	table.on('sample', function(evt) {

		var table = evt.table;
		var row = evt.row;
		var sample = evt.sample;

		if(row.keyValues.metric_id==metric_id_filter) { 
			if(!udi_filter) {
				document.getElementById("metric").innerHTML = metric_id_filter;
				arr = new dsp.FFT(2*N, row.keyValues.frequency);
				for(var i = 0; i < N; i++) {
					alldata.push(0);
				}
				// instance_id_filter = row.keyValues.instance_id;
				udi_filter = row.keyValues.unique_device_identifier;
				// console.log("I MAKE A NEW RENDERER NOW");
				renderer1 = new Renderer({canvas:document.getElementById("canvas1"), 
				    data:alldata, 
				    textColor:"#FFFFFF",
				    continuousRescale:false, 
				    gap_size:100});
				renderer2 = new Renderer({canvas:document.getElementById("canvas2"), 
				    data:arr.spectrum, 
				    textColor:"#FFFFFF",
				    continuousRescale:false, 
				    gap_size:100});
				renderer3 = new Renderer({canvas:document.getElementById("canvas3"), 
				    data:arr, 
				    textColor:"#FFFFFF",
				    continuousRescale:false, 
				    gap_size:100});
			}
			if(row.keyValues.unique_device_identifier == udi_filter && 
				row.keyValues.instance_id == instance_id_filter) {

				// console.log(sample.data.values);
				for(var i = 0; i < sample.data.values.length; i++) {
					alldata.push(sample.data.values[i]);
				}
				while(alldata.length > N) {
					alldata.shift();
				}
				var mydata = alldata.slice();
				renderer3.dataMap = new Renderer.ArrayMapper(mydata);

				//new dsp.IIRFilter(dsp.DSP.LOWPASS, 10/60, 0, row.keyValues.frequency).process(mydata);
				//new dsp.IIRFilter(dsp.DSP.HIPASS, 300/60, 0, row.keyValues.frequency).process(mydata);
				wdw.process(mydata);				
				for(var i = 0; i < N; i++) {
					mydata.push(0);
				}

				// arr.map(function(value, i, n) {
				// 	value.real = alldata[i];
				// 	value.imag = 0;
				// });	
				renderer1.render(0, N, "0", N);
				renderer3.render(0, N, "0", N);
				// var frequencies = arr.FFT();

				arr.forward(mydata);
				// console.log(arr);
				var peakBand = 0, peakBandAmp = 0;
				var low = 5, high = 300;
				for(var i = 5; i < arr.spectrum.length; i++) {
					var freq = 60 * arr.getBandFrequency(i);

					if(freq >= low && freq <= high && arr.spectrum[i] > peakBandAmp) {
						peakBand = i;
						peakBandAmp = arr.spectrum[i];
					}
				}
				console.log(peakBand + " " +arr.getBandFrequency(peakBand) + " " + (60*arr.getBandFrequency(peakBand)));
				document.getElementById("data").innerHTML = "Peak Frequency:"+(60*arr.getBandFrequency(peakBand));
				
				// arr.map(function(freq, i, n) {
	 		// 		if (i > n/20 && i < 19*n/20) {
	 		// 		// if(i!=6) {
    //          			freq.real = 0
    //          			freq.imag = 0
    //        			} else {
    //        				console.log(i+",real="+freq.real+",imag="+freq.imag);
    //        			}
    //      		});
         		// renderer3.render(0, N, "0", N);
         		// arr.InvFFT();

         		//renderer2.minY = renderer1.minY;
         		//renderer2.maxY = renderer2.maxY;
				//document.getElementById("data").innerHTML = frequencies;
				//document.getElementById("data").innerHTML = alldata;
				// console.log("i plot you");
				renderer2.render(0, N, "0", N);

			}
		}

		
	});
});