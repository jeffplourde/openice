"use strict";
var OpenICE = require('./openice.js');
var PartitionBox = require('./partition-box.js');
var moment = require('moment');
var Renderer = require('./plot.js');

var DOMAINID = 15;
var tables = [];
var deviceName = {};
var renderers = [];

function TableManager(tableName, keyFields, valueFields, valueHandler, keyHandler, description) {
  this.table = null;
  this.keyFields = keyFields;
  this.valueFields = valueFields;
  this.tableName = tableName;
  this.valueHandler = valueHandler;
  this.keyHandler = keyHandler;
  this.description = description;
}

function localT(time) {
  return moment(time).format('MM/DD/YYYY HH:mm:ss.SSS');
}

function timeFromTimeT(val) {
  if(val.seconds && !val.sec) {
    val.sec = val.seconds;
  }
  if(val.nanoseconds && !val.nanosec) {
    val.nanosec = val.nanoseconds;
  }

  if(val.sec == 0 && val.nanosec == 0) {
    return "N/A";
  } else {
    return localT(val.sec * 1000 + val.nanosec / 1000000);
  }
}

function trunc(udi) {
  if(deviceName[udi]) {
    return deviceName[udi];
  } else {
    return udi.substring(0,4);
  }
}

TableManager.prototype.write = function(document) {
  document.write("<a name=\""+this.tableName+"\"></a>");
  document.write("<h2 class=\"table-heading\">"+this.tableName+"</h2><br/>");
  document.write("<p class=\"description\">"+this.description+"</p>");
  document.write("<div class=\"table-responsive\">");
  document.write("<table class=\"table table-diagnostic\" id=\""+this.tableName+"\"><tbody>");
  for(var i = 0; i < this.keyFields.length; i++) {
    document.write("<td>"+this.keyFields[i]+"</td>");
  }
  document.write("<td>Timestamp</td>");
  for(var i = 0; i < this.valueFields.length; i++) {
    document.write("<td>"+this.valueFields[i]+"</td>");
  }
  document.write("</tbody></table>");
  document.write("</div><br/>");
}

TableManager.prototype.changePartition = function(partition) {
  if(this.table != null) {
    this.openICE.destroyTable(this.table);
    this.table = null;
  }
  this.table = this.openICE.createTable({domain: DOMAINID, 'partition': partition, topic:this.tableName});
  var self = this;

  this.table.on('sample', function(e) {
    var openICE = e.openICE, table = e.table, row = e.row, sample = e.sample;
    if(table.topic == 'DeviceIdentity') {
      deviceName[row.keyValues.unique_device_identifier] = sample.data.manufacturer + " " + sample.data.model + " (" + row.keyValues.unique_device_identifier.substring(0,4)+")";
    }
    var tr = document.getElementById(self.tableName+row.rowId);
    if(typeof tr === 'undefined' || tr == null) {
      tr = document.createElement("tr");
      tr.id = self.tableName+row.rowId;
      tr.keyTds = [];
      for(var i = 0; i < self.keyFields.length; i++) {
        var td = document.createElement("td");
        tr.keyTds.push(td);
        tr.appendChild(td);  
      }
      self.keyHandler(tr.keyTds, row.keyValues, row);

      var td = document.createElement("td");
      tr.appendChild(td);
      tr.timestamp = td;

      tr.valueTds = [];
      for(var i = 0; i < self.valueFields.length; i++) {
        var td = document.createElement("td");
        tr.valueTds.push(td);
        tr.appendChild(td);
      }

      document.getElementById(self.tableName).appendChild(tr);
    }
    tr.timestamp.innerHTML = localT(sample.sourceTimestamp);
    self.valueHandler(tr.valueTds, sample.data, sample);
  });
  this.table.on('afterremove', function(e) {
    var openICE = e.openICE, table = e.table, row = e.row;
    if(table.topic == 'DeviceIdentity') {
      delete deviceName[row.keyValues.unique_device_identifier];
    }
    if(row.renderer) {
      var idx = renderers.indexOf(row.renderer);
      renderers.splice(idx,1);
      delete row.renderer;
    }
    var tr = document.getElementById(self.tableName+row.rowId);
    if(typeof tr !== 'undefined' && tr != null) {
      document.getElementById(self.tableName).removeChild(tr);
    }
  });
}

tables.push(new TableManager("DeviceIdentity", 
      ["UDI", "Publication Partition"],
      ["Manufacturer", "Model", "Serial Number", "Icon", "Build", "OS"],
      function(tds, data) { tds[0].innerHTML = data.manufacturer; 
                            tds[1].innerHTML = data.model; 
                            tds[2].innerHTML = data.serial_number;
                            while (tds[3].firstChild) {
                               tds[3].removeChild(tds[3].firstChild);
                            }
                            var img = new Image();
                            img.src = "data:"+data.icon.content_type+";base64, " + data.icon.image;
                            tds[3].appendChild(img);
                            tds[4].innerHTML = data.build;
                            tds[5].innerHTML = data.operating_system;
                          },
      function(tds, keys, row) { tds[0].innerHTML = keys.unique_device_identifier.substring(0,4); tds[1].innerHTML = JSON.stringify(row.pub_partition); },
      "DeviceIdentity allows a device to share identifying information.  A device generally publishes this information only once.  A device with a further connection, perhaps a serial RS-232 link, might publish details like serial number only after they become available."
      ));
tables.push(new TableManager("AlarmLimit", 
      ["UDI", "Metric", "Type"],
      ["Units", "Value"],
      function(tds, data) { tds[0].innerHTML = data.unit_identifier; 
                            tds[1].innerHTML = data.value; },

      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier); 
                            tds[1].innerHTML = keys.metric_id; 
                            tds[2].innerHTML = keys.limit_type; },
      "The current alarm thresholds for a particular metric on a particular device."
      ));  
tables.push(new TableManager("PatientAlert", 
      ["UDI", "Identifier"], 
      ["Text"],
      function(tds, data) { tds[0].innerHTML = data.text; },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier);
        tds[1].innerHTML = keys.identifier; },
      "PatientAlert is an alert message related to patient state.  In the current iteration publishers may use any identifier they would like to uniquely identify patient alerts.  The instance ought to be registered and a sample published when the alarm is triggered.  If the associated text changes during the alarm another sample should be published.  When the alarm is cancelled the instance should be unregistered.  It's still an open question whether alarm samples should be published at regular intervals during the alarm condition.  This, unfortunately, might be necessary to assert the liveliness of the alarm instance to late joiners.  This is something to investigate with DDS vendors."
      ));
tables.push(new TableManager("TechnicalAlert", 
      ["UDI", "Identifier"], 
      ["Text"],
      function(tds, data) { tds[0].innerHTML = data.text; },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier); 
        tds[1].innerHTML = keys.identifier; },
      "TechnicalAlert is similar to PatientAlert but is meant for technical alarms about the operation of the device."
      ));

tables.push(new TableManager("Numeric", 
      ["UDI", "Metric", "Instance", "Units"], 
      ["Value", "Device Time"],
      function(tds, data) { tds[0].innerHTML = data.value; tds[1].innerHTML = timeFromTimeT(data.device_time); },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier);
        tds[1].innerHTML = keys.metric_id; tds[2].innerHTML = keys.instance_id; tds[3].innerHTML = keys.unit_id;
         },
      "Numerics are values observed by sensors at a relatively slow rate; generally <=1Hz.  Multiple sensors may exist for the same metric so the instance_id serves to distinguish between them.  If a timestamp is available from the device's internal clock it is specified as device_time.  A device ought to register an instance of Numeric when the associated sensor might provide observations.  If the sensor is physically disconnected or otherwise certain not to provide samples then the associated instance should be unregistered.  Sensors are encouraged to publish a new sample whenever a new observation is made even when the same value is observed.  In this way subscribers are made aware of the timeliness of the observation."
      ));
tables.push(new TableManager("SampleArray", 
      ["UDI", "Metric", "Instance", "Units", "Frequency"], 
      ["Values", "Device Time"],
      function(tds, data, sample) { 
        if(!sample.row.renderer) {
          var canvas = document.createElement("canvas");
          sample.row.canvas = canvas;
          canvas.width = canvas.width/2;
          canvas.height = canvas.height/2;

          var touchdown = function(e) {
            if (!e) var e = window.event;
            if(!canvas.endTime) {
              // Initialize the timeframe to a fixed value
              var now = Date.now();
              canvas.endTime = now - 4000;
            } 
              
            canvas.startTime = canvas.endTime - 5000;
            canvas.startTimeString = moment(canvas.startTime).format('HH:mm:ss');
            canvas.endTimeString = moment(canvas.endTime).format('HH:mm:ss');

            canvas.downEndTime = canvas.endTime;
            canvas.startX = e.touches ? e.touches[0].screenX : e.screenX;
            canvas.msPerPixel = 5000 / canvas.width;
            canvas.mouseDown = true;
            e.cancelBubble = true;
            e.returnValue = false;
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) { e.preventDefault(); }
            var touchmove = function(e) {
              if (!e) var e = window.event;
              if(canvas.mouseDown) {
                canvas.endTime = canvas.downEndTime - ((e.touches ? e.touches[0].screenX : e.screenX)-canvas.startX) * canvas.msPerPixel;
                canvas.startTime = canvas.endTime - 5000;
                canvas.startTimeString = moment(canvas.startTime).format('HH:mm:ss');
                canvas.endTimeString = moment(canvas.endTime).format('HH:mm:ss');

                e.cancelBubble = true;
                e.returnValue = false;
                if (e.stopPropagation) e.stopPropagation();
                if (e.preventDefault) { e.preventDefault(); }
                return false;
              } else {
                return true;
              }
            };
            var touchup = function(e) {
              if (!e) var e = window.event;
              canvas.mouseDown = false;
              document.removeEventListener("mousemove", touchmove);
              document.removeEventListener("mouseup", touchup);
              document.removeEventListener("touchmove", touchmove);
              document.removeEventListener("touchend", touchup);
              document.removeEventListener("touchcancel", touchup);
              var queryStart = new Date(canvas.startTime-10000);
              var queryEnd = new Date((canvas.endTime+10000)>Date.now()?Date.now():canvas.endTime+10000);

              var q = {"_id.key":sample.row.keyValues, 
                       "_id.topic":sample.row.table.topic,
                       "_id.partition":sample.row.pub_partition,
                       "_id.domain":sample.row.table.domain};

              if(sample.row.samples.length==0) {
                q["_id.sourceTimestamp"] = {$gt: queryStart, $lt: queryEnd};
                sample.row.query(q);
              } else {
                if (queryStart < sample.row.samples[0].sourceTimestamp) {
                  q["_id.sourceTimestamp"] = {$gt: queryStart, $lt: sample.row.samples[0].sourceTimestamp};
                  sample.row.query(q);
                }
                if(queryEnd > sample.row.latest_sample.sourceTimestamp) {
                  q["_id.sourceTimestamp"] = {$gt: sample.row.latest_sample.sourceTimestamp, $lt: queryEnd};
                  sample.row.query(q); 
                }
              }
              
            };
            document.addEventListener("mousemove", touchmove);
            document.addEventListener("mouseup", touchup);
            document.addEventListener("touchmove", touchmove);
            document.addEventListener("touchend", touchup);
            document.addEventListener("touchcancel", touchup);
            

            return false;
          };
          canvas.addEventListener("mousedown", touchdown);
          canvas.addEventListener("touchstart", touchdown);

          tds[0].appendChild(sample.row.canvas);
          sample.row.renderer = new Renderer({'canvas':sample.row.canvas, 'row':sample.row, overwrite: false});
          renderers.push(sample.row.renderer);
        }
        // sample.row.renderer.render(t1, t2);
        tds[1].innerHTML = timeFromTimeT(data.device_time); },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier);
        tds[1].innerHTML = keys.metric_id; tds[2].innerHTML = keys.instance_id; tds[3].innerHTML = keys.unit_id;
        tds[4].innerHTML = keys.frequency; },
      "SampleArrays are values observed by sensors at a relatively high rate; generally >1Hz.  Multiple sensors may exist for the same metric so the instance_id serves to distinguish between them.  If a timestamp is available from the device's internal clock it is specified as device_time.  A device ought to register an instance of SampleArray when the associated sensor might provide observations.  If the sensor is physically disconnected or otherwise certain not to provide samples then the associated instance should be unregistered.  Sourcetimestamp and device_time should both represent the point in time at the end of the sample array."
      ));
tables.push(new TableManager("DeviceConditionAlert", 
      ["UDI"], 
      ["Alert State"],
      function(tds, data) { tds[0].innerHTML = data.alert_state; },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier); },
      "In the current iteration this is status text associated with the device globally.  Meant for the global alarm state of the device.  For example is the device audibly alarming, visibly alarming, alarming but silenced, etc."
      ));
tables.push(new TableManager("PatientAssessment", 
      [], 
      ["Assessment Time", "Given Name", "Family Name", "Date of Birth", "MRN", "Height", "Weight", 
       "Activity", "Nutrition", "Pain", "Sedation", "Notes", "Clinician"],
      function(tds, data) { 
        tds[0].innerHTML = timeFromTimeT(data.timestamp);
        tds[1].innerHTML = data.demographics.given_name;
        tds[2].innerHTML = data.demographics.family_name;
        tds[3].innerHTML = ""+data.demographics.date_of_birth.month+"/"+data.demographics.date_of_birth.day+"/"+data.demographics.date_of_birth.century+data.demographics.date_of_birth.year;
        tds[4].innerHTML = data.demographics.mrn;
        tds[5].innerHTML = data.demographics.height+" m";
        tds[6].innerHTML = data.demographics.weight+" lbs";
        tds[7].innerHTML = data.activity_assessment;
        tds[8].innerHTML = data.nutrition_assessment;
        tds[9].innerHTML = data.pain_assessment;
        if(data.sedation_assessment.discriminator) {
          delete data.sedation_assessment['discriminator'];
        }
        tds[10].innerHTML = JSON.stringify(data.sedation_assessment);
        tds[11].innerHTML = data.notes;
        tds[12].innerHTML = data.clinician_name;
      },
      function(tds, keys) {},
      "Maintained from HIMSS'14 (and to support the Android RTBB app) this topic serves as a placeholder for more refined patient information we need to include in the data model in future iterations.  We also need to explore how data flows between DDS and other systems such as ADT."
      ));
tables.push(new TableManager("InfusionStatus",
      ["UDI"], 
      ["Infusion Active", "Drug Name", "Drug Mass", "Solution Volume", "VTBI", "Infusion Duration", "Infusion Fraction Complete"],
      function(tds, data) { 
        tds[0].innerHTML = data.infusionActive;
        tds[1].innerHTML = data.drug_name;
        tds[2].innerHTML = data.drug_mass_mcg+" mcg";
        tds[3].innerHTML = data.solution_volume_ml + " ml";
        tds[4].innerHTML = data.volume_to_be_infused_ml + " ml";
        tds[5].innerHTML = data.infusion_duration_seconds + " seconds";
        tds[6].innerHTML = Math.round(100*data.infusion_fraction_complete) + " %";
      },
      function(tds, keys) {
        tds[0].innerHTML = trunc(keys.unique_device_identifier);
      },
      "Speculative topic used for the PCA demonstration.  Only currently used by infusion pump simulators.  But this is meant to represent the current state of an infusion pump holistically and coherently.  While this is an early guess at some appropriate fields it does make it evident that many of these fields are not safely separable and should be part of the same message."
      ));
tables.push(new TableManager("InfusionObjective",
      ["UDI","Requestor"], 
      ["stopInfusion"],
      function(tds, data) { tds[0].innerHTML = data.stopInfusion; },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier);
      tds[1].innerHTML = keys.requestor; },
      "Speculative topic used for the PCA demonstration.  The supervisory safety app publishes a sample with stopInfusion=1 to indicate the infusion pump may not infuse.  Currently a third topic, indicating that the pump has acknowledged the safety interlock, has not yet been included.  We should also explore the possibility of a setup whereby the pump receives periodic 'ok to infuse' information and stops when that information is not received."
      ));
tables.push(new TableManager("Patient",
      ["Medical Record Number"], 
      ["Given Name", "Family Name"],
      function(tds, data) { tds[0].innerHTML = data.given_name; tds[1].innerHTML = data.family_name; },
      function(tds, keys) { tds[0].innerHTML = keys.mrn; },
      "Speculative patient info topic thus far used only to prove the viability of unicode text sent through DDS and out onto the web."
      ));
tables.push(new TableManager("GlobalAlarmLimitObjective", 
      ["Metric", "Type"],
      ["Units", "Value"],
      function(tds, data) { tds[0].innerHTML = data.unit_identifier; tds[1].innerHTML = data.value; },
      function(tds, keys) { tds[0].innerHTML = keys.metric_id; tds[1].innerHTML = keys.limit_type; },
      "This objective is published by a Supervisory participant to request that all participants use the specified thresholds for alarms on a particular metric."
      ));    
tables.push(new TableManager("LocalAlarmLimitObjective", 
      ["UDI", "Metric", "Type"],
      ["Units", "Value"],
      function(tds, data) { tds[0].innerHTML = data.unit_identifier; tds[1].innerHTML = data.value; },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier); 
                            tds[1].innerHTML = keys.metric_id; 
                            tds[2].innerHTML = keys.limit_type; },
      "This objective is published by a device to acknowledge that it has received the global alarm settings objective for a metric.  Eventually its AlarmSettings should indicate that the change has been made.  So the three AlarmSettingsXXX topics form an objective-state form of command and control.  At any time any participant can see the current state of request, acknowledgment of the request, and implementation of the requested change."
      ));      
tables.push(new TableManager("DeviceConnectivity",
      ["UDI"],
      ["Type", "State", "Info", "Valid Targets"],
      function(tds, data) { tds[0].innerHTML = data.state; tds[1].innerHTML = data.type; tds[2].innerHTML = data.info; tds[3].innerHTML = data.valid_targets; },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier); },
      "DeviceConnectivity shares information about a device that has a further connection to another device, such as a serial RS-232 link.  The status of that further connection is published as well as additional information about the connection (often details about the connection process).  Targets are also provided for an associated objective topic whereby establishment of the further connection can be requested by another participant.  All current OpenICE device adapters attempt to establish such a connection by default."
      ));
tables.push(new TableManager("HeartBeat",
      ["UDI"],
      ["Type"],
      function(tds, data) { tds[0].innerHTML = data.type; },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.unique_device_identifier); },
      "At regular intervals (currently every 2 seconds) every OpenICE participant should publish to this topic.  When the instance of HeartBeat associated with a device is no longer alive that device should be considered disconnected from the system.  The Type description indicates whether the heartbeat came from a Device or Supervisor."
      ));
tables.push(new TableManager("TimeSync",
      ["Source", "Recipient"],
      ["Source Timestamp", "Recipient Timestamp"],
      function(tds, data) { tds[0].innerHTML = timeFromTimeT(data.source_source_timestamp); 
        tds[1].innerHTML = timeFromTimeT(data.recipient_receipt_timestamp); },
      function(tds, keys) { tds[0].innerHTML = trunc(keys.heartbeat_source); 
        tds[1].innerHTML = trunc(keys.heartbeat_recipient); },
      "Upon receipt of a HeartBeat sample an OpenICE participant should publish to this topic the original source timestamp of that heartbeat as well as the reception time.  When this TimeSync message arrives back at the participant which originated the heartbeat enough information has been gathered to ascertain clock synchronization.  So a Supervisory participant can determine whether any device clocks are out of sync."
      ));

window.onload = function() {

  // http://stackoverflow.com/questions/2907367/have-a-div-cling-to-top-of-screen-if-scrolled-down-past-it
  var $window = $(window),
  $stickyEl = $('#connectionStatus'),
  elTop = $stickyEl.offset().top;

  $window.scroll(function() {
    $stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);
  });
  setTimeout(function() {$stickyEl.toggleClass('sticky', $window.scrollTop() > elTop);}, 100);


  var select = document.getElementById('partitionBox');
  var wsHost = window.location.protocol == 'file:' ? 'http://dev.openice.info' : window.location.protocol + '//' + window.location.host;

  var openICE = new OpenICE(wsHost);
  openICE.maxSamples = 10000;
  

  for(var i = 0; i < this.tables.length; i++) {
    tables[i].openICE = openICE;
  }

  openICE.on('open', function(e) {
    $('.status').html('Connected').css('color', 'green');
  });
  openICE.on('close', function(e) {
    $('.status').html('Disconnected').css('color', 'red');
  });

  var changePartition = function(partition) {
    for(var i = 0; i < tables.length; i++) {
      tables[i].changePartition(partition);
    }
  };
  PartitionBox(openICE, select, DOMAINID, changePartition, "MRN=14c89b52fb7");

  function renderFunction() {
    if(renderers.length > 0) {


      var now = Date.now();
      var t2 = now - 4000;
      var t1 = t2 - 5000;
      // var oldest = renderers[0];
      var s1 = moment(t1).format('HH:mm:ss');
      var s2 = moment(t2).format('HH:mm:ss');


      // if(oldest.lastRender) {
        for(var i = 0; i < renderers.length; i++) {
          var canvas = renderers[i].canvas;
          if(canvas.startTime && canvas.endTime) {
            renderers[i].render(canvas.startTime, canvas.endTime, canvas.startTimeString, canvas.endTimeString);
          } else {
            renderers[i].render(t1, t2, s1, s2);
          }
          // if(!renderers[i].lastRender) {
            // oldest = renderers[i];
            // break;
          // } else if(renderers[i].lastRender < oldest.lastRender) {
            // oldest = renderers[i];
          // }
          // renderers[i].render(t1, t2, s1, s2);
        }
      // }
      // oldest.render(t1, t2);
      // oldest.lastRender = now;

    } 
    
    setTimeout(renderFunction, 75);
  };
  setTimeout(renderFunction, 75);

  select.focus();
};

window.tables = tables;
