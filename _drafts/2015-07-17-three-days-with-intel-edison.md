---
layout: blog
title: First Three Days with Intel Edison
title-sm: First Days with Edison
author: Jeff Plourde
tags: space separated string
---


<img alt="Intel Edison" src="{{ site.url }}/assets/inteledison.jpg" style="max-width:100%;">

(To jump ahead to the incantations we used to configure Edison click [here](#details))

Recently the [OpenICE](https://www.openice.info) lab had the opportunity to begin exploration with Intel's latest platform offering: [Edison](https://www-ssl.intel.com/content/www/us/en/do-it-yourself/edison.html).  Our experience in the lab with prototyping platforms like [BeagleBone Black](http://beagleboard.org/black) and [Raspberry Pi](https://www.raspberrypi.org) has raised our expectations for ease-of-use for a new platform.  Our previous experimentation with the [Intel Galileo](https://www-ssl.intel.com/content/www/us/en/do-it-yourself/galileo-maker-quark-board.html) left us skeptical.  Things like a 3.5mm stereo connector for serial console access were merely peculiar.  But what halted that experimentation was a lack of SIMD instructions in the [Quark microcontroller](https://en.wikipedia.org/wiki/Intel_Quark) (which would have required a recompile of a number of key libraries we use).  The experience with the Edison couldn't have been any more different.  <!--endExcerpt-->Within a few hours we were up and running our Java software with a variety of libraries compiled for x86 Linux.  A few hours after that we had connected a number of medical devices, with interfaces ranging from RS-232 to Bluetooth EDR, to OpenICE using the Intel Edison as an adapter.

<img alt="Intel Edison Wearable Platform" src="{{ site.url }}/assets/edison-cover.jpg" style="max-width:100%;">


David Hunt has performed some interesting benchmark tests [comparing Intel Edison performance](http://www.davidhunt.ie/raspberry-pi-beaglebone-black-intel-edison-benchmarked/) with BeagleBone Black and Raspberry Pi.  Initial indications are that the Edison is an outstanding performer among the set of remarkably small general purpose computers.  The Edison won't be replacing your laptop anytime soon but it does have WiFi and Bluetooth aboard; making it almost shocking that the latest BeagleBone Black and Raspberry Pi do not.  Empirical measurements of the power consumption of Edison are still hard to come by so we did some measurements on our own.  
<img alt="Inline Ammeter" src="{{ site.url }}/assets/testing-inline.jpg" style="max-width:100%;">

We also measured consumption under similar load for a BeagleBone Black C.  The comparison is a little unfair because we used the BeagleBone's built-in ethernet connectivity (vs. WiFi on the Edison) and the BeagleBone is driving a lot more ICs in addition to a more robust default software suite.  

<img alt="Intel Edison with ammeter" src="{{ site.url }}/assets/edison-ammeter.jpg" style="max-width:100%;">

That said the results were dramatic enough to warrant sharing.  The Edison sipped power even with the WiFi radio continuously active.  With a maximum observed draw of 176 mA the unit we tested never exceed 1 Watt.  The implications for battery life could really be remarkable and we look forward to doing some empirical "real world" run-down tests in the lab in the future.

<div id="charts">
</div>

Platforms like Edison demonstrate a bright future not only for wearable and pervasive sensing technologies but also demonstrate the ease with which Medical Device Manufacturers can (and should) adapt next-generation sensor data emission to help create a robust data ecosystem around each patient.  One goal of our work in the lab is to connect data from the [SparkFun 9 Degrees of Freedom Block for Edison](https://www.sparkfun.com/products/13033) to the OpenICE system as an exemplar for the integration of other devices.  This will allow us to better understand the implications of Edison as part of the OpenICE architecture.

### <span id="details">__Technical Details for Configuring an Edison__</span> ###

The primary landing page for Intel Edison can be found [here](https://software.intel.com/en-us/iot/hardware/edison).

__Installing the latest Yocto Linux Image__

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

<ul><img alt="Intel Edison with USB/RS-232 adapter" src="{{ site.url }}/assets/edison-serial.jpg" style="max-width:100%;"></ul>

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

__libmraa__ ??? should we move this or elaborate more?

Intel's Low Level Skeleton Library for IO Communication on GNU/Linux platforms can be found [here](https://github.com/intel-iot-devkit/mraa).

An example Python application that interacts with the [SparkFun 9 Degrees of Freedom Block for Edison](https://www.sparkfun.com/products/13033) can be found [here](https://github.com/smoyerman/9dofBlock).  You can monitor our progress on a Java equivalent to that example [here](https://github.com/jeffplourde/9dofBlockJava).


<style>

.chart {
    
}

.chart text {
  fill: white;
  font: 10px sans-serif;
  text-anchor: middle;
}

.chart rect {
    fill: steelblue;
}

.axis text {
  font: 10px sans-serif;
}

#charts {
    /*height: 500px;*/
}

.axis path,
.axis line {
  fill: none;
  stroke: #000;
  shape-rendering: crispEdges;
}

</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>




<script>
var barWidth = 40,
    height = 300;


d3.json('{{ site.url }}/assets/intel-edison-power-consumption.json', function(err, data) {
    if(err) {
        console.warn(err);
    } else {
        for(var i = 0; i < data.length; i++) {
            var y = d3.scale.linear().range([height,0]);
            var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");
            y.domain([0, 500]);
            var chart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            chart.setAttribute('class', "chart");
            chart.setAttribute('id', "chart"+i);
            document.getElementById("charts")
                .appendChild(chart);
            chart = d3.select("#chart"+i).attr("height", height);    
            chart.attr("width", barWidth * data.length);
            chart.append("text")
              .attr("x", 0 /*(barWidth * data.length / 2)*/)
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "start")
              .style("fill", "black")
              .text(data[i].name);

            var bar = d3.select("#chart"+i)
                .selectAll("g")
                .data([data[i].bbb.avg, data[i].edison.avg])
                .enter().append("g")
                    .attr('transform', function(d, i) { 
                        var s = "translate(" + i * barWidth + ",0)";
                        return s; 

                    });

            bar.append("rect")
                .attr("y", function(d) { return y(d); })
                .attr("width", barWidth-1)
                .attr("height", function(d) { return height - y(d);});

            bar.append("text")
                .style("text-anchor", "middle")
                .attr("x", barWidth / 2)
                .attr("y", function(d) { return y(d) + 3;})
                .attr("dy", ".75em")
                .text(function(d) { return ""+d; });              
        }

        

        // chart.append("g")
        //     .attr("class", "y axis")
        //     .call(yAxis);


    }
});

</script>

