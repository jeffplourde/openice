---
layout: blog
title: First Three Days with Intel Edison
title-sm: First Days with Edison
author: Jeff Plourde, Jeff Peterson
description: When the OpenICE team recently had an opportunity to begin exploration with Edison we weren't sure what to expect. Edison met our expectations and did so in a remarkably small form factor.
tags: Edison OpenICE
twitter-card-type: summary_large_image
twitter-card-image: /assets/blog/edison-cover.jpg
---
<img alt="Intel Edison" src="{{ site.url }}/assets/blog/inteledison.jpg" style="max-width:100%;">

When the [OpenICE](https://www.openice.info) team recently had an opportunity to begin exploration with [Edison](https://www-ssl.intel.com/content/www/us/en/do-it-yourself/edison.html) we weren't sure what to expect.  [Maker](https://en.wikipedia.org/wiki/Maker_culture) platforms like [BeagleBone Black](http://beagleboard.org/black) and [Raspberry Pi](https://www.raspberrypi.org) have set lofty expectations of ease-of-use for a new platform.  Edison met our expectations and did so in a remarkably small form factor that significantly narrows the gap between lab experiment and product design.  <!--endExcerpt-->Within a few hours we were up and running our Java software with a variety of libraries compiled for x86 Linux.  A few hours after that we had connected a number of medical devices, with interfaces ranging from RS-232 to Bluetooth EDR, to OpenICE using the Intel Edison as an adapter.

<!-- Unnecessary level of detail
Our previous experimentation with the [Intel Galileo](https://www-ssl.intel.com/content/www/us/en/do-it-yourself/galileo-maker-quark-board.html) left us wanting a whole lot more from the world's dominant chip maker.  Things like a 3.5mm stereo connector for serial console access were merely peculiar but what halted that experimentation was a lack of SIMD instructions in the [Quark microcontroller](https://en.wikipedia.org/wiki/Intel_Quark) (which would have required a recompile of a number of key libraries we use).
-->
<img alt="Intel Edison Wearable Platform" src="{{ site.url }}/assets/blog/edison-cover.jpg" style="max-width:100%;">

<!-- This doesn't work in the excerpt so I moved it down -->
([Jump ahead](#details) to configure OpenICE on Intel Edison)

David Hunt has performed some interesting benchmark tests [comparing Intel Edison performance](http://www.davidhunt.ie/raspberry-pi-beaglebone-black-intel-edison-benchmarked/) with BeagleBone Black and Raspberry Pi.  Initial indications are that the Edison is an outstanding performer among the set of remarkably small general purpose computers.  The Edison won't replace your laptop anytime soon but it does have WiFi and Bluetooth aboard; making it almost shocking that the latest BeagleBone Black and Raspberry Pi do not.  Empirical measurements of the power consumption of Edison are still hard to come by so we did some measurements on our own.  For reference we also measured consumption under similar load for a BeagleBone Black Rev-C.  The comparison is apples to oranges for a variety of reasons, however, the results were dramatic enough to warrant sharing.  The **Edison sipped power** even with the WiFi radio continuously active.  With a maximum observed draw of 176 mA the unit we tested never exceeded 1 Watt of power consumption.  The implications for battery life will be remarkable. The current measurement results convinced us to also conduct an empirical "real world" run-down test of the Edison on battery power. The results are [below](#battery).

<img alt="Intel Edison with ammeter" src="{{ site.url }}/assets/blog/edison-ammeter-inline.jpg" style="max-width:100%;">

We measured current drawn by BeagleBone Black and Edison in 100 samples over the course of 20 seconds in three scenarios.  First we conducted a baseline test merely connected to each device with an ssh session.  Next we downloaded a large file from the internet with wget.  And last we ran an OpenICE software simulator of a multiparameter phsyiological monitor.  One would expect the Edison to be at a power consumption disadvantage using wireless connectivity but that was definitely not the case.  In every scenario the Edison performed the task with facility and drawing a fraction of the power of the BeagleBone Black.

<div id="charts">
</div>
** NOTE:100 samples in 20 seconds, bar represents mean with whiskers at min and max

<a name="battery" id="battery"></a>
To test the Edison battery life, we attached it to the modular [battery block](https://www.sparkfun.com/products/13037) from SparkFun. The block provides power to the Edison from a small, 400mAh single cell LiPo battery. The Edison was setup using the detailed instructions below. During the test, the Edison was running an OpenICE simulated multiparameter patient monitor [Device-Adapter](https://www.openice.info/docs/4_device-adapter-setup.html). The simulated patient monitor sent simulated real-time vital signs data and waveforms to the lab's OpenICE network via WiFi. For those following along at home, enter `root@edison:~# ./OpenICE-0.6.3/bin/OpenICE -app ICE_Device_Interface -device Multiparameter -domain 15 &`.

The Edison was also running a script to log power levels and timestamps. The Edison Poky image comes with a neat command line utility called `battery-voltage` which outputs the following:

    root@edison:~# battery-voltage
    Battery Voltage = 4200 mV
    Battery level = 100%

The following bash script was used to log the battery info and a time stamp every 10 seconds producing a CSV with the format `Battery Voltage = 4200 mV,Battery level = 100%,Wed Jul 22 16:11:50 UTC 2015`. `sed` was used to clean the csv for easy graphing.

{% highlight bash linenos%}
#!/bin/bash
while true
do
        v=$(battery-voltage | tr "\n" ",")
        d=$(date)
        echo $v$d >> powerTest.log
        sleep 10
done
{% endhighlight %}

The Edison - with it's x86 architecture, WiFi, 400mAh battery, Linux file system, logging script and OpenICE simulated patient monitor - ran for **3:45:14** before battery exhaustion.

<img alt="Intel Edison Battery Run-Down" src="{{ site.url }}/assets/blog/edison-battery-graph.png" style="max-width:100%;max-height:500px;">

This test shows huge promise for the platform. It is impressive that the relatively small battery (it's small enough to hide in the watch cases above) still provides 3.75 hours of power to the system running a full patient monitor simulation via WiFi. Using a beefier battery and configuring a more conservative software setup, the battery figures could be extended dramatically - not to mention Intel's potential future optimization of the young Edison platform.  Platforms like Edison demonstrate a bright future not only for wearable and pervasive sensing technologies but also demonstrate the ease with which Medical Device Manufacturers can (and should) adopt next-generation sensor data emission to help create a robust IoT data ecosystem around each patient to improve safety and outcomes.  

<!-- Irrelevant
One future goal of the lab is to connect data from the [SparkFun 9 Degrees of Freedom Block for Edison](https://www.sparkfun.com/products/13033) to the OpenICE system as an exemplar for the integration of other new sensing devices.  This will allow us to better understand the implications of Edison as part of the OpenICE architecture.
-->

<a name="details" id="details"></a>

### Technical Details for Configuring an Edison ###

The primary landing page for Intel Edison can be found [here](https://software.intel.com/en-us/iot/hardware/edison).

__Installing the latest Yocto Linux Image using a Mac__

1.  Our first stop was the [Downloads](https://software.intel.com/en-us/iot/hardware/edison/downloads) page where we downloaded the latest Yocto complete image (Release 2.1 at the time) and the "Flash Tool Lite" for Mac OS X. 
1.  Next week followed the [setup guide](https://software.intel.com/en-us/articles/flash-tool-lite-user-manual) instructions.  Scroll far enough down the page and you'll find a section devoted to Mac OS X. Please read all of the following tips before following the instructions on the Intel setup guide:
    *  In our experience we found it more reliable to first extract the zip file container of the Yocto image and select the FlashEdison.json configuration directly from the extracted contents.
    *  In the Flash Tool Lite, it was also important to set the "Configuration" dropdown to "CDC" for Linux or OS X.
    *  Counter-intuitively, the instructions also asked us to click "Start to flash" before connecting the device.
    *  The [SparkFun Base Block](https://www.sparkfun.com/products/13045) we used required the USB connection to the "OTG" port.
    *  Also since our Base Block did not have an information LED we waited 2 minutes after flashing was complete before disconnecting to reboot the Edison.
1.  When Flash Tool Lite has finished flashing and an additional two minutes has passed, unplug the Edison, move the USB to the console port and continue to the next step.

__Access the Edison console__

1.  We connected the Edison via the "Console" port on our SparkFun Base Block.
1.  A serial-over-USB device appeared in our mac as  `/dev/tty.usbserial-NNNNNNNN`
1.  Access the terminal using gnu screen `screen /dev/tty.usbserial-NNNNNNNN 115200`
1.  A few presses of the enter key will show a login screen.  Login as "root".  There is initially no password configured.

__Change device name, change password, and connect wifi__

1. Enter `configure_edison --setup` on the console to launch an interactive setup. Follow the prompts to set a password, hostname, WiFi SSID and password.

__Installing the latest Java JRE__

1.  As the Edison houses a full Atom processor any standard JRE for x86 Linux can be used.  We used the latest from [Oracle](http://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html).  We downloaded locally to our mac then used secure copy to move the file to the edison.  The previous interactive setup revealed the IP assigned the edison by DHCP - be sure to use it in the following command.

    `scp ~/Downloads/jre-8u51-linux-i586.tar.gz root@192.168.1.10:`

2.  For convenience we extracted the JRE to /usr/local, set JAVA_HOME, and linked the java executable to /usr/local/bin

        mkdir -p /usr/local
        cd /usr/local
        tar xzf ~/jre-8u51-linux-i586.tar.gz
        export JAVA_HOME=/usr/local/jre1.8.0_51
        mkdir -p /usr/local/bin
        cd /usr/local/bin
        ln -s $JAVA_HOME/bin/java

__Installing OpenICE software__

1.  Visit the latest OpenICE release [on GitHub](https://github.com/mdpnp/mdpnp/releases/latest)
1.  The current version of OpenICE is {{ site.openice-version }}; we downloaded the zipped version of the release to the Edison board with wget

        wget https://github.com/mdpnp/mdpnp/releases/download/{{ site.openice-version }}/OpenICE-{{ site.openice-version }}.zip

1.  We extracted the OpenICE software and ran a software simulator as follows.

        unzip OpenICE-{{ site.openice-version }}.zip
        cd OpenICE-{{ site.openice-version }}
        chmod a+x bin/OpenICE
        bin/OpenICE -app ICE_Device_Interface -device Multiparameter -domain 15

__Connecting RS-232 devices__

<ul><img alt="Intel Edison with USB/RS-232 adapter" src="{{ site.url }}/assets/blog/edison-serial.jpg" style="max-width:100%;"></ul>

1.  Connect a USB "on the go" cable that provides a USB Type A host port to the OTG port on the SparkFun Base Block.
1.  Connect a USB-to-Serial adapter to that cable.  We tested with an FTDI-based adapter.  Specifically the StarTech ICUSB232D.
1.  Run the OpenICE software specifying the correct device type and serial-over-USB port.  We tested with the Capnostream20 device.

        bin/OpenICE -app ICE_Device_Interface -device Capnostream20 -domain 15 -address ttyUSB0

__Connecting Bluetooth devices__

Basic instructions from Intel can be found [here](https://software.intel.com/en-us/articles/intel-edison-board-getting-started-with-bluetooth). Unfortunately, it appears that this pairing process has to be repeated each time the device is restarted.

1.  Activate a Bluetooth device in discoverable mode.  We tested with a Nonin Onyx II pulse oximeter which uses legacy Bluetooth pairing. The Nonin pulse oximeter powers on and becomes discoverable when a finger is inserted.
1.  Unblock bluetooth capabilities. `rfkill unblock bluetooth`
1.  Start an interactive bluetooth control console and issue the following commands. `bluetoothctl`
    1.  `devices` (check to see if the device you are attempting to connect was previously paired, if so remove)
    1.  `remove <device id>` (in case the device had been previously discovered)
    1.  `agent KeyboardDisplay`
    1.  `default-agent`
    1.  `scan on`
    1.  What until the device is discovered and note the address of the device
    1.  `scan off`
    1.  `pair <device id>`
    1.  When prompted enter pairing code
    1.  `trust <device id>` (trust this device for future connections)
    1.  `exit` (leave bluetoothctl)
1.  `rfcomm bind /dev/rfcomm0 <device id>` will set up a serial port through which the bluetooth device can be accessed.
1. Launch an OpenICE Device Interface

        bin/OpenICE -app ICE_Device_Interface -device Nonin -domain 15 -address rfcomm0

<br>
Edison is a promising platform we're excited develop on and use with OpenICE. To learn more about OpenICE, check out our [intro docs]({{ site.url}}/docs/1_overview.html).

<style>
.chart text {
  fill: white;
  text-anchor: middle;
}

.chart rect {
    fill: steelblue;
    stroke: none;
}

rect text {
    font: 10px sans-serif;
}

.axis path,
.axis line {
  fill: none;
  stroke: #000;
  shape-rendering: crispEdges;
}

.axis text {
    fill: black;
}

</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>

<script>
var margin = {top: 30, right: 30, bottom: 70, left: 50};
var barWidth = 100,
    height = 400 - margin.top - margin.bottom;



d3.json('{{ site.url }}/assets/blog/intel-edison-power-consumption.json', function(err, data) {
    if(err) {
        console.warn(err);
    } else {
        for(var i = 0; i < data.length; i++) {

            var y = d3.scale.linear().domain([0,550]).range([height+margin.top,0+margin.top]);
            var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

            var svg = d3.select("#charts").append("svg")
                .attr("width", barWidth * 2 + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("class", "chart")
                .attr("id", "chart"+i)
                .append("g")
                .attr("transform", "translate("+margin.left+","+margin.top+")");

            svg.append("text")
              .attr("x", 0)
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "start")
              .style("fill", "black")
              .text(data[i].name);

            var bar = svg
                .selectAll("g")
                .data([data[i].bbb, data[i].edison])
                .enter().append("g")
                    .attr('transform', function(d, i) { 
                        var s = "translate(" + (2+ i * barWidth) + ","+margin.top+")";
                        return s; 

                    });

            bar.append("rect")
                .attr("y", function(d) { return y(d.avg) - margin.top; })
                .attr("x", barWidth/4)
                .attr("width", barWidth/2)
                .attr("height", function(d) { return margin.top+height - y(d.avg);});
            bar.append("line")
                .style("stroke", "black")
                .attr("y1", function(d) { return y(d.max) - margin.top; })
                .attr("x1", barWidth/4)
                .attr("y2", function(d) { return y(d.max) - margin.top; })
                .attr("x2", barWidth/4+barWidth/2);

            bar.append("line")
                .style("stroke", "black")
                .attr("y1", function(d) { return y(d.min) - margin.top; })
                .attr("x1", barWidth/4)
                .attr("y2", function(d) { return y(d.min) - margin.top; })
                .attr("x2", barWidth/4+barWidth/2);                

            bar.append("line")
                .style("stroke", "black")
                .attr("y1", function(d) { return y(d.min) - margin.top; })
                .attr("x1", barWidth/2)
                .attr("y2", function(d) { return y(d.max) - margin.top; })
                .attr("x2", barWidth/2);                     
        
            bar.append("text")
                .style("text-anchor", "middle")
                .style("fill", "black")
                .attr("x", barWidth / 2)
                .attr("y", height + 4)
                .attr("dy", ".75em")
                .text(function(d,i) {
                    if(i == 0) { 
                        return "Beaglebone";
                    } else {
                        return "Edison";
                    }
                });

            svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                .append("text")
                    .attr("x", -height/2-margin.top)
                    .attr("y", -50)
                    .attr("dy", ".71em")
                    .attr("transform", "rotate(-90)")
                    .style("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("fill", "black")
                    .text("mA");
        }
    }
});

</script>

