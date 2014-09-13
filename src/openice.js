/**
  @overview A JavaScript library for remote communication with the OpenICE system.
  @author Jeff Plourde <jeff@mdpnp.org>
  @License BSD 2-Clause License
*/

"use strict";

var io = require('socket.io-client');

var Emitter = require('component-emitter');
 
module.exports = exports = OpenICE;

Emitter(OpenICE.prototype);
Emitter(Table.prototype);
Emitter(Row.prototype);
Emitter(Sample.prototype);

/** 
 * Calculates a string identifier for a table.
 * @param {object} data - Object containing domain, partition and topic attributes
 * @access private
 */
function calcTableKey(data) {
	// Use blank for null partition
	data.partition = 'undefined'==typeof data.partition || null == data.partition ? "" : data.partition;
	return data.domain + '-' + data.partition + '-' + data.topic;
}

/**
 * Represents a data sample at a point in time.
 * @constructor
 * @access protected 
 * @param {Row} row - The parent row for this data sample.
 * @param {object} msg - The message containing details for this sample including sourceTimestamp, receptionTimestamp, and sample.
 */
function Sample(row,msg) {
	/** 
	 * @public
	 * @property {Row} row - The parent row. 
	 */
	this.row = row;
	
	/** 
	 * @public 
	 * @property {Date} sourceTimestamp - Timestamp at the data source. 
	 */
	this.sourceTimestamp = Date.parse(msg.sourceTimestamp);

	/** 
	 * @public 
	 * @property {object} data - The sample data itself. 
	 */
	this.data = msg.sample;
}

/**
 * @access public
 */
Sample.prototype.toString = function() {
	return "@"+new Date(this.sourceTimestamp)+ " " + JSON.stringify(this.data);
}

/**
 * @access private
 * @fires Sample#expire
 */
Sample.prototype.expire = function() {
	/**
	 * Fired when a sample is removed from the row by expiration policy.
	 * @event Sample#Sample:expire
	 * @type {object}
	 * @property {Sample} sample - The expired sample
	 */
	this.emit('expire', {'sample': this});
	this.off();
};

/**
 * Represents a data row for a unique instance of table data.
 * @constructor
 * @access protected
 * @param {Table} table - The parent table for this row.
 * @param {string} rowId - Unique identifier for this row.
 */
function Row(table, rowId) {
	/** 
	 * @access public
	 * @property {Table} table - The parent table containing this row. 
	 */
	this.table = table;

	/** 
	 * @access public
	 * @property {string} rowId - Unique identifier for this row. 
	 */
	this.rowId = rowId;

	/**
	 * @access public 
	 * @property {string[]} keyValues - Invariant values (constitute the primary key) for this row. 
	 */
	this.keyValues = {};

	/** 
	 * @access public
	 * @property {Sample[]} samples - Collection of data samples for this row. 
	 */
	this.samples = [];


	Object.defineProperty(this, 'latest_sample', {
		get: function() {
			return this.samples.length > 0 ? this.samples[this.samples.length-1] : null;
		}
	});

}

/**
 * @access public
 */
Row.prototype.toString = function() {
	return this.table+" "+this.rowId+" "+JSON.stringify(this.keyValues)+" "+this.samples.length;
}

/**
 * Add a sample to the row
 * @access private
 * @param {object} data - data containing sample information
 * @fires Row#expire
 */
Row.prototype.addSample = function(data) {
	var sample = new Sample(this, data);
	var self = this;
	sample.on('expire', function(evt) {
		/**
	 	 * Fired when a sample is removed from the row by expiration policy.
	     * @event Row#Row:expire
	     * @type {object}
	     * @property {Row} row - The Row previously containing the Sample
	     * @property {Sample} sample - The expired Sample
	     */
		self.emit('expire', {'row':self, 'sample':sample});
	});
	if(this.samples.length==0||this.samples[this.samples.length-1].sourceTimestamp<sample.sourceTimestamp) {
		// Newer than any existing sample
		this.samples.push(sample);
	} else if(sample.sourceTimestamp < this.samples[0].sourceTimestamp) {
		// Older than any existing sample
		this.samples.unshift(sample);
	} else {
		// Interleaved within existing samples
		for(var i = 0; i < this.samples[i].length; i++) {
			if(this.samples[i].sourceTimestamp==sample.sourceTimestamp) {
				console.log("Not adding duplicate sample at " + sample.sourceTimestamp);
			} else if(this.samples[i].sourceTimestamp>sample.sourceTimestamp) {
				this.samples.splice(i-1,0,sample);
				break;
			}
		}
	}
	while(this.samples.length>this.table.openICE.maxSamples) {
		this.samples.shift().expire();
	}
	/**
	 * Fired when a sample is added to the row
	 * @event Row#Row:sample
	 * @type {object}
	 * @property {Row} row - The Row containing the new sample
	 * @property {Sample} sample - The newly added Sample
	 */
	this.emit('sample', {'row':this, 'sample':sample});
};

Row.prototype.removeAllSamples = function() {
	while(this.samples.length>0) {
		this.samples.shift().expire();
	}
};

/**
 * Represents a data table.
 * @constructor
 * @access protected
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
	/**
	 * A schema has been (re)assigned to the table
	 * @event Table#Table:schema 
	 * @type {object}
	 * @property {Table} table - The table 
	 * @property {object} schema - The schema
	 */	
	this.emit('schema', {'table':this, 'schema':schema});
};

Table.prototype.addRow = function(data) {
	var row = this.rows[data.identifier];
	if (null == row) {
		row = new Row(this, data.identifier);
		var self = this;
		row.on('sample', function(e) {
			/**
			 * A Sample is added to a Row of the table
			 * @event Table#Table:sample 
			 * @type {object}
			 * @property {Table} table - The table 
			 * @property {Row} row - The row
			 * @property {Sample} sample - The new sample
			 */
			self.emit('sample', {'table':self, 'row':e.row, 'sample':e.sample});
		});
	}
	row.keyValues = data.sample;
	/**
	 * A new row is about to be added to the table
	 * @event Table#Table:beforeadd
	 * @type {object}
	 * @property {Table} table - The table
	 * @property {Row} row - The new row
	 */
	this.emit('beforeadd', {'table':this, 'row':row});
	this.rows[data.identifier] = row;
	/**
	 * A new row was just added to the table
	 * @event Table#Table:afteradd
	 * @type {object}
	 * @property {Table} table - The table
	 * @property {Row} row - The new row
	 */
	this.emit('afteradd', {'table': this, 'row':row});
};

Table.prototype.removeRow = function(data) {
	var row = this.rows[data.identifier];
	if (null != row) {
		/**
		 * A row is about to be removed from the table
		 * @event Table#Table:beforeremove
		 * @type {object}
		 * @property {Table} table - The table
		 * @property {Row} row - The row about to be removed
		 */
		this.emit('beforeremove', {'table':this, 'row':row});
		this.rows[data.identifier].off();
		this.rows[data.identifier].removeAllSamples();
		delete this.rows[data.identifier];
		/**
		 * A row has been removed from the table
		 * @event Table#Table:afterremove
		 * @type {object}
		 * @property {Table} table - The table
		 * @property {Row} row - The removed row
		 */
		this.emit('afterremove', {'table':this, 'row':row});
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
 * @access public
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
		/**
		 * The connection has been (re)opened
		 * @event OpenICE#OpenICE:open
		 * @type {object}
		 * @property {OpenICE} openICE
		 */
		self.emit('open', {'openICE':self});
		self.unsubscribeAll();
		self.subscribeAllTables();
		self.connected = true;
	});
	this.connection.on('reconnect', function(attemptNumber) {
		self.emit('open', {'openICE':self});
		self.unsubscribeAll();
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
		/**
		 * An error has occurred
		 * @event OpenICE#OpenICE:error
		 * @type {object}
		 * @property {OpenICE} openICE - The OpenICE object
		 * @property {object} err - Further information about the error
		 */		
		self.emit('error', {'openICE':self, 'err':err});
		self.removeAllRows();
		self.connected = false;
	});
	this.connection.on('disconnect', function() {
		/**
		 * The connection has been closed
		 * @event OpenICE#OpenICE:close
		 * @type {object}
		 * @property {OpenICE} openICE
		 */		
		self.emit('close', {'openICE':self});
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
 * @returns {Table} 
 */
OpenICE.prototype.createTable = function(args) {
	var tableKey = calcTableKey(args);
	var table = this.tables[tableKey];
	if (null == table) {
		table = new Table(this, args.domain, args.partition, args.topic);
		var self = this;
		table.on('sample', function(evt) {
			/**
			 * A new sample has been added to a row of a table
			 * @event OpenICE#OpenICE:sample
			 * @type {object}
			 * @property {OpenICE} openICE - The OpenICE object
			 * @property {Table} table - The table
			 * @property {Row} row - The row
			 * @property {Sample} sample - The new sample
			 */							
			self.emit('sample', {'openICE':self, 'table':evt.table, 'row':evt.row, 'sample':evt.sample});
		});
		table.on('schema', function(evt) {
			/**
			 * A schema has been (re)assigned to a table
			 * @event OpenICE#OpenICE:schema
			 * @type {object}
			 * @property {OpenICE} openICE - The OpenICE object
			 * @property {Table} table - The table
			 * @property {object} schema - The new schema
			 */							
			self.emit('schema', {'openICE':self, 'table':evt.table, 'schema':evt.schema});
		});
		table.on('beforeremove', function(evt) {
			/**
			 * A row will be removed from a table
			 * @event OpenICE#OpenICE:beforeremove
			 * @type {object}
			 * @property {OpenICE} openICE - The OpenICE object
			 * @property {Table} table - The table
			 * @property {Row} Row - The row to be removed
			 */							
			self.emit('beforeremove', {'openICE':self, 'table':evt.table, 'row':evt.row});
		});
		table.on('afterremove', function(evt) {
			/**
			 * A row has been removed from a table
			 * @event OpenICE#OpenICE:afterremove
			 * @type {object}
			 * @property {OpenICE} openICE - The OpenICE object
			 * @property {Table} table - The table
			 * @property {Row} Row - The removed row
			 */							
			self.emit('afterremove', {'openICE':self, 'table':evt.table, 'row':evt.row});
		});
		table.on('beforeadd', function(evt) {
			/**
			 * A row will be added to a table
			 * @event OpenICE#OpenICE:beforeadd
			 * @type {object}
			 * @property {OpenICE} openICE - The OpenICE object
			 * @property {Table} table - The table
			 * @property {Row} Row - The row to be added
			 */							
			self.emit('beforeadd', {'openICE':self, 'table':evt.table, 'row':evt.row});
		});
		table.on('afteradd', function(evt) {
			/**
			 * A row has been added to a table
			 * @event OpenICE#OpenICE:beforeadd
			 * @type {object}
			 * @property {OpenICE} openICE - The OpenICE object
			 * @property {Table} table - The table
			 * @property {Row} Row - The added row
			 */										
			self.emit('afteradd', {'openICE':self, 'table':evt.table, 'row':evt.row});
		});
		this.tables[tableKey] = table;
		/**
		 * A table has been added
		 * @event OpenICE#OpenICE:addtable
		 * @type {object}
		 * @property {OpenICE} openICE - The OpenICE object
		 * @property {Table} table - The added table
		 */		
		this.emit('addtable', {'openICE':this, 'table':table});
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

OpenICE.prototype.unsubscribeAll = function() {
	this.connection.emit('dds', {messageType:'UnsubscribeAll'});
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
		/**
		 * A table has been removed
		 * @event OpenICE#OpenICE:removetable
		 * @type {object}
		 * @property {OpenICE} openICE - The OpenICE object
		 * @property {Table} table - The removed table
		 */		
		this.emit('removetable', {'openICE':this, 'table':table});

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

