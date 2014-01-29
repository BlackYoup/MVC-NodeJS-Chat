function ChatControler(Model){
	var self = this;
	var Model = Model;

	this.receive = function(command, args){
		var args = args || {};
		switch(command){
			case 'newMessage':
				Model.sendMessage(args);
			break;
			case 'getClients':
				Model.getClients();
			break;
			case 'setRoom':
				Model.setRoom();
			break;
			case 'resetPendings':
				Model.resetPendings();
			break;
			case 'getMyName':
				Model.getMyName();
			break;
			case 'init':
				Model.init();
			break;
			case 'mention':
				Model.mention(args);
			break;
			case 'lastMessageInput':
				Model.sendLastMessage();
			break;
			case 'setSelectedPseudo':
				Model.writeSelectedPseudo(args);
			break;
			case 'autoComplete':
				Model.autoComplete(args);
			break;
			default:
				'No action specified for ' + command + 'command';
			break;
		}
	};
}