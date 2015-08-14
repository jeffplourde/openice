---
layout: blog
title: Serial Interfaces or&#58; How to Not Make an OpenICE Programmer's Life Miserable
title-sm: Serial Interfaces
author: [Jeff Plourde, Jeff Peterson]
description:
tags: OpenICE serial Device-Adapters
twitter-card-type: summary
twitter-card-image: /assets/
---


Today's medical devices primarily exist in silos controlled by a single manufacturer - patient monitors from vendor A on one network, pumps from vendor B on another, the pattern continues. Occasionally there is a need to integrate data from a device from  manufacturer to an existing system. A common use case is adding an ICU ventilator to an EMR flowsheet. The typical pathway for this integration is through a proprietary adapter to an existing network silo. Most commonly, the lonely to-be-integrated device is connected via a serial port to an adapter that allows the device to contribute it's data to another silo.

To demonstrate the capabilities of a future integrated clinical environment we retrofit devices blah blah serial ports blag blah they suck


Serial comm is the status quo
Retrofit devices with BBB Dev Adapter to convert serial to OpenICE
Serial conversion is a business in itself
Vision is to replace serial or gateway with standard data format


Should we talk about serial export capabilities/feature list?


Today we're going to talk about serial interface design decisions and the ripple effect they can have on integrated clinical systems.




<!--endExcerpt-->

Summary:

1. Decouple your device interface from your display logic.  Most newer devices already do this but one particular device, for example, stops emitting alarm info when it is momentarily hidden on the screen.
1. Give us some useful timestamp information (use a synchronized clock is a separate issue).  Citing example device that emits four sequential samples instantaneously all with an identical timestamp (not impossible but very hard to cope with this)
1. The nonfunctional (QoS) impact of requesting data should be described as part of the interface.  Citing an example device where 4Hz data is emitted at 3.97Hz when a lot of other data is requested.  It is difficult to divine how the interface is degrading unless you built it.
1. Emitting continuously sampled data periodically is much more useful than doing so episodically.  Citing an example device that emits breath information when it's signal processing detects an "end of breath"
1. It's not in the ppt but we could talk at length about the disadvantages of RS-232 substrate (even with overlying protocol tbd) as compared with USB, bluetooth, ethernet, etc.




# Examples of Device Interface Analysis


### Vital Guard Ivy 450C

The data interface is tightly coupled to display logic with profound implications. Examples…
Pulse rate from pulse oximetry is only available when SpO2 C-Lock is disabled because the indicator for C-Lock replaces the PR value on the display.
Ongoing alarms are entirely *omitted* from the data interface when they have been silenced.
There is no flag indicating whether respiration is from transthoracic impedance of capnography.
“0” is used for absent value (sensor off)



### Philips Intellivue Monitors

There are generally ~4 waveform messages per second per sensor.
All four messages are delivered at the end of each interval (~1 second) and each is assigned an identical timestamp.
It is very difficult to discern an appropriate wall clock time for these data.  (This is necessary to compare contemporaneously from various devices and hospital systems and to perform signal analysis)




### Dräger V500 Ventilator

The observed sampling interval does not match spec when the interface is simultaneously used to acquire other data.
Making the data less useful for signal processing.
Indicates use of separate interface ports for waveform and other data; though this is not described in manufacturer specification.
Behavior is model (and perhaps software rev) specific.

Distribution of intervals (milliseconds) between waveform data when accessing waveform data only.
The interval is *very* regular at 250ms

GRAPH

<div id="graph-wo-slow-data"></div>


Interval (milliseconds) between waveform data when accessing waveform and continuously requesting other data.
The interval is irregular; worse the mean interval changes to 250.2ms

GRAPH
<div id="graph-w-slow-data"></div>



### Puritan Bennett 840 Ventilator

WE SHOULD PUT A GIF HERE

Emits waveform data only at the end of a breath cycle
Not appropriate for realtime closed loop since no data is received until the entire breath cycle completes.
Upper limit on the number of data points that can be collected for a single breath.
Non-uniform (with gaps) data collection not appropriate for many types of signal processing.



<style type="text/css">
    .bar {
        fill: #3071a9;
    }
    .bar:hover {
        fill: #900;
    }
    .label {
        font-size: 1em;
        display: none;
    }
    .bar:hover + .label {
        display: inline;
    }
    .axis {
        font: 10px sans-serif;
    }
    .axis path,
    .axis line {
        fill: none;
        stroke: #000;
        shape-rendering: crispEdges;
    }
    .x.axis path {
        display: none;
    }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
<script type="text/javascript">

function graphStuff (dataUrl, containerID) {

    elementWidth = document.getElementById(containerID).offsetWidth;

    var margin = { top: 20, right: 55, bottom: 30, left: 55 };
    var width  = elementWidth - margin.left - margin.right;
    var height = 450  - margin.top  - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .rangeRound([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("#" + containerID)
        .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
        .attr("class", "chart")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv(dataUrl, function (err, data) {
        if(err) {
            console.warn(err);
        } else {
            data.forEach(function (d) {
                d.Count = +d.Count;
            });
            
            console.log(data);

            x.domain(data.map(function(d) { return d.Interval; }));
            y.domain([0, d3.max(data, function (d) { return d.Count; })]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Samples");

            var bar = svg.selectAll(".bar")
                .data(data)
              .enter().append("g");

            bar.append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.Interval); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.Count); })
                .attr("height", function(d) { return height - y(d.Count); });

            bar.append("text")
                .attr("class", "label")
                .attr("x", function(d) { return x(d.Interval); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.Count); })
                .attr("height", function(d) { return height - y(d.Count); })
                .attr("dx", x.rangeBand() / 2)
                .attr("dy", "-0.25em")
                .style("text-anchor", "middle")
                .text(function (d) { return d.Count; });
        }
    });  
}
graphStuff('{{ site.url }}/assets/blog/serial-v500-wo-slow-data.csv', 'graph-wo-slow-data');
graphStuff('{{ site.url }}/assets/blog/serial-v500-w-slow-data.csv', 'graph-w-slow-data');

</script>
