/**
  @overview
  @author Jeff Plourde <jeff@mdpnp.org>
  @License BSD 2-Clause License
*/

/** 
 * Calculates a string identifier for a table.
 * @param {object} data - Object containing domain, partition and topic attributes
 */
function calcTableKey(data) {
	// Use blank for null partition
	data.partition = null == data.partition ? "" : data.partition;
	// TODO partition is now an array this is probably broken
	return data.domain + '-' + data.partition + '-' + data.topic;
}

/**
 * Represents a data sample at a point in time.
 * @constructor
 * @param {Row} row - The parent row for this data sample.
 * @param {object} msg - The message containing details for this sample including sourceTimestamp, receptionTimestamp, and sample.
 */
function Sample(row,msg) {
	/** @property {Row} row - The parent row. */
	this.row = row;
	
	/** @property {Time_t} sourceTimestamp - Timestamp at the data source. */
	this.sourceTimestamp = msg.sourceTimestamp;
	/** @property {Time_t} receptionTimestamp - Timestamp when the sample was received by the OpenICE server. */
	this.receptionTimestamp = msg.receptionTimestamp;
	/** @property {object} data - The sample data itself. */
	this.data = msg.sample;

	this.toString = function() {
		return "@"+new Date(this.sourceTimestamp)+ " " + JSON.stringify(this.data);
	};
}

/**
 * Represents a data row for a unique instance of table data.
 * @constructor
 * @param {Table} table - The parent table for this row.
 * @param {string} rowId - Unique identifier for this row.
 */
function Row(table, rowId) {
	this.type = 'Row';
	/** @property {Table} table - The parent table containing this row. */
	this.table = table;
	/** @property {string} rowId - Unique identifier for this row. */
	this.rowId = rowId;
	/** @property {string[]} keyValues - Invariant values (constitute the primary key) for this row. */
	this.keyValues = {};
	/** @property {Sample[]} samples - Collection of data samples for this row. */
	this.samples = [];
	this.toString = function() {
		return this.table+" "+this.rowId+" "+JSON.stringify(this.keyValues)+" "+this.samples.length;
	};
}

/**
 * Represents a data table.
 * @constructor
 * @param {OpenICE} openICE - The parent OpenICE connection.
 * @param {int} domain - The domain containing the table.
 * @param {string[]} partition - The partition containing the table.
 * @param {string} topic - The topic identifier for the table.
 */
function Table(openICE, domain, partition, topic) {
	this.type = 'Table';
	/** @property {OpenICE} openICE - The parent OpenICE instances. */
	this.openICE = openICE;
	/** @property {int} domain - The domain containing this table. */
	this.domain = domain;
	/** @property {string[]} partition - The partition(s) containing this table. */
	this.partition = partition;
	/** @property {string} topic - The Topic identifying this table. */
	this.topic = topic;
	/** @property {object} rows - Rows stored by row identifier. */
	this.rows = {};
	this.toString = function() {
		return this.domain+" "+this.partition+" "+this.topic+" "+this.schema;
	};
	
	/**
	 * Returns rows with matching values for the specified key fields.
	 * @public
	 * @param {object} keys - Key values to match.
	 */
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

/**
 * Represents a connection back to the OpenICE system.
 * @constructor
 * @param {string} url - The URL to connect to the OpenICE system.
 */
function OpenICE(url) {
	this.type = 'OpenICE';
	/** @property {string} url - The URL of the remote OpenICE server. */
	this.url = url;

	this.connection = io(this.url);
	/** @property {object} tables - Tables hashed by table key string. */
	this.tables = {};
	
	/** @property {int} maxSamples - Max samples preserved for each row. */
	this.maxSamples = 100;

	this.toString = function() {
		return this.url;
	};

	this.connection.openICE = this;

	this.connection.on('dds', function(e) {
				
		var data = JSON.parse(e);

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
	});
	this.connection.on('connect', function() {
		console.log('connect '+JSON.stringify(this));
		this.openICE.onopen(this);
	});
	this.connection.on('reconnect', function(attemptNumber) {
		console.log('reconnect');
		this.openICE.onopen(this);
	});
	this.connection.on('reconnect_attempt', function() {
		console.log('reconnect_attempt');
	});
	this.connection.on('reconnecting', function(attemptNumber) {
		console.log('reconnect_attempt');
	});
	this.connection.on('reconnect_error', function(err) {
		console.log('reconnect_attempt');
	});
	this.connection.on('reconnect_failed', function() {
		console.log('reconnect_attempt');
	});
	this.connection.on('error', function(err) {
		console.log('error');
		this.openICE.onerror(this);
		this.openICE.destroyAllTables();
	});
	this.connection.on('disconnect', function() {
		console.log('disconnect');
		this.openICE.onclose(this);
		this.openICE.destroyAllTables();
	});

	
	/**
	 * Retrieves a table by identifying information.
	 * If the table does not exist it is NOT created.
	 * @public
	 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
	 */
	this.getTable = function(args) {
	    var tableKey = calcTableKey(args);
	    return this.tables[tableKey];
	}

	/**
	 * Creates a table with identifying information (or returns existing table if already created)
	 * and requests table information from the server.
	 * @public
	 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
	 */
	this.createTable = function(args) {
		var message = new Object();
		message.messageType = "Subscribe";
		message.domain = args.domain;
		message.topic = args.topic;
		message.partition = args.partition;
		var tableKey = calcTableKey(message);
		var table = this.tables[tableKey];
		if (null == table) {
			table = new Table(this, args.domain, args.partition, args.topic);
			this.tables[tableKey] = table;
			this.onaddtable(this, table);
			if(this.connection!=null) {
				this.connection.emit('dds',JSON.stringify(message));
			}
		}
		return table;
	};
	
	this.destroyAllTables = function() {
		for(tableKey in this.tables) {
			if(this.tables.hasOwnProperty(tableKey)) {
				var table = this.tables[tableKey];
				this.destroyTable(table);
			}
		}
	};

	/**
	 * Destroys a table with identifying information (or no op if it does not exist)
	 * and requests that the server stop sending information about the table.
	 * @public
	 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
	 */
	this.destroyTable = function(args) {
		var message = new Object();
		message.messageType = "Unsubscribe";
		message.domain = args.domain;
		message.topic = args.topic;
		message.partition = args.partition;
		// console.console.log('destroy '+args.domain+" "+args.topic+" "+args.partition);
		if(this.connection!=null) { //  && (this.connection.readyState == WebSocket.OPEN || this.connection.readyState == WebSocket.CONNECTING)) {
			this.connection.send(JSON.stringify(message));
		}
		
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
	};

	this.close = function() {
		this.connection.disconnect();
	};

	/**
	 * Called when a schema definition arrives.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table for which a schema has arrived.
	 */
	this.onschema = function(openICE, table) {
	};

	/**
	 * Called before a row is added to a table.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table for which a row will be added.
	 * @param {Row} row - The row that will be added.
	 */	
	this.onbeforeadd = function(openICE, table, row) {
	};

	/**
	 * Called after a row is added to a table.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table to which a row has been added.
	 * @param {Row} row - The row that was added.
	 */	
	this.onafteradd = function(openICE, table, row) {
	};

	/**
	 * Called before a row is removed from a table.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table for which a row will be removed.
	 * @param {Row} row - The row that will be removed.
	 */	
	this.onbeforeremove = function(openICE, table, row) {
	};

	/**
	 * Called after a row has been removed from a table.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table from which a row has been removed.
	 * @param {Row} row - The row that was removed.
	 */	
	this.onafterremove = function(openICE, table, row) {
	};

	/**
	 * Called when a new data sample has arrived for a row.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The relevant table.
	 * @param {Row} row - The row to which a sample has been added.
	 * @param {Sample} sample - New sample that has been added.
	 */	
	this.onsample = function(openICE, table, row, sample) {
	};

	/**
	 * Called when a data sample expires and is removed from the cache.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table for which a schema has arrived.
	 * @param {Row} row - The row for which a data sample has expired.
	 * @param {Sample} sample - The data sample that has been removed by expiration policy.
	 */	
	this.onexpire = function(openICE, table, row, sample) {
	};

	/**
	 * Called when a table is added.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table that has been added.
	 */	
	this.onaddtable = function(openICE, table) {
	};

	/**
	 * Called when a table is removed.
	 * @param {OpenICE} openICE - The containing OpenICE object.
	 * @param {Table} table - The table that has been removed.
	 */	
	this.onremovetable = function(openICE, table) {
	};

	this.onopen = function(openICE) {

	};

	this.onclose = function(openICE) {

	};

	this.onerror = function(openICE) {

	};
}

