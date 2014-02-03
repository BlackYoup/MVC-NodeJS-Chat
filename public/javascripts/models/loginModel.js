function LoginModel(){
	var self = this;
	var socket = io.connect('http://' + SERVER_ADDR + ':' + SERVER_PORT);
	var allViews = [];
	var loginStatus;

	this.attach = function(view){
		allViews.push(view);
	};

	this.login = function(args){
		var regExp = new RegExp('((\\s+|\\W+)|(admin|server)+)', 'gi');
		if(regExp.test(args.pseudo) === true){
			setTimeout(function(){
				userNotification({
					message: 'Your pseudo may only contains A-Z a-z, 0-9 characters or it has to be different from "Server" or "Admin"',
					status: false
				});
			}, 100);
			
			return false;
		}
		else if(args.pseudo.length > 30){
			setTimeout(function(){
				userNotification({
					message: 'Max length of pseudo is 30 chars. Please try again',
					status: false
				});
			}, 100);
			return false;
		}
		else if(args.pseudo.length < 1){
			setTimeout(function(){
				userNotification({
					message: 'Min length of pseudo is 1 char. Please try again',
					status: false
				});
			}, 100);
			return false;
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