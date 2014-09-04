var OpenICE = require('./openice.js');
var PartitionBox = require('./partition-box.js');

var currentTable = null;

window.onload = function() {
  var select = document.getElementById('partitionBox');
  var openICE = new OpenICE("http://www.openice.info");

  PartitionBox(openICE, select, 15);

  var changePartition = function(partition) {
    if(currentTable != null) {
      openICE.destroyTable(currentTable);
    }
    currentTable = openICE.createTable({domain: 15, 'partition': partition, topic:'Numeric'});

    currentTable.on('sample', function(e) {
      var openICE = e.openICE, table = e.table, row = e.row, sample = e.sample;
      var tr = document.getElementById(row.rowId);
      if(typeof tr === 'undefined' || tr == null) {
        tr = document.createElement("tr");
        tr.id = row.rowId;
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
        td.id = row.rowId+"value";
        td.innerHTML = "";
        tr.appendChild(td);

        var numerics = document.getElementById("numerics");
        numerics.appendChild(tr);
      }
      var td = document.getElementById(row.rowId+"value");
      td.innerHTML = sample.data.value;
    });

    currentTable.on('afterremove', function(e) {
      var openICE = e.openICE, table = e.table, row = e.row;
      var tr = document.getElementById(row.rowId);
      if(typeof tr !== 'undefined' && tr != null) {
        document.getElementById("numerics").removeChild(tr);
      }
    });
  };

  select.onchange = function(e) {
    changePartition([select.options[select.selectedIndex].value]);
  };
  changePartition([""]);
};
