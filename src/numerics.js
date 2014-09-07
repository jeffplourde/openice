"use strict";
var OpenICE = require('./openice.js');
var PartitionBox = require('./partition-box.js');

var DOMAINID = 15;

function TableManager(openICE, tableName, htmlTable, keyFields, valueHandler, valueColumns) {
  this.openICE = openICE;
  this.table = null;
  this.keyFields = keyFields;
  this.tableName = tableName;
  this.htmlTable = htmlTable;
  this.valueHandler = valueHandler;
  this.valueColumns = valueColumns;
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
    var tr = document.getElementById(self.tableName+row.rowId);
    if(typeof tr === 'undefined' || tr == null) {
      tr = document.createElement("tr");
      tr.id = self.tableName+row.rowId;
      for(var i = 0; i < self.keyFields.length; i++) {
        var td = document.createElement("td");
        td.innerHTML = row.keyValues[self.keyFields[i]];
        tr.appendChild(td);  
      }
      var td = document.createElement("td");
      tr.appendChild(td);
      tr.timestamp = td;

      tr.valueTds = [];
      for(var i = 0; i < self.valueColumns; i++) {
        var td = document.createElement("td");
        tr.valueTds.push(td);
        tr.appendChild(td);
      }

      self.htmlTable.appendChild(tr);
    }
    tr.timestamp.innerHTML = sample.sourceTimestamp;
    self.valueHandler(tr.valueTds, sample.data);
  });
  this.table.on('afterremove', function(e) {
    var openICE = e.openICE, table = e.table, row = e.row;
    var tr = document.getElementById(self.tableName+row.rowId);
    if(typeof tr !== 'undefined' && tr != null) {
      self.htmlTable.removeChild(tr);
    }
  });
}

window.onload = function() {
  var select = document.getElementById('partitionBox');
  var wsHost = window.location.protocol == 'file:' ? 'http://dev.openice.info' : window.location.protocol + '//' + window.location.host;

  var openICE = new OpenICE(wsHost);
  var tables = [];

  PartitionBox(openICE, select, DOMAINID);

  openICE.on('open', function(e) {
    document.getElementById('status').innerHTML = "Connected";
  });
  openICE.on('close', function(e) {
    document.getElementById('status').innerHTML = "Disconnected";
  });

  tables.push(new TableManager(openICE, "DeviceIdentity", document.getElementById("DeviceIdentity"),
        ["unique_device_identifier"],
        function(tds, data) { tds[0].innerHTML = data.manufacturer; tds[1].innerHTML = data.model; tds[2].innerHTML = data.serial_number;
                              while (tds[3].firstChild) {
                                 tds[3].removeChild(tds[3].firstChild);
                              }
                              var img = new Image();
                              img.src = "data:image/png;base64, " + data.icon.raster;
                              tds[3].appendChild(img);
                              tds[4].innerHTML = data.build;},
        5));
  tables.push(new TableManager(openICE, "DeviceConnectivity", document.getElementById("DeviceConnectivity"),
        ["unique_device_identifier"],
        function(tds, data) { tds[0].innerHTML = data.state; tds[1].innerHTML = data.type; tds[2].innerHTML = data.info; tds[3].innerHTML = data.valid_targets; },
        4));
  tables.push(new TableManager(openICE, "AlarmSettings", document.getElementById("AlarmSettings"),
        ["unique_device_identifier", "metric_id"],
        function(tds, data) { tds[0].innerHTML = data.lower; tds[1].innerHTML = data.upper; },
        2));  
  tables.push(new TableManager(openICE, "GlobalAlarmSettingsObjective", document.getElementById("GlobalAlarmSettingsObjective"),
        ["metric_id"],
        function(tds, data) { tds[0].innerHTML = data.lower; tds[1].innerHTML = data.upper; },
        2));    
  tables.push(new TableManager(openICE, "LocalAlarmSettingsObjective", document.getElementById("LocalAlarmSettingsObjective"),
        ["unique_device_identifier", "metric_id"],
        function(tds, data) { tds[0].innerHTML = data.lower; tds[1].innerHTML = data.upper; },
        2));      
  tables.push(new TableManager(openICE, "Numeric", document.getElementById("Numeric"), 
        ["unique_device_identifier", "metric_id", "instance_id"], 
        function(tds, data) { tds[0].innerHTML = data.value; },
        1));
  tables.push(new TableManager(openICE, "PatientAlert", document.getElementById("PatientAlert"), 
        ["unique_device_identifier", "identifier"], 
        function(tds, data) { tds[0].innerHTML = data.text; },
        1));
  tables.push(new TableManager(openICE, "TechnicalAlert", document.getElementById("TechnicalAlert"), 
        ["unique_device_identifier", "identifier"], 
        function(tds, data) { tds[0].innerHTML = data.text; },
        1));
  tables.push(new TableManager(openICE, "DeviceConditionAlert", document.getElementById("DeviceAlertCondition"), 
        ["unique_device_identifier"], 
        function(tds, data) { tds[0].innerHTML = data.alert_state; },
        1));
  tables.push(new TableManager(openICE, "PatientAssessment", document.getElementById("PatientAssessment"), 
        [], function(tds, data) { tds[0].innerHTML = JSON.stringify(data); },
        1));
  tables.push(new TableManager(openICE, "InfusionStatus", document.getElementById("InfusionStatus"), 
        ["unique_device_identifier"], function(tds, data) { tds[0].innerHTML = JSON.stringify(data); },
        1));

  var changePartition = function(partition) {
    for(var i = 0; i < tables.length; i++) {
      tables[i].changePartition(partition);
    }
  };

  select.onchange = function(e) {
    changePartition([select.options[select.selectedIndex].value]);
  };
  changePartition([""]);
};
