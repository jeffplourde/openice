---
layout: docs
title: Building OpenICE from Source
title-sm: Build from Source
description: Self explanatory. Helpful information for building the OpenICE project from source.
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


### Instructions ###
<ol class = "topOrderedList" type = "1"><li>Install the latest Java JDK <a href = "http://www.oracle.com/technetwork/java/javase/downloads/index.html">here.</a></li><li>Install git scm <a href = "http://git-scm.com/downloads">here.</a></li><li>Install gradle <a href = "http://www.gradle.org/downloads">here.</a></li><li>Install Eclipse IDE version 3.7 or 4.2 <a href = "http://www.eclipse.org/downloads/download.php?file=/technology/epp/downloads/release/juno/SR1/eclipse-java-juno-SR1-win32-x86_64.zip">here.</a><ul class = "firstIndentedUnorderedList" type = "square"><li>All of the following Eclipse plug-ins can be installed two ways:<ol type = "i"><li>Eclipse Market Place<ul class = "secondIndentedUnorderedList" type = "circle"><li>If Eclipse Marketplace is not installed click <a href="http://www.eclipse.org/mpc/archive.php">here</a> to find your Eclipse version’s download link and follow the instructions to use the “Install New Software…” tool in Eclipse <a href = "#InstallNewSoftwareTool">here</a>.</li><li>To find your Eclipse’s version:<ol class = "secondIndentedOrderedList" type = "a"><li>Open Eclipse with any workspace.</li><li>After Eclipse loads, click “Help” on the tool bar menu at the top.</li><li>In the “Help” drop down list click “About Eclipse SDK”</li><li>Version is stated within the “About Eclipse SDK” window that pops up.</li></ol></li></ul></li><li id = "InstallNewSoftwareTool">Install New Software tool provided by Eclipse.<ol class = "secondIndentedOrderedList" type = "a"><li>Open Eclipse with any workspace.</li><li>After Eclipse loads, click “Help” on the tool bar menu at the top.</li><li>In the “Help” drop down list click “Install New Software…”</li><li>After the “Install” window pops up then copy and paste your update link into the “Work with:” text box and then click the “Add…” button.</li><li>In the “Add Repository” window type in the name of the repository into the “Name” text box and then click the “OK” button.</li><li>Once the link has been loaded by the “Install” window a list of checkboxes with software should appear in a scroll window below the “Work with:” text bar.</li><li>Expand and check the boxes of Software and Software groups that you wish to install and then click the “Next >” button.</li><li>Follow the rest of the instructions provided by the “Install” window to successfully install the software that you have selected.</li><li>After successful installation of Eclipse IDE plug-ins the Eclipse IDE may prompt you to restart the application.</li></ol></li></ol></li></ul></li><li>Follow the installation instructions for Spring Tool Suite (STS) Eclipse IDE Plug-In within the Eclipse Marketplace <a href = "http://www.springsource.org/STS-installation-instructions">here</a>.</li><li>Follow the installation instructions for the Gradle Eclipse IDE Integration Plug-In via the Eclipse software <a href = "https://github.com/SpringSource/eclipse-integration-gradle/blob/master/README.md#installing-gradle-tooling-from-update-site">here</a>.</li><li>Clone the git repository.<ol class = "firstIndentedOrderedList" type = "i"><li>Open cmd line or terminal</li><li>Open or create a directory for your Mdpnp project. Use the following command: cd <your/directory/path/to/Mdpnp/project></li><li>Enter the command “git clone git://git.code.sf.net/p/mdpnp/code mdpnp-code” or “git clone http://git.code.sf.net/p/mdpnp/code mdpnp-code”</li></ol></li><li>Follow the instructions to Import the project into the Eclipse IDE via Gradle <a href = "http://sourceforge.net/p/mdpnp/wiki/EclipseGradleImport/">here</a>.</li><li>Run the Main.java class’s main function with a paired Bluetooth Pulse Oximeter.<ul class = "firstIndentedUnorderedList" type = "square"><li>The java class can be ran in the Eclipse IDE by doing the following:<ol class = "firstIndentedOrderedList" type = "i"><li>Open the Eclipse IDE with your MDPnP workspace folder.</li><li>On the toolbar click “Navigate”</li><li>In the “Navigate” drop down list click “Open Resource…”</li><li>In the “Open Resource” window type “IntelApp” in the topmost textbox.</li><li>In the scroll box, below the topmost textbox, click on the “IntelApp.java” file and then click the “Open” button.</li><li>To Run the IntelApp.java main function click on “Run” in the Eclipse IDE toolbar.</li><li>On the “Run” drop down list click on “Run As…”</li><li>In the “Run As…” expanded drop down list click on “Java Application”</li><li>Enjoy the Application!</li></ol></li></ul></li></ol>