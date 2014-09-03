/**
  @overview
  @author Jeff Plourde <jeff@mdpnp.org>
  @License BSD 2-Clause License
*/

"use strict";

var io = require('socket.io-client');

var Emitter = require('component-emitter');
 
module.exports = OpenICE;

Emitter(OpenICE.prototype);
Emitter(Table.prototype);
Emitter(Row.prototype);
Emitter(Sample.prototype);
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

Sample.prototype.expire = function() {
	this.emit('expire', this);
	this.off();
};

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

Row.prototype.addSample = function(data) {
	var sample = new Sample(this, data);
	var self = this;
	sample.on('expire', function(sample) {
		self.emit('expire', self, sample);
	});
	this.samples.push(sample);
	while(this.samples.length>=this.table.openICE.maxSamples) {
		this.samples.shift().expire();
	}
	this.emit('sample', this, sample);
};

Row.prototype.removeAllSamples = function() {
	while(this.samples.length>0) {
		this.samples.shift().expire();
	}
};

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

Table.prototype.setSchema = function(schema) {
	this.schema = schema;
	this.emit('schema', this, schema);
};

Table.prototype.addRow = function(data) {
	var row = this.rows[data.identifier];
	if (null == row) {
		row = new Row(this, data.identifier);
		var self = this;
		row.on('sample', function(row, sample) {
			self.emit('sample', self, row, sample);
		});
	}
	row.keyValues = data.sample;
	this.emit('beforeadd', this, row);
	this.rows[data.identifier] = row;
	this.emit('afteradd', this, row);
};

Table.prototype.removeRow = function(data) {
	var row = this.rows[data.identifier];
	if (null != row) {
		this.emit('beforeremove', this, row);
		this.rows[data.identifier].off();
		this.rows[data.identifier].removeAllSamples();
		delete this.rows[data.identifier];
		this.emit('afterremove', this, row);
	}
};

Table.prototype.removeAllRows = function() {
	var keys = Object.keys(this.rows);
	for(var i = 0; i < keys.length; i++) {
		var rowKey = keys[i];
    	this.removeRow({identifier:rowKey});
	}
};

Table.prototype.toString = function() {
	return this.domain+" "+this.partition+" "+this.topic+" "+this.schema;
};

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
};

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

	this.connected = false;

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
			table.setSchema(data.sample);
		} else if ("Add" == data.messageType) {
			table.addRow(data);
		} else if ("Remove" == data.messageType) {
			table.removeRow(data);
		} else if ("Sample" == data.messageType) {
			var row = table.rows[data.identifier];
			if (null == row) {
				console.log("No such row for sample");
				return;
			}
			row.addSample(data);
		} else {
			console.log("Unknown message:" + e.data);
		}
	});
	this.connection.on('connect', function() {
		self.emit('open', self);
		self.subscribeAllTables();
		self.connected = true;
	});
	this.connection.on('reconnect', function(attemptNumber) {
		self.emit('open', self);
		self.subscribeAllTables();
		self.connected = true;
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
		self.removeAllRows();
		self.connected = false;
	});
	this.connection.on('disconnect', function() {
		self.emit('close', self);
		self.removeAllRows();
		self.connected = false;
	});
};

OpenICE.prototype.toString = function() {
	return this.url;
};

/**
 * Retrieves a table by identifying information.
 * If the table does not exist it is NOT created.
 * @public
 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
 */
OpenICE.prototype.getTable = function(args) {
    var tableKey = calcTableKey(args);
    return this.tables[tableKey];	
};

/**
 * Creates a table with identifying information (or returns existing table if already created)
 * and requests table information from the server.
 * @public
 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
 */
OpenICE.prototype.createTable = function(args) {
	var tableKey = calcTableKey(args);
	var table = this.tables[tableKey];
	if (null == table) {
		table = new Table(this, args.domain, args.partition, args.topic);
		var self = this;
		table.on('sample', function(table, row, sample) {
			self.emit('sample', self, table, row, sample);
		});
		table.on('schema', function(table) {
			self.emit('schema', self, table);
		});
		table.on('beforeremove', function(table, row) {
			self.emit('beforeremove', self, table, row);
		});
		table.on('afterremove', function(table, row) {
			self.emit('afterremove', self, table, row);
		});
		table.on('beforeadd', function(table, row) {
			self.emit('beforeadd', self, table, row);
		});
		table.on('afteradd', function(table, row) {
			self.emit('afteradd', self, table, row);
		});
		this.tables[tableKey] = table;
		this.emit('addtable', this, table);
		if(this.connected) {
			this.subscribe(table);
		}
	}
	return table;
};

OpenICE.prototype.subscribe = function(table) {
	var message = {messageType:'Subscribe',domain:table.domain,partition:table.partition,topic:table.topic};
	this.connection.emit('dds', message);
};

OpenICE.prototype.destroyAllTables = function() {
	var keys = Object.keys(this.tables);
	for(var i = 0; i < keys.length; i++) {
		var tableKey = keys[i];
		var table = this.tables[tableKey];
		this.destroyTable(table);
	}
};

OpenICE.prototype.removeAllRows = function() {
	var keys = Object.keys(this.tables);
	for(var i = 0; i < keys.length; i++) {
		var tableKey = keys[i];
		var table = this.tables[tableKey];
		table.removeAllRows();
	}
};

OpenICE.prototype.subscribeAllTables = function() {
	var keys = Object.keys(this.tables);
	for(var i = 0; i < keys.length; i++) {
		var tableKey = keys[i];
		var table = this.tables[tableKey];
		this.subscribe(table);
	}
};

/**
 * Destroys a table with identifying information (or no op if it does not exist)
 * and requests that the server stop sending information about the table.
 * @public
 * @param {object} args - Contains attributes domain, partition, and topic identifying the table.
 */
OpenICE.prototype.destroyTable = function(args) {
	var tableKey = calcTableKey(args);
	var table = this.tables[tableKey]; 
	if (null != table) {
		if(this.connected) {
			this.unsubscribe(table);
		}
		table.removeAllRows();
		delete this.tables[tableKey];
		this.emit('removetable', this, table);

	}
	return table;
};

OpenICE.prototype.unsubscribe = function(table) {
	var message = {messageType:'Unsubscribe', domain:table.domain, partition:table.partition, topic: table.topic};
	this.connection.emit('dds', message);
};

OpenICE.prototype.close = function() {
	this.connection.disconnect();
};

