var OpenICE = require('./openice.js');

var openICE = new OpenICE("http://www.openice.info");

var partition = ["MDPNP|004"];

openICE.on('sample', function(e) {
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
openICE.on('afterremove', function(e) {
  var openICE = e.openICE, table = e.table, row = e.row;
	var tr = document.getElementById(row.rowId);
	if(typeof tr !== 'undefined' && tr != null) {
		document.getElementById("numerics").removeChild(tr);
	}
});
var currentTable;
openICE.on('open', function(e) {
  var openICE = e.openICE;
	currentTable = openICE.createTable({domain: 15, partition: partition, topic:'Numeric'});
});
function changePartition(str) {
	openICE.destroyAllTables(true);
	partition = str.split(",");
	currentTable = openICE.createTable({domain: 15, partition: partition, topic:'Numeric'});
}

window.onload = function() {
  document.getElementById('partitionBox').value = partition;
  document.getElementById('partitionForm').onsubmit = function() {
    var str = document.getElementById('partitionBox').value;
    changePartition(str);
    return false;
  };
};
