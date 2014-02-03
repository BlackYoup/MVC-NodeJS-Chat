function LoginView(Model){
	var self = this;
	var myControlers = [];
	var myModel = Model;

	function registerMe(status){
		if(status === 'LOGGED'){
			document.location = './rooms';
		}
		else if(status === 'ALREADY_USED'){
			$('#nickname').focus();
			setTimeout(function(){
				userNotification({
					message: 'This username is already used',
					status: false
				});
			}, 100);
			
		}
		else if(status === 'MAX_LENGTH'){
			$('#nickname').focus();
			setTimeout(function(){
				userNotification({
					message: 'Max length of pseudo is 30 chars. Please try again',
					status: false
				});
			}, 100);
			
		}
		else if(status === 'MIN_LENGTH'){
			$('#nickname').focus();
			setTimeout(function(){
				userNotification({
					message: 'Min length of pseudo is 1 char. Please try again',
					status: false
				});
			}, 100);
		}
		else if(status === 'INVALID_CHARS'){
			$('#nickname').focus();
			setTimeout(function(){
				userNotification({
					message: 'Your pseudo may only contains A-Z a-z, 0-9 characters or it has to be different from "Server" or "Admin"',
					status: false
				});
			}, 100);
		}
		else if(status === 'BANNED'){
			setTimeout(function(){
				userNotification({
					message: 'Your IP is banned from this server',
					status: false
				});
			}, 100);
		}
	}

	this.attach = function(controler){
		myControlers.push(controler);
	};

	this.notify = function(command, args){
		for(var i = 0, j = myControlers.length; i < j; i++){
			myControlers[i].receive(command, args);
		}
	};

	this.update = function(command){
		switch(command){
			case 'login':
				registerMe(Model.getLoginStatus());
			break;
		}
	};

	this.init = function(){
		$('#submitNick').on('click', function(){
			var pseudo = $('#nickname').val().trim();
			self.notify('login', {pseudo: pseudo});
		});

		$('#nickname').on('keypress', function(e){
			if(e.keyCode == 13){
				$('#submitNick').click();
			}
		}).focus();
		self.notify('init');
	};
}