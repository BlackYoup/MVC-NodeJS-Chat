function LoginView(Model){
	var self = this;
	var myControlers = [];
	var myModel = Model;

	function registerMe(status){
		if(status === 'LOGGED'){
			document.location = './rooms';
		}
		else if(status === 'ALREADY_USED'){
			alert('This username is already used');
			$('#nickname').focus();
		}
		else if(status === 'MAX_LENGTH'){
			alert('Max length of pseudo is 30 chars. Please try again');
			$('#nickname').focus();
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