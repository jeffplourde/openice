var io = require('socket.io-client');
var jsmpeg = require('./jsmpg.js');

function start(e) {

		// Show loading notice
		var canvas = document.getElementById('videoCanvas'+e);
		var ctx = canvas.getContext('2d');
		ctx.fillStyle = '#444';
		ctx.fillText('Loading...', canvas.width/2-30, canvas.height/3);

		// Setup the WebSocket connection and start the player
		var client = new io('/'+e);

		var player = new jsmpeg(client, {canvas:canvas});
}
	start('evita');
	start('ivy');
	start('eye');
//	start('3');