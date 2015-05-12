function fetchPatients() {
	var url = "https://fhir.openice.info/fhir/Patient";

	var client = new XMLHttpRequest();

	client.onload = function(e) {
		if (client.readyState === 4) {
    		if (client.status === 200) {
      			console.log(client.responseText);
    		} else {
      			console.error(client.statusText);
    		}
    	}
	};

	client.onerror = function(e) {
		console.error(client.statusText);
	}

	client.open("GET", url, true);

	// client.setRequestHeader("Content-Type", "application");

	client.send();

}

function rebuildSelect(e, select) {
	//fetchPatients();

	var table = e.table, row = e.row;
	var names = {};
	var previouslySelected = {};

	for(var i = 0; i < select.options.length; i++) {
		if(select.options[i].selected) {
			previouslySelected[select.options[i].value] = 'selected';
		}
	}
	select.options.length = 0;

	names["<default>"] = "";

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
						// Only include MRN patient partitions
						if(0 != name[j].indexOf("MRN=")) { continue; }
						names[name[j]] = name[j];
					}
				}
			}
		}
	}
	var partKeys = Object.keys(names);

	for(var i = 0; i < partKeys.length; i++) {
		var opt = document.createElement("option");
		opt.text = partKeys[i];
		opt.value = names[partKeys[i]];
		opt.selected = previouslySelected[opt.value];
		select.add(opt);
	}		
};


function PartitionBox(openICE, selectElement, domainId, changePartition, defaultPartition) {
        if(!defaultPartition) {
            defaultPartition = "";
        }
        
	var publicationsTable = openICE.createTable({domain:domainId, partition:[], topic:'DCPSPublication'});
	publicationsTable.on('sample', function(e) {
		rebuildSelect(e, selectElement, defaultPartition);
	});
	publicationsTable.on('afterremove', function(e) {
		rebuildSelect(e, selectElement, defaultPartition);
	});
	for(var i = 0; i < selectElement.options.length; i++) {
		if(""==selectElement.options[i].text) {
			return;
		}
	}

	var opt = document.createElement("option");
	opt.text = "<default>";
	opt.value = defaultPartition;
	opt.selected = 'selected';
	selectElement.add(opt);

	selectElement.onchange = function(e) {
    	var partitions = [];
    	for(var i = 0; i < selectElement.options.length; i++) {
      		if(selectElement.options[i].selected) {
        		partitions.push(selectElement.options[i].value);
      		}
    	}
    	changePartition(partitions);
  	};
  	changePartition([defaultPartition]);
}


module.exports = exports = PartitionBox;
