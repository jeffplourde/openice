var OpenICE = require('./openice.js');
var PartitionBox = require('./partition-box.js');

var numericTable = null;
var patientAlertTable = null;

window.onload = function() {
  var select = document.getElementById('partitionBox');
  var openICE = new OpenICE("http://www.openice.info");

  PartitionBox(openICE, select, 15);

  var changePartition = function(partition) {
    if(numericTable != null) {
      openICE.destroyTable(numericTable);
      numericTable = null;
    }
    if(patientAlertTable != null) {
      openICE.destroyTable(patientAlertTable);
      patientAlertTable = null;
    }
    numericTable = openICE.createTable({domain: 15, 'partition': partition, topic:'Numeric'});

    numericTable.on('sample', function(e) {
      var openICE = e.openICE, table = e.table, row = e.row, sample = e.sample;
      var tr = document.getElementById("N"+row.rowId);
      if(typeof tr === 'undefined' || tr == null) {
        tr = document.createElement("tr");
        tr.id = "N"+row.rowId;
        var td = document.createElement("td");
        td.innerHTML = row.keyValues.unique_device_identifier;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = row.keyValues.metric_id;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = row.keyValues.instance_id;
        tr.appendChild(td);
        td = document.createElement("td");
        td.id = "N"+row.rowId+"value";
        td.innerHTML = "";
        tr.appendChild(td);

        var numerics = document.getElementById("Numeric");
        numerics.appendChild(tr);
      }
      var td = document.getElementById("N"+row.rowId+"value");
      td.innerHTML = sample.data.value;
    });

    numericTable.on('afterremove', function(e) {
      var openICE = e.openICE, table = e.table, row = e.row;
      var tr = document.getElementById("N"+row.rowId);
      if(typeof tr !== 'undefined' && tr != null) {
        document.getElementById("Numeric").removeChild(tr);
      }
    });

    patientAlertTable = openICE.createTable({domain: 15, 'partition': partition, topic:'PatientAlert'});

    patientAlertTable.on('sample', function(e) {
      var openICE = e.openICE, table = e.table, row = e.row, sample = e.sample;
      var tr = document.getElementById("P"+row.rowId);
      if(typeof tr === 'undefined' || tr == null) {
        tr = document.createElement("tr");
        tr.id = "P"+row.rowId;
        var td = document.createElement("td");
        td.innerHTML = row.keyValues.unique_device_identifier;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = row.keyValues.identifier;
        tr.appendChild(td);
        td = document.createElement("td");
        td.id = "P"+row.rowId+"value";
        td.innerHTML = "";
        tr.appendChild(td);

        var patientAlert = document.getElementById("PatientAlert");
        patientAlert.appendChild(tr);
      }
      var td = document.getElementById("P"+row.rowId+"value");
      td.innerHTML = sample.data.text;
    });

    patientAlertTable.on('afterremove', function(e) {
      var openICE = e.openICE, table = e.table, row = e.row;
      var tr = document.getElementById("P"+row.rowId);
      if(typeof tr !== 'undefined' && tr != null) {
        document.getElementById("PatientAlert").removeChild(tr);
      }
    });    
  };

  select.onchange = function(e) {
    changePartition([select.options[select.selectedIndex].value]);
  };
  changePartition([""]);
};
