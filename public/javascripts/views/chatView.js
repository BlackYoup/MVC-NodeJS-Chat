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
				setInput(Model.getLastMessage(), false);
			break;
			case 'getSelectedPSeudo':
				setInput(Model.getLastSelectedPSeudo());
			break;
			case 'autoComplete':
				handleAutoCompletion(Model.getAwaitingAutoComplete());
			break;
			case 'systemMessage':
				displaySystemMessages(Model.getSystemMessages());
			break;
			case 'clear':
				clearChat();
			break;
			case 'showHelp':
				showHelp();
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
			else if(e.keyCode == 9){
				self.notify('autoComplete', $('#messageText').val());
			}
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
		deleteSystemMessages();
		var playNotifSound = true;

		for(var i = 0, j = allMessages.length; i < j; i++){
			if(allMessages[i].type === 'newMessage'){
				var msgInfos = allMessages[i].content;
				var createdDiv = makeDivs(msgInfos.from, msgInfos.text, msgInfos.time);
				mentionned(createdDiv);
				if(msgInfos.me){
					playNotifSound = false;
				}
			}
			else if(allMessages[i].type === 'connected'){
				var infos = allMessages[i].content;
				displayClient(infos.userName);
				makeDivs(infos.from, infos.userName + ' has joined the room', infos.time);
			}
			else if(allMessages[i].type === 'leave'){
				var infos = allMessages[i].content;
				makeDivs(infos.from, infos.userName + ' has left the room', infos.time);
				$('#client' + infos.userName.replace(/ /g, '_')).remove();
			}

			if(playNotifSound){
				playNotif();
			}
		}
	}

	function makeDivs(from, message, hour){
		var container = $('<div></div>').appendTo($('#messages')).attr('class', 'chatMessage');
		var spanHour = $('<span></span>').attr('class', 'messageHour').text(hour).appendTo(container);
		var spanFrom = $('<span></span>').attr('class', 'messageFrom').text(from).appendTo(container);
		var spanText = $('<span></span>').attr('class', 'messageText').text(message);
		spanText = makeUrl(message, spanText);
		spanText.appendTo(container);
		$('#messagesContainer'). scrollTop(99999999999);
		return spanText;
	}

	function makeUrl(message, span){
		var url;
		var urlHttp = message.indexOf('http://');
		
		if(urlHttp < 0){
			var urlHttps = message.indexOf('https://');
			if(urlHttps < 0){
				url = -1;
			}
			else{
				url = urlHttps;
			}
		}
		else{
			url = urlHttp;
		}

		if(url > -1){
			var startUrl = message.substr(url);
			var endSpace = startUrl.indexOf(' ');
			var endUrl = (endSpace > -1 ? endSpace : message.length);
			var allUrl = message.substr(url, endUrl);
			var urlText = '<a href="' + allUrl + '" target="_blank">' + allUrl + '</a>';
		}

		if(typeof urlText !== 'undefined'){
			span.html(span.html().replace(allUrl, urlText));
		}

		if(typeof endUrl !== 'undefined' && (message.indexOf('http://', endUrl) > -1 || message.indexOf('https://', endUrl) > -1)){
			span = makeUrl(message.substr(endUrl+1), span);
		}

		return span;
	}

	function displayClient(psd){

		if(psd instanceof Array){
			for(var i = 0, j = psd.length; i < j; i++){
				displayClient(psd[i]);
			}
		}
		else{
			var psdDiv = psd.replace(/ /g, '_');
			if($('#client' + psdDiv).length > 0){
				return false;
			}
			$('<div></div>').appendTo($('#clients')).attr({
				class: 'client',
				id: 'client'+psdDiv,
				title: psdDiv
			}).text(psd).on('click', function(){
				self.notify('setSelectedPseudo', psd);
			});
		}
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

	function setInput(text, oldValBool){
		var oldValBool = (typeof oldValBool === 'undefined' ? true : oldValBool);

		var oldVal = $('#messageText').val();
		if(oldValBool === false){
			oldVal = '';
		}
		else if(oldVal !== ''){
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

	function handleAutoCompletion(autoComplete){
		var val = $('#messageText').val();
		val = val.replace(new RegExp(autoComplete.start + '$'), autoComplete.complete + ' ');
		$('#messageText').val(val);
		setTimeout(function(){
			$('#messageText').focus();
		}, 50);
	}

	function displaySystemMessages(systemMessage){

		deleteSystemMessages();

		var systemMessageContainer = $('<div></div>').attr('class', 'systemMessageContainer');

		for(var i = 0, j = systemMessage.length; i < j; i++){
			var spanText = makeDivs(systemMessage[i].from, systemMessage[i].message, systemMessage[i].time);
			spanText.attr('class', 'systemMessage');

			var args = systemMessage[i].args || [];

			for(var k = 0, l = args.length; k < l; k++){
				var div = $('<div></div>').appendTo(systemMessageContainer).attr('class', 'systemArgs').text('- ' + args[k]);
			}
		}
		systemMessageContainer.appendTo($('#messages'));
		$('#messagesContainer').scrollTop(99999999999); // this number because $('#messageContainer').height() don't give the good height
		setTimeout(function(){
			$('#messageText').focus();
		}, 50);
	}

	function deleteSystemMessages(){
		$('.systemMessage').parents('.chatMessage').fadeOut(function(){
			$(this).remove();
		});
		$('.systemMessageContainer').fadeOut(function(){
			$(this).remove();
		});
	}

	function clearChat(){
		$('#messages').children().each(function(){
			$(this).fadeOut(function(){
				$(this).remove();
			});
		});
	}
}