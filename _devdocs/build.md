---
layout: docs
title: Building OpenICE from Source
title-sm: Build from Source
description:
---

The project is currently using version 5.1 of DDS provided to our infrastructure community by RTI.

**Cloning the project**

_Need help getting started with git?_ 
 
* Visit our [getting started page for git](GitInstructions) to learn how to clone the repository.

_Already cloned the repository?_ 
 
* Make sure you have installed the [java development kit](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html). You can type `java -version` on your terminal's command line to check if or what version of the JDK you have installed.

**Building the project**


**Option A**: _Do you use [Eclipse](http://www.eclipse.org)?_ [Gradle](http://www.gradle.org/), our project automation tool of choice, has an [Eclipse plugin](http://gradle.org/docs/current/userguide/eclipse_plugin.html).

* Navigate to the root directory of the mdpnp-code you just downloaded
* Type <code> gradle eclipse </code> on your command line. This will convert the project into an Eclipse project.
* Type <code> gradle build </code> which will build your code.
        
**Note**: This command will be 

*   `$ ./gradle eclipse` for **Linux and Mac OS X**.  
*   `> gradle eclipse` for **Windows**.

Now you can simply import the project into Eclipse. 

**Option B**: Run the following command from the root of the project (mdpnp-code) to build the software.

* Linux and Mac OS X:     <code> $ ./gradlew</code>      
* Windows:     <code> > gradlew</code>

To import the mdpnp projects using the [Gradle integration plugin for Eclipse](http://marketplace.eclipse.org/content/gradle-integration-eclipse-44) simply _import project_, select the '*Gradle*' option, then '*Gradle import*' and select your cloned mdpnp project as the root directory. You may need to check the _'Build model when importing'_ option.

**Already built the software?** 
If you require assistance visit the [OpenICE Community](http://community.openice.info) support site.