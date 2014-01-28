function ChatView(Model){
	var self = this;
	var myControlers = [];

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
			case 'newMessage':
				displayMessage(Model.getAllMessages());
			break;
			case 'allClients':
				displayClient(Model.getAllClients());
			break;
			case 'updateYourSelf':
				updateMySelf();
			break;
			case 'updateTitle':
				updateTitle(Model.getPendingMessage());
			break;
			case 'mention':
				updateMentions(Model.getMentions());
			break;
			case 'lastMessageInput':
				setInput(Model.getLastMessage());
			break;
			case 'getSelectedPSeudo':
				setInput(Model.getLastSelectedPSeudo());
			break;
		}
	};

	this.init = function(){
		$('#sendMessage').on('click', function(){
			var message = $('#messageText').val();
			$('#messageText').val('').focus();
			if(message.trim() !== ''){
				self.notify('newMessage', {text: message});
			}
		});
		$('#messageText').on('keydown', function(e){
			if(e.keyCode == 13){
				$('#sendMessage').click();
			}
			else if(e.keyCode == 38){
				self.notify('lastMessageInput');
			}
			console.log(e);
		}).focus();
		$('#messageText').focus(function(){
			updateTitle(0);
		}).click(function(){
			updateTitle(0);
		});
		this.notify('init');
		this.notify('setRoom');
		this.notify('getClients');
		this.notify('getMyName');
	};

	function displayMessage(allMessages){
		for(var i = 0, j = allMessages.length; i < j; i++){
			if(allMessages[i].type === 'newMessage'){
				var msgInfos = allMessages[i].content;
				var createdDiv = makeDivs(msgInfos.from, msgInfos.text);
				mentionned(createdDiv);
			}
			else if(allMessages[i].type === 'connected'){
				var infos = allMessages[i].content;
				displayClient(infos.userName);
				makeDivs(infos.from, infos.userName + ' has joined the room');
			}
			else if(allMessages[i].type === 'leave'){
				var infos = allMessages[i].content;
				makeDivs(infos.from, infos.userName + ' has left the room');
				$('#' + infos.userName.replace(/ /g, '_')).remove();
			}
			playNotif();
		}
	}

	function makeDivs(from, message){
		var container = $('<div></div>').appendTo($('#messages')).attr('class', 'chatMessage');
		var spanHour = $('<span></span>').attr('class', 'messageHour').text(displayHour()).appendTo(container);
		var spanFrom = $('<span></span>').attr('class', 'messageFrom').text(from).appendTo(container);
		var spanText = $('<span></span>').attr('class', 'messageText').text(message).appendTo(container);
		$('#messagesContainer'). scrollTop(99999999999);
		return spanText;
	}

	function displayClient(psd){

		if(psd instanceof Array){
			for(var i = 0, j = psd.length; i < j; i++){
				displayClient(psd[i]);
			}
		}
		else{
			var psdDiv = psd.replace(/ /g, '_');
			if($('#' + psdDiv).length > 0){
				return false;
			}
			$('<div></div>').appendTo($('#clients')).attr({
				class: 'client',
				id: psdDiv
			}).text(psd).on('click', function(){
				self.notify('setSelectedPseudo', psd);
			});
		}
	}

	function displayHour(){
		var date = new Date();

		var hour = (date.getHours() < 10 ? '0' : '') + date.getHours();
		var min = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
		var sec = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();

		return '[' + hour + ':' + min + ':' + sec + ']';
	}

	function updateMySelf(){
		displayMessage(Model.getAllMessages());
		displayClient(Model.getAllClients());
	}

	function updateTitle(nbr){
		var str = (nbr > 0 ? '(' + nbr + ')' : '');
		$(document).attr('title', 'Chat ' + str);

		if(nbr == 0){
			self.notify('resetPendings');
		}
	}

	function playNotif(){
		document.getElementById('notification').play();
	}

	function mentionned(text){
		self.notify('mention', {
			message: text
		});
	}

	function updateMentions(mentions){
		for(var i = 0, j = mentions.length; i < j; i++){
			var className = mentions[i].class;
			mentions[i].message.attr('class', className);
		}
	}

	function setInput(text){
		var oldVal = $('#messageText').val();
		if(oldVal !== ''){
			oldVal += ' ';
		}
		$('#messageText').val(oldVal + text);
		$('#messageText').on('blur', function(){
			$(this).off('blur');
			setTimeout(function(){
				$('#messageText').focus();
			}, 10);
		}).blur();
	}
}