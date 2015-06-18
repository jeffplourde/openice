---
layout: docs
title: Beaglebone Image Notes
title-sm: Beaglebone Notes
description:
---

Setting up on embedded devices
================
The OpenICE software has been tested on BeagleBone Black and Raspberry Pi.  But *should* run on any ARM device running a recent linux based on kernel 3.x and compiled for the ARM hard-float ABI.  (This in addition to Intel x86 and x86_64 on mac/linux/windows).  These instructions are specific to Debian 7 running on BeagleBone Black hardware; but they could be adapted for virtually any platform with JVM support.

Setting up a BeagleBoneBlack
================

[latest images](http://beagleboard.org/latest-images)

Configure a microsd card with debian on another ubuntu computer
xzcat bone-debian-7.8-lxde-4gb-armhf-2015-03-01-4gb.img.xz | pv | dd of=/dev/sdX bs=1024K

Insert the microsd card into the BBB. Power up and this will boot Debian from the microsd card.

Change USB networking IP address
----
http://ewong.me/changing-usb0-ip-address-on-the-beaglebone-black/

Change debian user password
-----
sudo passwd debian
debian
debian

for consistency you might like to change the helpful hint in /etc/issue and /etc/issue.net

WiFi
----
A lot of wifi adapters are supported out the box.  The ones we use become interface ra1
so this block is helpful to add to 
/etc/network/interfaces

auto ra0
iface ra0 inet dhcp
        wpa-ssid "MDPNP-JSN"
        wpa-psk "********"

Set a hostname
----
echo HOSTNAME > /etc/hostname

save some aggravation and make sure the host name resolves by adding to /etc/hosts
 127.0.0.1    localhost.localdomain localhost
 127.0.1.1    my-machine

REBOOT

Update package information
-----
sudo apt-get update

Install java
-----
http://elinux.org/Beagleboard:BeagleBoneBlack_Debian#Oracle_Java_8

ACPI (power button)
-----
ensure that the ACPId package is installed
sudo apt-get install acpid

unzip
----
now is a good time to install zip
sudo apt-get install unzip

TimeZone
----
To interpret data from devices that do not emit their timezone (most) one should configure the timezone on the ARM device.  
dpkg-reconfigure tzdata

serial port permissions
------
For some reason ttyOx get root/dialout (like an external modem?) Until I figure out how to change default ownership/permissions I've been adding the debian user to the permissioned groups.
sudo usermod -a -G tty debian
sudo usermod -a -G dialout debian

device-adapter service
------
Add the new device to the targets file in the repo
execute buildAndDeploy.sh
Create a device.this file with domain and device information
create /home/debian/log for log files

Time Synchronization
------
Synchronizing time between devices enables a lot of powerful capabilities combined with things like DesinationOrder QoS and Lifespan QoS.
sudo apt-get install ntp
to install ntpd and keep the device in sync.  servers can then be specified in /etc/ntp.conf
we also specify a local NTP server on our lab network with DHCP option 42

enable private key ssh authentication
--------
Copy public key to ~/.ssh/authorized_keys on the beaglebone
Ensure no read/write except for user on ~/.ssh/authorized_keys
On source computer with private key ID_RSA to access beaglebone at BEAGLEADDRESS create an entry in ~/.ssh/config
Host BEAGLEADDRESS
    IdentityFile ~/.ssh/ID_RSA

Disable serial console (getty) on ttyO0
-------
Comment out this line in /etc/inittab
T0:23:respawn:/sbin/getty -L ttyO0 115200 vt102

Comment out this line in /boot/SOC.sh
serial_tty=ttyO0

Ok those were great but this actually does it because it's launched by systemd
sudo systemctl stop serial-getty@ttyO0.service
sudo systemctl mask serial-getty@ttyO0.service

Startech USB31000SPTW support
--------
Download the driver for AX88179
http://www.asix.com.tw/download.php?sub=downloadsearch&PSNoID=112

Install headers for most recent kernel
sudo apt-get install linux-headers-3.8.13-bone71

Extract driver, make, make install

Disable automatic start of window manager
--------
http://superuser.com/questions/781520/disable-gui-on-beaglebone-black-running-debian



Useful Links
-------

Great source of Ubuntu builds
http://www.armhf.com/index.php/download/

Ubuntu Precise
http://www.armhf.com/index.php/boards/beaglebone-black/#precise

Related helpful instructions 
http://www.armhf.com/index.php/getting-started-with-ubuntu-img-file/

DIY instructions for building
http://elinux.org/BeagleBoardUbuntu

beagleboard.org getting started
http://beagleboard.org/Getting%20Started

Archive -- no longer used
-----

cpu governor
----
Under heavy load (stress testing) I've observed hangups due to CPU throttling.  Enabling the 'performance' governor profile helps mitigate the problem.
sudo apt-get install cpufrequtils
sudo cpufreq-set -g performance

That's not a permanent change.  One way to ensure sysfs gets updated every time:
sudo apt-get install sysfsutils
sudo vi /etc/sysfs.conf
Add a line at the end "devices/system/cpu/cpu0/cpufreq/scaling_governor = performance"
move the ondemand script
sudo mv /etc/init.d/ondemand /etc/init.d/ondemand.bak

wifi
----
The latest 12.04.3 build from armhf.com supports the realtek rtl8192cu chipset "out of the box".  we've had success using such adapters with beaglebone black via usb. Ensure the adapter is connected at power-on.  Uncomment relevant wlan0 lines in /etc/network/interfaces.  Execute sudo ifup wlan0 and wait a loong time.  Eventually the adapter will come up!

Empirical power draw
----
In informal testing a beaglebone black using ethernet had an observed maximum current draw of 409 mA.  With the 3" LCD cape the max was 469 mA.  With an RTL8188S wifi dongle the max was 520 mA.  With an RTL8192cu wifi dongle the max was 566 mA.  With a 7" LCD cape the max draw was 1,010 mA.  All at 5V.

RS-232 ttyO1 (if necessary)
------
http://www.armhf.com/index.php/beaglebone-black-serial-uart-device-tree-overlays-for-ubuntu-and-debian-wheezy-tty01-tty02-tty04-tty05-dtbo-files/

Realtime Clock
-------
https://learn.adafruit.com/adding-a-real-time-clock-to-beaglebone-black/overview

similar works for the ds3231
http://blog.lemoneerlabs.com/post/time-y-wimey-stuff


swap space
------
This requires further exploration... but for TRANSIENT_LOCAL durability ResourceLimits will need to be tuned for available memory.  In addition adding some swap space should enable larger writer caches.  
[https://help.ubuntu.com/community/SwapFaq]

backup the contents of the MMC
-------
This is a super useful little image that will copy MMC to an sdcard and then can easily be configured to reverse the process.
[http://elinux.org/BeagleBone_Black_Extracting_eMMC_contents]

enable sudo without entering password
-------
[http://jeromejaglale.com/doc/unix/ubuntu_sudo_without_password]
sudo visudo

Add this line at the end (change “jerome” to your username):
jerome ALL=(ALL) NOPASSWD: ALL