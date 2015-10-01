---
layout: docs
title: Documentation for Building an App from Hello, OpenICE! 
title-sm: Hello, OpenICE! Docs
description: Documentation for Building an App from "Hello, OpenICE!"
---

This documentation contains instructions for the following topics to assist developers wishing to work with [Hello, OpenICE!](https://github.com/mdpnp/hello-openice):

1. [How to Setup Eclipse for JavaEE](#how-to-setup-eclipse-for-javaee)
1. [How to Setup Gradle for Eclipse](#how-to-setup-gradle-for-eclipse)
1. [Getting Started with Git Revision Control](#getting-started-with-git-revision-control)
1. [How to Build Hello OpenICE](#how-to-build-hello-openice)
1. [How to Build a Skeleton OpenICE Application](#how-to-build-a-skeleton-openice-application)



---



# How to Setup Eclipse for JavaEE

### Introduction

Eclipse is a popular, open source IDE (Integrated Development Environment), with optional support for a wide variety of languages.
Java-language application and library development

### Install Java Development Kit Version 8

1. Browse to [http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
1. Under **Java SE Development Kit 8u45**, click on **Accept** License Agreement
1. In that same section, click on `jdk-8u45-windows-x64.exe` (or whatever java is appropriate for your OS). 
1. **Install** the downloaded file (**run as Administrator**).
1. Set the following Windows environment variables:
	1. **JAVA_HOME** to point to the root of your newly-installed JDK (likely somewhere directly under C:\Program Files\Java\)

### Install Eclipse MARS Version for Java EE

1. Browse to the [Eclipse Downloads page](https://www.eclipse.org/downloads/)
1. Select your OS from the dropdown on the upper-right
1. Click on the version of Eclipse you want. E.g. **Eclipse IDE for Java EE Developers**, 64-bit Windows version.
1. `Unzip` the downloaded zip file to somewhere under your Documents folder.
1. Make a shortcut from the new eclipse/eclipse.exe to your desktop or task bar - somewhere where it will be easy for you to run.

### Configure Eclipse

1. **Create a lib folder**.  Later on, you may get errors about the eclipse/lib folder not existing.  To avoid this problem, create a lib folder under the Eclipse root folder. E.g. `C:\Users\username\Documents\eclipse\lib`



---



# How to Setup Gradle for Eclipse

### Introduction

Gradle is an open source software build manager.

### Install Prerequisites

1. [How to Setup Eclipse for JavaEE](#how-to-setup-eclipse-for-javaee)

### Install Gradle

1. Browse to [gradle.org](http://gradle.org/)
1. **Click** the large green button labeled **Download Gradle 2.6**
1. **Extract** the contents of the downloaded Zip file
1. **Copy** the extracted folder to somewhere under **Documents**. E.g., move the `gradle-2.6` folder to `Documents/`
1. Create an environment variable named **GRADLE_HOME** with a value of your copied gradle directory. E.g., set **GRADLE_HOME** to `C:\Users\username\Documents\gradle-2.6`
1. Add to your **PATH environment** variable the `GRADLE_HOME\bin` folder
1. Test the installation
	1. Open a **Command Prompt** window
	1. Type `gradle -v`
	1. Gradle should respond with its version information

### Install the Gradle Plugin for Eclipse

Note: you need do these steps only once; not once per Eclipse Workspace

1. Start **Eclipse**
1. Get to the Workspace view in Eclipse (close the welcome screen if it's up).  Any workspace is fine; it doesn't have to be the workspace you'll be doing Gradle work in.
1. Browse to **Gradle Integration for Eclipse** in the **Eclipse Marketplace**
1. In the browser, notice the button labeled **Install** (under the Eclipse Icon).  **Drag** that button to the **Project Explorer** pane (the left pane) of your running **Eclipse** instance.
1. After some progress graphics, a **Confirm Selected Features** dialog will appear.
1. In the Confirm Selected Features dialog, click **Confirm**
1. Read the license terms dialog and if you agree, click **I accept...**
1. Click **Finish**
1. When prompted, **restart** Eclipse
1. Test that the plugin is installed
	1. Select **File / Import...**
	1. Note that the alphabetical import types list includes a section named **Gradle**



---



# Getting Started with Git Revision Control

### Introduction

GIT is a file-revision control system, popular for open source projects because it supports distributed development. Unlike earlier revision control systems, it has no central server: each user has a separate copy of all the file revisions.

GitHub has a nice [cheat sheet](https://training.github.com/kit/downloads/github-git-cheat-sheet.pdf) once you're familiar with Git.

### Download/Install

1. Browse to the [GIT download page](http://git-scm.com/downloads)
1. Click on the link for your OS (Windows, Linux, Mac). The download will start.
1. On Windows, run the downloaded .exe as **administrator**.

### Common Operations

#### Configure Git

Git-Gui (above) configures during installation.

FYI, there are 3 levels of Git configuration file: global, per-user, and per-local-repository. In Windows, the files are:

- `C:\Program Files (x86)\Git\etc\gitconfig` (no '.' prefix)
- `C:\Users\your_username\.gitconfig`
- `etc\gitconfig` in each of your local repostory folders

You can change configuration using **Git Bash** (installed with Git-gui, above). **Run** Git Bash, then type

- `git config --list` to print the current configuration
- `git config --global user.name "Nathan Hale"` to change your Git contributor name to "Nathan Hale"
- `git config --global user.email nathan.hale@example.com` to change your Git contributor email address

#### Viewing Manual Pages

1. **run** "git bash"
1. type `git help config` (or whatever command other than config you want to know about)
1. A browser will open on a local copy of that git command's manual page.

#### Clone a Repository - Get a Copy of a Project

Suppose you want to clone the [Webduino project](https://github.com/sirleech/Webduino)...

1. Find the url of that Git repository. For GitHub projects such as Webduino, there's box in the right-hand column, labeled **Https clone URL**. Click the icon to the right of the box.  That will **copy** the URL to your clipboard.
1. Run **git GUI**
1. Click on **Clone Existing Repository**
1. **Paste** the Https clone URL into the box labeled **Source Location**
1. Click the button next to **Target Directory** labeled **Browse**
1. Choose the parent folder you want this repository to be cloned into. E.g. `C:\Users\username\Documents\git`
1. Click **OK**
1. Manually add the name of the repository to the end of the **Target Location** filename, resulting in, for example, `C:/Users/username/Documents/git/Webduino`
1. Click **Clone**
1. Once the clone is complete, you will see a commit window
1. Close git GUI
Now that you've cloned the repository, you can edit the files in the target folder (e.g., `C:/Users/username/Documents/git/Webduino`) in any way you like.

Cloning instead using Git Bash or native Linux git

1. Find the url of that Git repository. For GitHub projects such as Webduino, there's box in the right-hand column, labeled **Https clone URL**. **Click** the icon to the right of the box.  That will **copy** the URL to your clipboard.
1. `cd` to the folder you want your clone to reside in
1. `git clone urlOfTheRepo` using the url you copied in step 1
	- If you instead want the repo folder to have a different name than the default: `git clone urlOfTheRepo myRepoName`

#### Bring your Local Repository Up to Date

You need to bring your local repo up to date before you can successfully push changes to the master repository for the project.

1. `git pull origin master`
1. Depending on the git implementation, you may be prompted for your **username** and **password** on the repo site.

#### Commit Changes

1. Make your edits to the files you want
1. `git status` to see what files you haven't staged yet.
1. `git diff` to see the details of what hasn't been staged yet.
1. `git add file1 file2 ...` to add the current state of the listed files to the staging area.  You can say `git add foldername` to add a folder's contents to the staging area.
1. `git commit -m "explanation of what I changed"` to commit changes to your local repository.
1. `git push origin master` to push your committed changes to the master repository for this project.

#### Removing Changes Before a Commit

Suppose you've made changes to `myfile.java`, but you've decided that those changes were a bad idea.

If you haven't done a git commit yet, you can replace `myfile.java` with the most recent version you've checked by typing

- `git checkout -- myfile.java`



---



# How to Build Hello OpenICE

### Introduction

OpenICE is an Open Source framework enabling applications using multiple medical devices such as insulin pump and multi-parameter  patient monitors. These instructions apply to Windows systems.

`Hello, OpenICE!` is a simple Java application for sending and receiving OpenICE messages (DDS messages).

This page assumes you want to set up for OpenICE Java Eclipse development.

### Install Prerequisites

1. [How to Setup Eclipse for JavaEE](#how-to-setup-eclipse-for-javaee)
1. [How to Setup Gradle for Eclipse](#how-to-setup-gradle-for-eclipse)
1. [Getting Started with Git Revision Control](#getting-started-with-git-revision-control)


### Join the RTI Open Community

OpenICE uses the RTI DDS libraries.  We need to accept the license for those libraries by joining RTI's Open Community.

1. Browse to [RTI's Open Community Source](http://www.rti.com/downloads/rti-dds.html)
1. Fill in the fields
	1. For **Industry** select **Healthcare**
	1. For **Infrastructure Community ID** type `ICE_IC01`

### Clone the "Hello, OpenICE!" Project and Prepare It for Importing

1. **Create a parent folder** that will hold your cloned source.  For this example, suppose it's `Documents\git\`
1. Browse to the [Hello, OpenICE! git repo](https://github.com/mdpnp/hello-openice)
1. Copy the repo URL: [https://github.com/mdpnp/hello-openice.git](https://github.com/mdpnp/hello-openice.git)
1. Start Git Bash (or whatever git tool you use)
1. cd to your parent folder. E.g., `cd Documents\git`
1. `git clone https://github.com/mdpnp/hello-openice.git`
1. Exit Git Bash
1. Open a **Command Prompt**
1. cd to the cloned folder.  E.g., `cd Documents\git\hello-openice`
1. `gradlew`
1. The Hello app should build.  Importantly, it's now ready to be imported into Eclipse
1. exit the Command Prompt window


### Import "Hello, OpenICE!" into Eclipse

1. Start Eclipse
1. Create a new workspace for Hello-OpenICE
	1. **File / Switch Workspace / Other...**
	1. Click **Browse**
	1. **Create** a folder to hold the project.
	1. Click **OK**; Click **OK**
1. Wait for Eclipse to restart
1. **File / Import**
1. **Gradle / Gradle Project**
1. Navigate to the root of the cloned Hello, OpenICE! folder.  E.g., `Documents\git\hello-openice`
1. Click **Build Model**
1. Wait for the model to import.  It may take a few minutes. When that's done, a Hello OpenICE entry should appear in the window.
1. Check the box next to Hello OpenICE
1. Click **Finish**
1. Wait for the project to import.



---



# How to build a skeleton OpenICE application

### Introduction

This section covers how to create a new OpenICE application from nothing. If you're just starting, you'll likely want to instead start with [How to Build Hello OpenICE](#how-to-build-hello-openice).

### Install Prerequisites

1. [How to Setup Eclipse for JavaEE](#how-to-setup-eclipse-for-javaee)
1. [How to Setup Gradle for Eclipse](#how-to-setup-gradle-for-eclipse)

### Create an empty Gradle project

1. Start **Eclipse**
1. Create a new Workspace
	1. Select **File / Switch Workspace / Other...**
	1. **Browse** to where you want to create your project code
	1. Click **Make new folder**, and give it the **name** of your project
	1. Click the **big arrow** to go to the project view
1. Select **File / New / Other... / Gradle / Gradle Project**
1. Click **Next**
1. For **Project Name**, type a name for your project e.g. `HelloGradle`
1. For **Sample Project**, select **Java Quickstart**
1. Click **Finish**
1. **Wait** for the build to finish
1. **Expand** your project in the **Project Explorer** pane
1. Notice that there are a few example files, which we will eventually **delete**: `Person.java`, `PersonTest.java`, `test-resource`.xml, etc. Don't worry about that yet.
1. **Exit Eclipse** - this is important so it isn't confused by the next steps

### Change build.gradle for OpenICE Work

Your new project is a blank Gradle Java application. Next we'll change it to refer to the libraries required by OpenICE.

1. In Windows Explorer, find the **build.gradle** file in your new project
1. Open that **build.gradle** file in **Wordpad** (or your preferred text editor)
1. Add to the **apply plugin** section:

		apply plugin: 'application'

1. Add a Task Wrapper section:

		// builds a gradle wrapper
		// http://www.gradle.org/docs/current/userguide/gradle_wrapper.html
		task wrapper(type: Wrapper) {
		    gradleVersion = '2.3'
		}

1. Change the java **sourceCompatibility** setting to 1.8, replacing the existing sourceCompatibility line:

		sourceCompatibility = '1.8'
		targetCompatibility = '1.8'

1. Add the following to the **repositories** section, **above the mavenCentral()** line:

		maven { url 'http://build.openice.info/artifactory/libs-snapshot' }
		maven { url 'http://build.openice.info/artifactory/libs-release' }

1. Add to the **dependencies** section:

		compile 'org.mdpnp:x73-idl-rti-dds:0.6.3'
		compile 'org.slf4j:slf4j-api:1.7.10'
		runtime 'org.slf4j:slf4j-log4j12:1.7.10'
		runtime 'log4j:log4j:1.2.17'

### Build the Adapted Project in Eclipse

1. In **Eclipse**, in your new project's workspace,
1. In **Project Explorer** pane, **right-click** on your project and select **Refresh**
1. In **Project Explorer** pane, **right-click** on your project and select **Gradle / Refresh All**
1. **Wait** for the **status** in the workspace lower-right to complete (it may take a couple minutes)
1. Create your package and a main.java file using normal Eclipse Java commands.
1. In your **main.java main()** method, add `System.err.println("Hello, World");`
1. **Window / Perspective / Open Perspective / Debug**
1. Click the **Debug Icon** (the little spider icon in the upper-middle)
1. Your simple app should run, and print **Hello, World** on the console pane

### Add OpenICE Code

Now you should be able to add OpenICE/DDS-related code and use Eclipse's normal resolution methods to add the Imports, etc. you need. In Eclipse, you can hover over underlined text that is causing an error and have Eclipse offer to fix the problem.

For example, you can add public class MyDataReaderListener implements DataReaderListener, and hover over DataReaderListener to see a suggested import. Click on that suggestion to implement that import.
