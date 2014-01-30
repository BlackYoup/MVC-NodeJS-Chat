function LoginModel(){
	var self = this;
	var socket = io.connect('http://' + SERVER_ADDR + ':' + SERVER_PORT);
	var allViews = [];
	var loginStatus;

	this.attach = function(view){
		allViews.push(view);
	};

	this.login = function(args){
		var pattern = /^\w*$/;
		if(args.pseudo.match(pattern) === null){
			setTimeout(function(){
				userNotification({
					message: 'Your pseudo may only contains A-Z a-z or 0-9 characters',
					status: false
				});
			}, 200);
			
			return false;
		}
		else if(args.pseudo.length > 30){
			alert('Max length of pseudo is 30 chars. Please try again');
		}
		else{
			socket.emit('login', args.pseudo);
		}
	};
	this.notifier = function(command){
		for(var i = 0, j = allViews.length; i < j; i++){
			allViews[i].update(command);
		}
	};
	this.getLoginStatus = function(){
		return loginStatus;
	};
	this.init = function(){
		socket = surchargeSocketIO(socket);
	}

	socket.on('registration', function(status){
		loginStatus = status;
		self.notifier('login');
	});
}