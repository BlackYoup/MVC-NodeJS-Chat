function RoomsControler(Model){
	var self = this;
	var myModel = Model;

	this.receive = function(command, args){
		switch(command){
			case 'init':
				Model.init();
			break;
			case 'getRooms':
				Model.sendRooms();
			break;
			case 'joinRoom':
				Model.joinRoom(args);
			break;
			default:
				'No action specified for ' + command + 'command';
			break;
		}
	};
}