function ChatModel(){
	var self = this;
	var socket = io.connect('http://' + SERVER_ADDR + ':' + SERVER_PORT);
	var allViews = [];
	var loginStatus;
	var awaitingMessages = [];
	var allClients = [];
	var allLeft = [];
	var inRoom;
	var pendingMessages = 0;
	var myName;
	var mentions = [];
	var lastMessage;
	var awaiTingComplete;
	var systemMessage = [];

	this.attach = function(view){
		allViews.push(view);
	};
	this.notifier = function(command){
		for(var i = 0, j = allViews.length; i < j; i++){
			allViews[i].update(command);
		}
	};
	this.sendMessage = function(message){
		var toSend = true;
		if(message.text.indexOf('!') === 0){
			var breaker = message.text.indexOf(' ');
			if(breaker === -1){
				breaker = message.text.length;
			}
			var action = message.text.substr(1, breaker).trim();
			var splitted = message.text.split(' ');
			toSend = this.doAction(action, splitted);
		}
		if(typeof message.save === 'undefined' || message.save === true){
			lastMessage = message.text;
		}
		if(toSend){
			socket.emit('newMessage', message);
		}
		else{
			message.room = inRoom;
			message.from = myName;
			receiveMessage(message);
		}
	};
	this.getAllMessages = function(){
		var allMessages = awaitingMessages.slice(0);
		awaitingMessages.length = 0;
		return allMessages;
	};
	this.getClients = function(){
		socket.emit('getClients');
	};
	this.getAllClients = function(){
		return allClients;
	};
	this.setRoom = function(){
		socket.emit('getMyRoom');
	};
	this.getAllLeft = function(){
		var ret = allLeft.slice(0);
		allLeft.length = 0;
		
		return allLeft;
	};
	this.getPendingMessage = function(){
		return pendingMessages;
	};
	this.resetPendings = function(){
		pendingMessages = 0;
	};
	this.getMyName = function(){
		socket.emit('getMyName');
	};
	this.mention = function(args){
		var text = args.message.text();
		var ret = {
			message: args.message,
			class: null
		};

		var str = '@' + myName;
		var index = text.indexOf(str);
		var strLength = index + str.length;
		if(index > -1){
			var split = text.split('');
			if(strLength === text.length || split[strLength] === ' '){
				ret.class = 'mentionned';
			}
		}

		mentions.push(ret);
		this.notifier('mention');
	};
	this.getMentions = function(){
		var ret = mentions.slice(0);
		mentions.length = 0;
		return ret;
	};
	this.doAction = function(action, args){
		switch(action){
			case 'ping':
			console.log('action : ' + action);
				this.ping(args);
				return true;
			break;
			case 'clear':
				this.notifier('clear');
				return false;
			break;
			default:
				console.log('no action affected to : ' + action);
			break;
		}
	};
	this.ping = function(args){
		if(args.length <= 1){
			socket.emit('ping', new Date().getTime());
		}
		else if(args.length > 1){
			args.splice(0, 1);
			socket.emit('multiPing', args);
		}		
	};
	this.sendLastMessage = function(){
		this.notifier('lastMessageInput');
	};
	this.writeSelectedPseudo = function(userName){
		lastSelectedPseudo = userName;
		this.notifier('getSelectedPSeudo');
	};
	this.getLastSelectedPSeudo = function(){
		return '@' + lastSelectedPseudo;
	};
	this.getLastMessage = function(){
		return lastMessage;
	};
	this.autoComplete = function(toComplete){
		var index = toComplete.lastIndexOf('@');
		if(index > -1){
			var startUserName = toComplete.substr((index + 1));
			allClients.sort();
			var found = 0;
			var tempComplete = [];

			for(var i = 0, j = allClients.length; i < j; i++){
				var reg = new RegExp('^'+startUserName, 'i');
				if(allClients[i].match(reg) !== null){
					tempComplete.push(allClients[i]);
					++found;
				}
			}
			if(found < 1){
				systemMessage.push({
					type: 'NO_CLIENTS_FOUND',
					message: 'No clients found',
					from: 'Server',
					time: hour()
				});
				this.notifier('systemMessage');
			}
			else if(found === 1){
				awaiTingComplete = {
					start: startUserName,
					complete: tempComplete[0]
				};
				this.notifier('autoComplete');
			}
			else if(found > 1){
				systemMessage.push({
					type: 'TOO_MANY_POSSIBILITIES',
					message: 'Many clients found, here is a list of matching clients',
					args: tempComplete,
					from: 'Server',
					time: hour()
				});
				this.notifier('systemMessage');
			}
		}
	};
	this.getAwaitingAutoComplete = function(){
		return awaiTingComplete;
	};
	this.getSystemMessages = function(){
		var ret = systemMessage.slice(0);
		systemMessage.length = 0;
		return ret;
	};
	this.init = function(){
		setInterval(function(){
			self.getClients();
		}, 10000);

		$.getScript("/javascripts/ressources/less.js");
	};

	socket.on('myRoom', function(roomName){
		if(roomName !== ''){
			inRoom = roomName;
			self.notifier('updateYourSelf');
		}
	});

	socket.on('message', function(args){
		receiveMessage(args);
	});

	socket.on('connected', function(args){
		args.time = hour();
		awaitingMessages.push({type: 'connected', content: args});
		if(args.room === inRoom){
			++pendingMessages;
			self.notifier('newMessage');
			self.notifier('updateTitle');
		}
	});
	socket.on('allClients', function(clients){
		allClients = clients;
		self.notifier('allClients');
	});

	socket.on('yourName', function(yourName){
		myName = yourName;
		self.notifier('yourName');
	});

	socket.on('ping', function(firstPing){
		socket.emit('pong', firstPing);
	});

	socket.on('pong', function(firstPing){
		var actualTime = new Date().getTime();
		var ping = (actualTime - firstPing);
		self.sendMessage({
			text: 'Ping of ' + myName + ' is : ' + ping + 'ms',
			from: 'Server',
			save: false
		});
	});

	socket.on('leave', function(args){
		args.time = hour();
		awaitingMessages.push({
			type: 'leave',
			content: args
		});
		if(args.room === inRoom){
			++pendingMessages;
			self.notifier('newMessage');
			self.notifier('updateTitle');
		}
	});

	function hour(){
		var date = new Date();

		var hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
		var min = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
		var sec = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();

		return '[' + hour + ':' + min + ':' + sec + ']';
	}

	function receiveMessage(args){
		args.time = hour();
		awaitingMessages.push({type: 'newMessage', content: args});
		if(args.room === inRoom){
			self.notifier('newMessage');
			if(args.from !== myName){
				++pendingMessages;
				self.notifier('updateTitle');
			}
		}
	}
}