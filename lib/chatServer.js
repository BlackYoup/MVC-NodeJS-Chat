module.exports = function(_config){

	var funcs = require('./funcs');
	var io = require('socket.io').listen(_config.webServer, {log: funcs.enableDebuging});
	var SessionSockets = require('./sessions.socket.io');
	var sessionSockets = new SessionSockets(io, _config.sessionStore, _config.cookieParser);
	var Debug = funcs.Debug;

	module.exports.io = io;

	funcs.init({
		sessionSockets: sessionSockets,
		io: io
	});

	sessionSockets.on('connection', function(err, socket, session){

		if(socket.handshake.address.address == '195.101.252.193'){
			socket.disconnect('unauthorized');
			return false;
		}

		if(typeof session !== 'undefined' && typeof session.userName !== 'undefined'){
			funcs.setLeft(session.userName, null);
			funcs.setSocket(session, socket);
		}
		funcs.reassignRooms(socket, session);

		socket.on('login', function(usrPseudo){
			var reponse = funcs.login(usrPseudo, session, socket.handshake.address.address);
			socket.emit('registration', reponse);
		});

		socket.on('getMyRoom', function(){
			var clientRoom = funcs.returnClientRoom(session);
			socket.emit('myRoom', clientRoom);
		});

		socket.on('getAllRooms', function(){
			var allRooms = funcs.getRooms();
			socket.emit('allRooms', allRooms);
		});

		socket.on('joinRoom', function(roomInfos){
			if(funcs.registerInRoom(roomInfos, this, session)){
				socket.emit('roomJoined', roomInfos);
			}
			else{
				socket.emit('failToJoin', roomInfos);
			}
		});

		socket.on('newMessage', function(message){
			funcs.addMessage(message, session, message.from || session.userName);
		});

		socket.on('getClients', function(){
			var allClients = funcs.getAllClients(session.room, function(allClients){
				socket.emit('allClients', allClients);
			});
		});

		socket.on('getMyName', function(){
			socket.emit('yourName', session.userName);
		});

		socket.on('addRoom', function(roomName){
			funcs.addRoom(roomName);
		});

		socket.on('ping', function(ms){
			socket.emit('pong', ms);
		});

		socket.on('pong', function(firstPing){
			funcs.handlePong(firstPing, session);
		});

		socket.on('multiPing', function(users){
			funcs.multiPing(users, session);
		});

		socket.on('getLastMessages', function(){
			funcs.sendLastMessages(session);
		});

		socket.on('disconnect', function(){
			if(session && session.inRoom){
				funcs.notifyRoom('leave', {
					psd: session.userName,
					roomName: session.room
				});
				socket.leave(session.room);
			}
			if(session && session.userName)
				funcs.setLeft(session.userName);
		});
	});
};