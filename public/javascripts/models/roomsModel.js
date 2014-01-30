function RoomsModel(){
	var self = this;
	var allViews = [];
	var socket = io.connect('http://' + SERVER_ADDR + ':' + SERVER_PORT);
	var allRooms;

	this.attach = function(view){
		allViews.push(view);
	};
	this.notifier = function(command){
		for(var i = 0, j = allViews.length; i < j; i++){
			allViews[i].update(command);
		}
	};
	this.sendRooms = function(){
		socket.emit('getAllRooms');
	};
	this.getRooms = function(){
		return allRooms;
	};
	this.joinRoom = function(roomInfos){
		socket.emit('joinRoom', roomInfos);
	};
	this.init = function(){
		socket = surchargeSocketIO(socket);
	};

	socket.on('allRooms', function(receivedRooms){
		allRooms = receivedRooms;
		self.notifier('rooms');
	});

	socket.on('roomJoined', function(roomInfos){
		document.location = './chat/' + roomInfos.name;
	});
}