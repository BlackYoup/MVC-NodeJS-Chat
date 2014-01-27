function LoginControler(Model){
	var self = this;
	var Model = Model;

	this.receive = function(command, args){
		switch(command){
			case 'login':
				Model.login(args);
			break;
			
			default:
				'No action specified for ' + command + 'command';
			break;
		}
	};
}