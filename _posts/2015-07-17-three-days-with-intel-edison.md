---
layout: generic-page
title: First Three Days with Intel Edison
title-sm: 
description: 
---

{{ page.title }}
================

__Background__

Recently the [OpenICE](https://www.openice.info) lab had the opportunity to begin exploration with Intel's latest platform offering: [Edison](https://www-ssl.intel.com/content/www/us/en/do-it-yourself/edison.html).  Our experience in the lab with prototyping platforms like [BeagleBone Black](http://beagleboard.org/black) and [Raspberry Pi](https://www.raspberrypi.org) has raised our expectations for ease-of-use for a new platform.  Our previous experimentation with the [Intel Galileo](https://www-ssl.intel.com/content/www/us/en/do-it-yourself/galileo-maker-quark-board.html) left us skeptical.  Things like a 3.5mm stereo connector for serial console access were merely peculiar.  But what halted that experimentation was a lack of SIMD instructions in the [Quark microcontroller](https://en.wikipedia.org/wiki/Intel_Quark) (which would have required a recompile of a number of key libraries we use).  The experience with the Edison couldn't have been any more different.  Within a few hours we were up and running our Java software with a variety of libraries compiled for x86 Linux.  A few hours after that we had connected a number of medical devices, with interfaces ranging from RS-232 to Bluetooth EDR, to OpenICE using the Intel Edison as an adapter.

__Performance__

David Hunt has performed some interesting benchmark tests [comparing Intel Edison performance](http://www.davidhunt.ie/raspberry-pi-beaglebone-black-intel-edison-benchmarked/) with BeagleBone Black and Raspberry Pi.  Initial indications are that the Edison is an outstanding performer among the set of remarkably small general purpose computers.  The Edison lacks a GPU so it won't be replacing your laptop anytime soon but it does have WiFi and Bluetooth aboard; making it almost shocking that BeagleBone and Raspberry Pi do not.  TODO POWER CONSUMPTION?

__Future__

Platforms like Edison demonstrate a bright future not only for wearable and pervasive sensing technologies but also demonstrate the ease with which Medical Device Manufacturers can (and should) adapt next-generation sensor data emission to help create a robust data ecosystem around each patient.

Technical Detail
----------------

The primary landing page for Intel Edison can be found [here](https://software.intel.com/en-us/iot/hardware/edison).

__Installing the latest Yocto Linux Image__

1.  Our first stop was the [Downloads](https://software.intel.com/en-us/iot/hardware/edison/downloads) page where we downloaded the latest Yocto complete image (Release 2.1 at the time) and the "Flash Tool Lite" for Mac OS X. 
1.  Next week followed the [setup guide](https://software.intel.com/en-us/articles/flash-tool-lite-user-manual) instructions.  Scroll far enough down the page and you'll find a section devoted to Mac OS X.
1.  In our experience we found it more reliable to first extract the zip file container of the Yocto image and select the FlashEdison.json configuration directly from the extracted contents.
1.  It was also important to set the "Configuration" dropdown to "CDC" for Linux or OS X.
1.  Counter-intuitively the instructions also asked us to click "Start to flash" before connecting the device.
1.  The [SparkFun Base Block](https://www.sparkfun.com/products/13045) we used required connection to the "OTG" port.
1.  Also since our Base Block did not have an information LED we waited 2 minutes after flashing before disconnecting to reboot the Edison.

__Access the Edison console__

1.  We connected the Edison via the "Console" port on our SparkFun Base Block.
1.  A serial-over-USB device appeared in our mac as  `/dev/tty.usbserial-NNNNNNNN`
1.  Access the terminal using gnu screen `screen /dev/tty.usbserial-NNNNNNNN 115200`
1.  A few presses of the enter key will show a login screen.  Login as "root".  There is initially no password configured.

__Change device name, change password, and connect wifi__

1. `configure_edison --setup` launches an interactive setup 

__Installing the latest Java JRE__

1.  As the Edison houses a full Atom processor any standard JRE for x86 Linux can be used.  We used the latest from [Oracle](http://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html).  We downloaded locally to our mac then used secure copy to move the file to the edison.  The previous interactive setup revealed the IP assigned the edison by DHCP. `scp ~/Downloads/jre-8u51-linux-i586.tar.gz root@192.168.1.10:`
2.  For convenience we extracted the JRE to /usr/local, set JAVA_HOME, and linked the java executable to /usr/local/bin

        mkdir -p /usr/local
        cd /usr/local
        tar xzf jre-8u51-linux-i586.tar.gz
        export JAVA_HOME=/usr/local/jre1.8.0_51
        mkdir -p /usr/local/bin
        cd /usr/local/bin
        ln -s $JAVA_HOME/bin/java

__Installing OpenICE software__

1.  Visit the latest OpenICE release [on GitHub](https://github.com/mdpnp/mdpnp/releases/latest)
1.  At this time 0.6.3 is the latest release; we downloaded the zipped version of the release to the Edison board with wget

        wget https://github.com/mdpnp/mdpnp/releases/download/0.6.3/OpenICE-0.6.3.zip

1.  We extracted the OpenICE software and ran a software simulator as follows.

        unzip OpenICE-0.6.3.zip
        cd OpenICE-0.6.3
        bin/OpenICE -app ICE_Device_Interface -device Multiparameter -domain 15


 TODO RS-232 via FTDI
 TODO Bluetooth (Nonin)
 TODO MRAA https://github.com/jeffplourde/9dofBlockJava

