function calcTableKey(data) {
	// Use blank for null partition
	data.partition = null == data.partition ? "" : data.partition;
	// TODO partition is now an array this is probably broken
	return data.domain + '-' + data.partition + '-' + data.topic;
}

function Sample(row,msg) {
	this.row = row;
	this.sourceTimestamp = msg.sourceTimestamp;
	this.receptionTimestamp = msg.receptionTimestamp;
	this.data = msg.sample;
	this.toString = function() {
		return "@"+new Date(this.sourceTimestamp)+ " " + JSON.stringify(this.data);
	};
}

function Row(table, rowId) {
	this.type = 'Row';
	this.table = table;
	this.rowId = rowId;
	this.keyValues = {};
	this.samples = [];
	this.toString = function() {
		return this.table+" "+this.rowId+" "+JSON.stringify(this.keyValues)+" "+this.samples.length;
	};
}

function Table(openICE, domain, partition, topic) {
	this.type = 'Table';
	this.openICE = openICE;
	this.domain = domain;
	this.partition = partition;
	this.topic = topic;
	this.rows = {};
	this.toString = function() {
		return this.domain+" "+this.partition+" "+this.topic+" "+this.schema;
	};
	
	this.getRows = function(keys) {
		var matchingRows = [];
		for (rowKey in this.rows) {
	        if (this.rows.hasOwnProperty(rowKey)) {
	        	var row = this.rows[rowKey];
	        	// does this row match the incoming filter?
	        	var match = true;
	        	for(key in keys) {
	        		if(keys.hasOwnProperty(key)) {
	        			if(keys[key] != row.keyValues[key]) {
	        				match = false;
	        			}
	        		}
	        	}
	        	if(match) {
	        		matchingRows.push(row);
	        	}
	        }
		}
		return (matchingRows);
	}
}

function OpenICE(url) {
	this.type = 'OpenICE';
	this.connection = null;
	this.tables = {};
	this.url = url;
	this.maxSamples = 100;
	
	this.toString = function() {
		return this.url;
	};

	this.open = function() {
		this.connection = new WebSocket(this.url);
		this.connection.openICE = this;
		this.connection.onmessage = function(e) {
			var data = JSON.parse(e.data);

			// Find the appropriate reader
			var tableKey = calcTableKey(data);

			var table = this.openICE.tables[tableKey];
			if (null == table) {
				console.log("Nonfatal unknown Table (tableKey="+tableKey+")");
				return;
			}

			if ("Schema" == data.messageType) {
				table.schema = data.sample;
				this.openICE.onschema(this.openICE, table);
			} else if ("Add" == data.messageType) {
				var row = table.rows[data.identifier];
				if (null == row) {
					row = new Row(table, data.identifier);
				}
				row.keyValues = data.sample;
				this.openICE.onbeforeadd(this.openICE, table, row);
				table.rows[data.identifier] = row;
				this.openICE.onafteradd(this.openICE, table, row);
			} else if ("Remove" == data.messageType) {
				var row = table.rows[data.identifier];
				if (null != row) {
					this.openICE.onbeforeremove(this.openICE, table, row);
					delete table.rows[data.identifier];
					this.openICE.onafterremove(this.openICE, table, row);
				}
			} else if ("Sample" == data.messageType) {
				var row = table.rows[data.identifier];
				if (null == row) {
					console.log("No such row for sample");
					return;
				}
				var sample = new Sample(row, data);
				row.samples.push(sample);
				while(row.samples.length>=this.openICE.maxSamples) {
					this.openICE.onexpire(this.openICE, table, row, row.samples.shift());
				}
				this.openICE.onsample(this.openICE, table, row, sample);
			} else {
				console.log("Unknown message:" + e.data);
			}
		};
		this.connection.onopen = function(e) {
			console.log("Connection opened");
		};
		this.connection.onerror = function(e) {
			console.log("Connection error");
		};
		this.connection.onclose = function(e) {
			console.log("Connection closed");
		};
	};
	
	this.getTable = function(args) {
	    var tableKey = calcTableKey(args);
	    return this.tables[tableKey];
	}
	
	this.createTable = function(args) {
		var message = new Object();
		message.messageType = "Subscribe";
		message.domain = args.domain;
		message.topic = args.topic;
		message.partition = args.partition;
		//console.log('create '+args.domain+" "+args.topic+" "+args.partition);
		var tableKey = calcTableKey(message);
		var table = this.tables[tableKey];
		if (null == table) {
			table = new Table(this, args.domain, args.partition, args.topic);
			this.tables[tableKey] = table;
			this.onaddtable(this, table);
			this.connection.send(JSON.stringify(message));
		}
		return table;
	};
	
	this.destroyTable = function(args) {
		var message = new Object();
		message.messageType = "Unsubscribe";
		message.domain = args.domain;
		message.topic = args.topic;
		message.partition = args.partition;
		//console.log('destroy '+args.domain+" "+args.topic+" "+args.partition);
		this.connection.send(JSON.stringify(message));
		
		var tableKey = calcTableKey(message);
		var table = this.tables[tableKey];
		if (null != table) {
			for (rowKey in table.rows) {
		        if (table.rows.hasOwnProperty(rowKey)) {
//			Object.keys(table.rows).forEach(function(rowKey) {
		        	var row = table.rows[rowKey];
					this.onbeforeremove(this, table, row);
					delete table.rows[rowKey];
					this.onafterremove(this, table, row);
		        }
			}
			delete this.tables[tableKey];
		}
		this.onremovetable(this, table);
		return table;
	}

	this.close = function() {
		this.connection.close();
	};
	this.onschema = function(openICE, table) {
	};
	this.onbeforeadd = function(openICE, table, row) {
	};
	this.onafteradd = function(openICE, table, row) {
	};
	this.onbeforeremove = function(openICE, table, row) {
	};
	this.onafterremove = function(openICE, table, row) {
	};
	this.onsample = function(openICE, table, row, sample) {
	};
	this.onexpire = function(openICE, table, row, sample) {
	};
	this.onaddtable = function(openICE, table) {
	};
	this.onremovetable = function(openICE, table) {
	};
}

