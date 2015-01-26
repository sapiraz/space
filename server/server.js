var fs = require('fs');
var players = new Array();
var WebSocketServer = require('websocket').server;
var http = require('http');


var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(8001, function() { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
	console.log("New connection");

    var connection = request.accept(null, request.origin);
	
	var p = new player(connection);
	this.lastMessage = "None";
	this.p = p;
	var self = this.p;
	listPlayers(p);
    players.push(p);
	
	
	//User just entered, lets send him the chunks around him.
	sendChunk(p);
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
        	var req = JSON.parse(message.utf8Data);
        	if(req.act == "chat"){
        		console.log(req.content);
        		var response = {act:"chat",content:req.content};
        		for(var i in players){
        			players[i].connection.send(JSON.stringify(response));
        		}
        		this.lastMessage = "SPOKE";
        	} else if(req.act == "move"){
        		sendChunk(self);
        		self.position.x = req.x;
        		self.position.y = req.y;
        		self.angle = req.angle;
        		//Check if there's a need to create a new chunk.
				
				//Check if the player needs to received a new chunk.
        		
				for(var i in players){
        			listPlayers(players[i]);
        		}
        	}
        	//console.log(message.utf8Data);

            // process WebSocket message
        }
    });

    connection.on('close', function(connection) {
        // close user 
        for(var i in players){
        	if(players[i].connection == connection){
        		players.splice(i,1);
        		console.log("Removed.");
        	}
        		
        }
    });
});
//var perlin = require('perlin-noise');
var ttt = require('simplex-noise');
var SimplexNoise = ttt;
//console.log("THIS IS IT:"+ttt);
function fool(){
	return 0.123123123;
}
var simplex = new SimplexNoise(fool);
//createChunk(1,1);
function createChunk(_x,_y){

	var realX = Math.floor(_x / 500);
	var realY = Math.floor(_y / 500);
	console.log("Creating chunk: " + 'world/'+realX+'_'+realY );
	var file = fs.open('world/'+realX+'_'+realY,'w+',function(err,fd){
		var started = false;
	for(var x = 0; x < 500; x++){
		for(var y = 0; y < 500; y++){

			var pixel = simplex.noise2D(Math.floor((500 * realX) + x)/250 , Math.floor((500 * realY) + y)/250);
			if(!started){
				started = true;
				console.log("x:" + ((500 * realX) + x));
			}
			
			if( parseInt(pixel.toString().substr(3,3)) >= 200){
				fs.writeSync(fd,1);
			} else {
				fs.writeSync(fd,0);
			}
		}
	}
	/*var pixels = perlin.generatePerlinNoise(500, 500);

	//var r = noise.perlin2((x + myplayer.position.left) / 1000,(y + myplayer.position.top) / 1000);

	for(var i in pixels){
		var val = pixels[i].toString();
		if(val.substr(3,2) == 3){
			fs.writeSync(fd,perlin.generatePerlinNoise(1, 1).toString()[2]);
		} else {
			fs.writeSync(fd,0);
		}
	}*/
	fs.close(fd);	
	});
}
function createPlanet(){
	//Only in a certain condition, this function will be run to generate a planet, it will use the string obtained by the noise pattern before to determine it's size, colors, and more.
	//Might be a solar system.
	
}
function sendChunk(p){
	var realX = Math.floor(p.position.x / 500);
	var realY = Math.floor(p.position.y / 500);
	fs.exists("world/"+realX+"_"+realY, function(exists){
		if(exists){
			var content = fs.readFileSync("world/"+realX+"_"+realY).toString();
			var chunks = new Array();
			chunks.push({x:(500 * realX ),y:(500 * realY),data:content});
			//console.log("Requesting chunk:" + (500 * realX ) + " | " + (500 * realY));
			var toSend = {act:"updateChunks",chunks:chunks};
			p.connection.send(JSON.stringify(toSend));
		} else {
			createChunk(p.position.x,p.position.y);
			sendChunk(p);
		}
	});
}
function broadcast(players){
	for(var i in players){

		player.connection.send();
	}
}

function listPlayers(player){
	var playerList = new Array();
	for(var i in players){
		if(player != players[i]){
		var p = {x:players[i].position.x,y:players[i].position.y,angle:players[i].angle};
		playerList.push(p);
		}
	}
	var response = {act:"listPlayers",players:playerList};
	player.connection.send(JSON.stringify(response));
}

var player = function(conn){
	this.name = "untitled";
	this.position = {x:0,y:0};
	this.angle = 0;
	this.connection = conn;
}
