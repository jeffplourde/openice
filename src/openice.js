/**
  @overview
  @author Jeff Plourde <jeff@mdpnp.org>
  @License BSD 2-Clause License
*/

var io = require('socket.io-client');

var Emitter = require('component-emitter');

module.exports = OpenICE;

Emitter(OpenICE.prototype);

/** 
 * Calculates a string identifier for a table.
 * @param {object} data - Object containing domain, partition and topic attributes
 */
function calcTableKey(data) {
	// Use blank for null partition
	data.partition = 'undefined'==typeof data.partition || null == data.partition ? "" : data.partition;
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
}

Sample.prototype.toString = function() {
	return "@"+new Date(this.sourceTimestamp)+ " " + JSON.stringify(this.data);
}

/**
 * Represents a data row for a unique instance of table data.
 * @constructor
 * @param {Table} table - The parent table for this row.
 * @param {string} rowId - Unique identifier for this row.
 */
function Row(table, rowId) {
	/** @property {Table} table - The parent table containing this row. */
	this.table = table;
	/** @property {string} rowId - Unique identifier for this row. */
	this.rowId = rowId;
	/** @property {string[]} keyValues - Invariant values (constitute the primary key) for this row. */
	this.keyValues = {};
	/** @property {Sample[]} samples - Collection of data samples for this row. */
	this.samples = [];
}

Row.prototype.toString = function() {
	return this.table+" "+this.rowId+" "+JSON.stringify(this.keyValues)+" "+this.samples.length;
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
}

Table.prototype.toString = function() {
	return this.domain+" "+this.partition+" "+this.topic+" "+this.schema;
}

/**
 * Returns rows with matching values for the specified key fields.
 * @public
 * @param {object} keys - Key values to match.
 */
Table.prototype.getRows = function(keys) {
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

/**
 * Represents a connection back to the OpenICE system.
 * @constructor
 * @param {string} url - The URL to connect to the OpenICE system.
 */
function OpenICE(url) {
	/** @property {string} url - The URL of the remote OpenICE server. */
	this.url = url;

	this.connection = new io(this.url);

	/** @property {object} tables - Tables hashed by table key string. */
	this.tables = {};
	
	/** @property {int} maxSamples - Max samples preserved for each row. */
	this.maxSamples = 100;

	var self = this;

	this.connection.on('dds', function(data) {
		// Find the appropriate reader
		var tableKey = calcTableKey(data);

		var table = self.tables[tableKey];
		if (null == table) {
			console.log("Nonfatal unknown Table (tableKey="+tableKey+")");
			return;
		}

		if ("Schema" == data.messageType) {
			table.schema = data.sample;
			self.emit('schema', self, table);
		} else if ("Add" == data.messageType) {
			var row = table.rows[data.identifier];
			if (null == row) {
				row = new Row(table, data.identifier);
			}
			row.keyValues = data.sample;
			self.emit('beforeadd', self, table, row);
			table.rows[data.identifier] = row;
			self.emit('afteradd', self, table, row);
		} else if ("Remove" == data.messageType) {
			var row = table.rows[data.identifier];
			if (null != row) {
				self.emit('beforeremove', self, table, row);
				delete table.rows[data.identifier];
				self.emit('afterremove', self, table, row);
			}
		} else if ("Sample" == data.messageType) {
			var row = table.rows[data.identifier];
			if (null == row) {
				console.log("No such row for sample");
				return;
			}
			var sample = new Sample(row, data);
			row.samples.push(sample);
			while(row.samples.length>=self.maxSamples) {
				self.emit('expire', self, table, row, row.samples.shift());
			}
			self.emit('sample', self, table, row, sample);
		} else {
			console.log("Unknown message:" + e.data);
		}
	});
	this.connection.on('connect', function() {
		self.emit('open', self)
	});
	this.connection.on('reconnect', function(attemptNumber) {
		self.emit('open', self);
	});
	this.connection.on('reconnect_attempt', function() {
	});
	this.connection.on('reconnecting', function(attemptNumber) {
	});
	this.connection.on('reconnect_error', function(err) {
	});
	this.connection.on('reconnect_failed', function() {
	});
	this.connection.on('error', function(err) {
		self.emit('error', self, err);
		self.destroyAllTables(false);
	});
	this.connection.on('disconnect', function() {
		self.emit('close', self);
		self.destroyAllTables(false);
	});
}

OpenICE.prototype.toString = function() {
	return this.url;
}

/**
 * Retrieves a table by identifying information.
 * If the table does not exist it is NOT created.
 * @public
 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
 */
OpenICE.prototype.getTable = function(args) {
    var tableKey = calcTableKey(args);
    return this.tables[tableKey];	
}

/**
 * Creates a table with identifying information (or returns existing table if already created)
 * and requests table information from the server.
 * @public
 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
 */
OpenICE.prototype.createTable = function(args) {
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
		this.emit('addtable', this, table);
		this.connection.emit('dds',message);
	}
	return table;
}

OpenICE.prototype.destroyAllTables = function(unsubscribe) {
	var keys = Object.keys(this.tables);
	for(var i = 0; i < keys.length; i++) {
		var tableKey = keys[i];
		var table = this.tables[tableKey];
		this.destroyTable(table, unsubscribe);
	}
}

/**
 * Destroys a table with identifying information (or no op if it does not exist)
 * and requests that the server stop sending information about the table.
 * @public
 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
 */
OpenICE.prototype.destroyTable = function(args, unsubscribe) {
	var message = new Object();
	message.messageType = "Unsubscribe";
	message.domain = args.domain;
	message.topic = args.topic;
	message.partition = args.partition;
 
	if(typeof unsubscribe != 'undefined' && unsubscribe) {
		this.connection.emit('dds', message);
	}
	
	var tableKey = calcTableKey(message);
	var table = this.tables[tableKey]; 
	if (null != table) {
		var keys = Object.keys(table.rows);
		for(var i = 0; i < keys.length; i++) {
			var rowKey = keys[i];
        	var row = table.rows[rowKey];
        	this.emit('beforeremove', this, table, row);
			delete table.rows[rowKey];
			this.emit('afterremove', this, table, row);
		}
		delete this.tables[tableKey];
	}
	this.emit('removetable', this, table);
	return table;
}

OpenICE.prototype.close = function() {
	this.connection.disconnect();
}

