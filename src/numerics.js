"use strict";
var OpenICE = require('./openice.js');
var PartitionBox = require('./partition-box.js');

var DOMAINID = 15;

function TableManager(openICE, tableName, htmlTable, keyFields, valueHandler) {
  this.openICE = openICE;
  this.table = null;
  this.keyFields = keyFields;
  this.tableName = tableName;
  this.htmlTable = htmlTable;
  this.valueHandler = valueHandler;
}

TableManager.prototype.changePartition = function(partition) {
  console.log(this.tableName + " changing to " + partition);
  if(this.table != null) {
    this.openICE.destroyTable(this.table);
    this.table = null;
  }
  this.table = this.openICE.createTable({domain: DOMAINID, 'partition': partition, topic:this.tableName});
  var self = this;

  this.table.on('sample', function(e) {
    console.log("I SEE A SAMPLE", self.tableName);
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
      
      td = document.createElement("td");
      td.id = self.tableName+row.rowId+"value";
      td.innerHTML = "";
      tr.appendChild(td);

      self.htmlTable.appendChild(tr);
    }
    var td = document.getElementById(self.tableName+row.rowId+"value");
    td.innerHTML = self.valueHandler(sample.data);
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
  var openICE = new OpenICE("http://www.openice.info");

  PartitionBox(openICE, select, DOMAINID);

  var numeric = new TableManager(openICE, "Numeric", document.getElementById("Numeric"), ["unique_device_identifier", "metric_id", "instance_id"], function(data) { return data.value; });
  var patientAlert = new TableManager(openICE, "PatientAlert", document.getElementById("PatientAlert"), ["unique_device_identifier", "identifier"], function(data) { return data.text; });
  var technicalAlert = new TableManager(openICE, "TechnicalAlert", document.getElementById("TechnicalAlert"), ["unique_device_identifier", "identifier"], function(data) { return data.text; });
  var deviceAlertCondition = new TableManager(openICE, "DeviceConditionAlert", document.getElementById("DeviceAlertCondition"), ["unique_device_identifier"], function(data) { return data.alert_state; });
  var patientAssessment = new TableManager(openICE, "PatientAssessment", document.getElementById("PatientAssessment"), [], function(data) { return JSON.stringify(data); });


  var changePartition = function(partition) {
    numeric.changePartition(partition);
    patientAlert.changePartition(partition);
    technicalAlert.changePartition(partition);
    deviceAlertCondition.changePartition(partition);
    patientAssessment.changePartition(partition);
  };

  select.onchange = function(e) {
    changePartition([select.options[select.selectedIndex].value]);
  };
  changePartition([""]);
};
