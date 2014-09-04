
function rebuildSelect(e, select) {
	var table = e.table, row = e.row;
	var names = {};
	while(select.options.length>0) {
		select.remove(0);
	}
	var rowKeys = Object.keys(table.rows);
	for(var i = 0; i < rowKeys.length; i++) {
		var row = table.rows[rowKeys[i]];
		if(row.samples.length > 0) {
			var name = row.samples[row.samples.length-1].data.partition.name;
			if(typeof name === 'undefined' || null == name || name.length==0) {
				names["<default>"] = "";
			} else {
				for(var j = 0; j < name.length; j++) {
					if(name[j]=="") {
						names["<default>"] = "";
					} else {
						names[name[j]] = name[j];
					}
				}
			}
		}
	}
	delete names["<default>"];
	var partKeys = Object.keys(names);
	var opt = document.createElement("option");
	opt.text = "<default>";
	opt.value = "";
	select.add(opt);
	

	for(var i = 0; i < partKeys.length; i++) {
		var opt = document.createElement("option");
		opt.text = partKeys[i];
		opt.value = names[partKeys[i]];
		select.add(opt);
	}		
};


function PartitionBox(openICE, selectElement, domainId) {
	var publicationsTable = openICE.createTable({domain:domainId, partition:[], topic:'DCPSPublication'});
	publicationsTable.on('sample', function(e) {
		rebuildSelect(e, selectElement);
	});
	publicationsTable.on('afterremove', function(e) {
		rebuildSelect(e, selectElement);
	});
}


module.exports = exports = PartitionBox;