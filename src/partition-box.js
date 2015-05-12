var patientNames = {};

// Previous selection at top level scope because the previously
// selected item may transiently "disappear" from the known list
// of available partitions but for a consistent user experience
// when it returns it ought to still be selected
var previouslySelected = {};

function populatePatientName(partition, option) {
   if(patientNames[partition]) {
     option.text = patientNames[partition];
   } else {
        // This placeholder will prevent re-querying while awaiting a response
        patientNames[partition] = partition;
        var url = "https://fhir.openice.info/fhir/Patient?identifier="+partition.replace("MRN=","");
        var client = new XMLHttpRequest();

        client.onload = function(e) {
            if (client.readyState === 4) {
                if (client.status === 200) {
	           var bundle = JSON.parse(client.responseText);
	           if(bundle.entry && bundle.entry.length > 0) {
			var patient = bundle.entry[0].resource;
			if(patient && patient.name && patient.name.length > 0) {
		            var name = patient.name[0].given + " " + patient.name[0].family;
		            patientNames[partition] = name;
		            option.text = patientNames[partition];
			    return;
			}
		    }				
                } else {
                        console.error(client.statusText);
                }
        }
	    // If we didn't actually get a name then query again in the future
            delete patientNames[partition];
        };

        client.onerror = function(e) {
                console.error(client.statusText);
	     delete patientNames[partition]; 
        }

        client.open("GET", url, true);

        // client.setRequestHeader("Content-Type", "application");

        client.send();
    }

}

function rebuildSelect(e, select) {
	var table = e.table, row = e.row;
	var names = {};
        var previousOptions = {};

        //console.log("rebuild");
	for(var i = 0; i < select.options.length; i++) {
		previouslySelected[select.options[i].value] = select.options[i].selected;
                previousOptions[select.options[i].value] = select.options[i];
	}
	select.options.length = 0;
        // No longer allow the default partition
	// names["<default>"] = "";

	var rowKeys = Object.keys(table.rows);
	for(var i = 0; i < rowKeys.length; i++) {
		var row = table.rows[rowKeys[i]];
		if(row.samples.length > 0) {
			var name = row.samples[row.samples.length-1].data.partition.name;

			if(typeof name === 'undefined' || null == name || name.length==0) {
                                // No longer allow default partition
				// names["<default>"] = "";
			} else {
				for(var j = 0; j < name.length; j++) {
					if(name[j]=="") {
						// No longer allow default partition
						// names["<default>"] = "";
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
		var opt;
                if(previousOptions[names[partKeys[i]]]) {
                   opt = previousOptions[names[partKeys[i]]];
                   delete previousOptions[names[partKeys[i]]];
                } else {
                   opt = document.createElement("option");
                }
		opt.text = partKeys[i];
		opt.value = names[partKeys[i]];
		opt.selected = previouslySelected[opt.value];
                select.add(opt);
                populatePatientName(partKeys[i], opt);
	}		
};


function PartitionBox(openICE, selectElement, domainId, changePartition, defaultPartition) {
        if(!defaultPartition) {
            defaultPartition = "";
        }
        
	var publicationsTable = openICE.createTable({domain:domainId, partition:[], topic:'DCPSPublication'});
	publicationsTable.on('sample', function(e) {
                var publication = e.sample.data; 
                if(publication.partition && publication.partition.name && publication.partition.name.length) {
                     var name = publication.partition.name;
                     for(var j = 0; j < name.length; j++) {
		         if(0 == name[j].indexOf("MRN=")) {
                             var nameFound = false;
                             for(var i = 0; i < selectElement.options.length; i++) {
                                 if(selectElement.options[i].value == name[j]) {
                                     nameFound = true;
                                 }
                             }
                             if(!nameFound) {
                                 console.log("rebuild where " + name[j] + " not found");
                                 rebuildSelect(e, selectElement, defaultPartition);
                                 return;
                             }
                         }
                    }
                }
	});
	publicationsTable.on('afterremove', function(e) {
                if(e.row.samples.length < 1) {
                    // console.log("rebuild on afterremove with no sample history");
                    // If there is no sample history then no samples were reported; do nothing
                    // rebuildSelect(e, selectElement, defaultPartition);
                    return;
                }
                var publication = e.row.samples[e.row.samples.length-1];
                if(publication.partition && publication.partition.name && publication.partition.name.length) {
                    var name = publication.partition.name;
                    for(var j = 0; j < name.length; j++) {
                        if(name[j].indexOf("MRN=")) {
                            console.log("Rebuild on removal of a " + name[j]);
                            // All we can do is rebuild on delete because we don't have any kind of reference counting
		            rebuildSelect(e, selectElement, defaultPartition);
                            return;
                        }
                    }
                }
	});
	for(var i = 0; i < selectElement.options.length; i++) {
		if(""==selectElement.options[i].text) {
			return;
		}
	}

	var opt = document.createElement("option");
	opt.text = defaultPartition;
	opt.value = defaultPartition;
	opt.selected = true;
        selectElement.add(opt);
        populatePatientName(defaultPartition, opt);

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
